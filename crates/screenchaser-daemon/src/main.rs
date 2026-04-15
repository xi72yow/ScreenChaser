mod processing;
mod server;
mod state;

use anyhow::Result;
use clap::Parser;
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

#[derive(Parser, Debug)]
#[command(name = "screenchaser", about = "ambient lighting daemon for wled")]
struct Cli {
    #[arg(long, default_value = "127.0.0.1:19447")]
    bind: String,

    #[arg(long, default_value = "info")]
    log_level: String,

    #[arg(long)]
    no_gui: bool,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new(&cli.log_level)),
        )
        .init();

    if cli.no_gui {
        info!("running headless");
        let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
        if let Err(e) = rt.block_on(run_daemon(cli.bind)) {
            error!("daemon error: {e}");
        }
    } else {
        let (handle_tx, handle_rx) = std::sync::mpsc::channel::<screenchaser_webview::WebviewHandle>();

        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
            if let Err(e) = rt.block_on(run_daemon(cli.bind)) {
                error!("daemon error: {e}");
            }
            if let Ok(handle) = handle_rx.recv() {
                handle.close();
            }
        });

        screenchaser_webview::run(move |handle| {
            let _ = handle_tx.send(handle);
        });
    }

    Ok(())
}

async fn run_daemon(bind: String) -> Result<()> {
    let config = screenchaser_config::load_config().unwrap_or_else(|e| {
        warn!("failed to load config, using defaults: {e}");
        screenchaser_config::AppConfig::default()
    });

    info!(bind = %bind, "starting screenchaser daemon");

    let ch = state::create_channels();
    let shared = state::build_shared_state(
        config.clone(),
        ch.cmd_tx,
        ch.status_rx,
        ch.colors_rx,
        ch.preview_rx,
    );

    let shared_clone = shared.clone();
    tokio::spawn(async move {
        let mut config = config;

        let capture = match init_capture(&mut config).await {
            Ok(c) => c,
            Err(e) => {
                error!("capture initialization failed: {e}");
                return;
            }
        };
        info!("capture initialized");

        let gpu = match screenchaser_gpu::GpuPipeline::new().await {
            Ok(g) => g,
            Err(e) => {
                error!("gpu pipeline failed: {e}");
                return;
            }
        };
        info!("gpu pipeline initialized");

        *shared_clone.config.write().await = config.clone();

        processing::run(
            capture,
            gpu,
            config,
            shared_clone,
            ch.cmd_rx,
            ch.status_tx,
            ch.colors_tx,
            ch.preview_tx,
        )
        .await;
    });

    let app = server::router(shared.clone());
    let listener = tokio::net::TcpListener::bind(&bind).await?;
    info!(bind = %bind, "ws server listening");

    tokio::select! {
        result = axum::serve(listener, app) => {
            if let Err(e) = result {
                error!("server error: {e}");
            }
        }
        _ = tokio::signal::ctrl_c() => {
            info!("ctrl+c received");
            let _ = shared.cmd_tx.send(state::Command::Shutdown).await;
        }
    }

    info!("daemon stopped");
    Ok(())
}

async fn init_capture(
    config: &mut screenchaser_config::AppConfig,
) -> Result<screenchaser_capture::WaylandCapture> {
    match config.restore_token.as_deref() {
        Some(token) => {
            info!("resuming capture with stored token");
            match screenchaser_capture::WaylandCapture::resume(token).await {
                Ok(c) => {
                    if let Some(new_token) = c.restore_token() {
                        if new_token != token {
                            info!("portal returned updated restore token");
                            config.restore_token = Some(new_token.to_string());
                            screenchaser_config::save_config(config)
                                .map_err(|e| anyhow::anyhow!("{e}"))?;
                        }
                    }
                    Ok(c)
                }
                Err(e) => {
                    warn!("resume failed ({e}), running setup");
                    let (c, new_token) =
                        screenchaser_capture::WaylandCapture::setup().await?;
                    config.restore_token = Some(new_token);
                    screenchaser_config::save_config(config)
                        .map_err(|e| anyhow::anyhow!("{e}"))?;
                    Ok(c)
                }
            }
        }
        None => {
            info!("no restore token, running portal setup");
            let (c, new_token) =
                screenchaser_capture::WaylandCapture::setup().await?;
            config.restore_token = Some(new_token);
            screenchaser_config::save_config(config)
                .map_err(|e| anyhow::anyhow!("{e}"))?;
            Ok(c)
        }
    }
}
