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
        let rt = tokio::runtime::Runtime::new()?;
        rt.block_on(run_daemon(cli.bind))?;
    } else {
        screenchaser_webview::run(move |handle| {
            let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
            if let Err(e) = rt.block_on(run_daemon(cli.bind)) {
                error!("daemon error: {e}");
            }
            handle.close();
        });
    }

    Ok(())
}

async fn run_daemon(bind: String) -> Result<()> {
    let mut config = screenchaser_config::load_config().unwrap_or_else(|e| {
        warn!("failed to load config, using defaults: {e}");
        screenchaser_config::AppConfig::default()
    });

    info!(bind = %bind, "starting screenchaser daemon");

    let capture = match config.restore_token.as_deref() {
        Some(token) => {
            info!("resuming capture with stored token");
            match screenchaser_capture::WaylandCapture::resume(token).await {
                Ok(c) => c,
                Err(e) => {
                    warn!("resume failed ({e}), running setup");
                    let (c, new_token) =
                        screenchaser_capture::WaylandCapture::setup().await?;
                    config.restore_token = Some(new_token);
                    screenchaser_config::save_config(&config)
                        .map_err(|e| anyhow::anyhow!("{e}"))?;
                    c
                }
            }
        }
        None => {
            info!("no restore token, running portal setup");
            let (c, new_token) =
                screenchaser_capture::WaylandCapture::setup().await?;
            config.restore_token = Some(new_token);
            screenchaser_config::save_config(&config)
                .map_err(|e| anyhow::anyhow!("{e}"))?;
            c
        }
    };
    info!("capture initialized");

    let gpu = screenchaser_gpu::GpuPipeline::new().await?;
    info!("gpu pipeline initialized");

    let (cmd_tx, cmd_rx, status_tx, status_rx, colors_tx, colors_rx) =
        state::create_channels();
    let shared = state::build_shared_state(config.clone(), cmd_tx, status_rx, colors_rx);

    let shared_clone = shared.clone();
    tokio::spawn(async move {
        processing::run(capture, gpu, config, shared_clone, cmd_rx, status_tx, colors_tx)
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
