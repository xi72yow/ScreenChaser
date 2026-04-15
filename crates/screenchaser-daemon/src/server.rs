use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use serde::{Deserialize, Serialize};
use tracing::{debug, warn};

use crate::state::{Command, SharedState};

pub fn router(state: Arc<SharedState>) -> Router {
    Router::new()
        .route("/ws", get(ws_upgrade))
        .with_state(state)
}

async fn ws_upgrade(
    ws: WebSocketUpgrade,
    State(state): State<Arc<SharedState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_ws(socket, state))
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientMsg {
    GetConfig,
    GetStatus,
    UpdateDevice {
        id: String,
        config: screenchaser_config::DeviceConfig,
    },
    ToggleDevice {
        id: String,
        enabled: bool,
    },
    RemoveDevice {
        id: String,
    },
    ScanNetwork,
    SetPreview {
        enabled: bool,
    },
    UpdateCapture {
        config: screenchaser_config::CaptureConfig,
    },
}

#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredDeviceInfo {
    pub ip: String,
    pub name: String,
    pub led_count: u32,
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ServerMsg {
    Config {
        config: screenchaser_config::AppConfig,
    },
    Status {
        #[serde(flatten)]
        status: crate::state::DaemonStatus,
    },
    LedColors {
        colors: std::collections::HashMap<String, Vec<screenchaser_config::RgbColor>>,
    },
    ScanResult {
        devices: Vec<DiscoveredDeviceInfo>,
    },
    ConfigUpdated,
    Error {
        message: String,
    },
}

async fn handle_ws(mut socket: WebSocket, state: Arc<SharedState>) {
    debug!("websocket client connected");

    let mut status_rx = state.status_rx.clone();
    let mut colors_rx = state.colors_rx.clone();
    let mut preview_rx = state.preview_rx.clone();
    let mut wants_preview = false;

    loop {
        tokio::select! {
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        match handle_client_msg(&text, &state, &mut socket, &mut wants_preview).await {
                            Ok(()) => {}
                            Err(e) => {
                                warn!("ws message handling failed: {e}");
                                let _ = send_json(&mut socket, &ServerMsg::Error {
                                    message: e.to_string(),
                                }).await;
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        debug!("websocket client disconnected");
                        if wants_preview {
                            state.preview_clients.store(false, std::sync::atomic::Ordering::Relaxed);
                        }
                        break;
                    }
                    Some(Err(e)) => {
                        debug!("websocket error: {e}");
                        break;
                    }
                    _ => {}
                }
            }
            Ok(()) = status_rx.changed() => {
                let status = status_rx.borrow_and_update().clone();
                let _ = send_json(&mut socket, &ServerMsg::Status { status }).await;
            }
            Ok(()) = colors_rx.changed() => {
                let colors = colors_rx.borrow_and_update().clone();
                if !colors.is_empty() {
                    let _ = send_json(&mut socket, &ServerMsg::LedColors { colors }).await;
                }
            }
            Ok(()) = preview_rx.changed(), if wants_preview => {
                let data = preview_rx.borrow_and_update().clone();
                if let Some(jpeg) = data {
                    let _ = socket.send(Message::Binary(jpeg.into())).await;
                }
            }
        }
    }
}

async fn handle_client_msg(
    text: &str,
    state: &SharedState,
    socket: &mut WebSocket,
    wants_preview: &mut bool,
) -> anyhow::Result<()> {
    let msg: ClientMsg = serde_json::from_str(text)?;

    match msg {
        ClientMsg::GetConfig => {
            let config = state.config.read().await.clone();
            send_json(socket, &ServerMsg::Config { config }).await?;
        }
        ClientMsg::GetStatus => {
            let status = state.status_rx.borrow().clone();
            send_json(socket, &ServerMsg::Status { status }).await?;
        }
        ClientMsg::UpdateDevice { id, config } => {
            let mut app_config = state.config.read().await.clone();
            let duplicate = app_config.devices.iter().any(|(existing_id, dev)| {
                *existing_id != id && dev.ip == config.ip
            });
            if duplicate {
                send_json(socket, &ServerMsg::Error {
                    message: format!("device with ip {} already exists", config.ip),
                }).await?;
            } else {
                app_config.devices.insert(id, config);
                state.cmd_tx.send(Command::UpdateConfig(app_config)).await?;
                send_json(socket, &ServerMsg::ConfigUpdated).await?;
            }
        }
        ClientMsg::ToggleDevice { id, enabled } => {
            let mut app_config = state.config.read().await.clone();
            if let Some(dev) = app_config.devices.get_mut(&id) {
                dev.enabled = enabled;
                state.cmd_tx.send(Command::UpdateConfig(app_config)).await?;
                send_json(socket, &ServerMsg::ConfigUpdated).await?;
            } else {
                send_json(socket, &ServerMsg::Error {
                    message: format!("unknown device: {id}"),
                }).await?;
            }
        }
        ClientMsg::RemoveDevice { id } => {
            let mut app_config = state.config.read().await.clone();
            app_config.devices.remove(&id);
            state.cmd_tx.send(Command::UpdateConfig(app_config)).await?;
            send_json(socket, &ServerMsg::ConfigUpdated).await?;
        }
        ClientMsg::ScanNetwork => {
            debug!("starting network scan");
            let discovered = screenchaser_wled::discover_wled_devices(
                std::time::Duration::from_secs(5),
            )
            .await
            .unwrap_or_default();

            let mut app_config = state.config.read().await.clone();
            let mut name_updated = false;

            for d in &discovered {
                for dev in app_config.devices.values_mut() {
                    if dev.ip == d.ip && dev.name != d.name {
                        debug!(ip = %d.ip, old = %dev.name, new = %d.name, "updating device name");
                        dev.name = d.name.clone();
                        name_updated = true;
                    }
                }
            }

            if name_updated {
                state.cmd_tx.send(Command::UpdateConfig(app_config.clone())).await?;
            }

            let existing_ips: std::collections::HashSet<_> =
                app_config.devices.values().map(|d| d.ip).collect();

            let devices: Vec<DiscoveredDeviceInfo> = discovered
                .into_iter()
                .filter(|d| !existing_ips.contains(&d.ip))
                .map(|d| DiscoveredDeviceInfo {
                    ip: d.ip.to_string(),
                    name: d.name,
                    led_count: d.led_count,
                })
                .collect();

            debug!(count = devices.len(), "scan complete");
            send_json(socket, &ServerMsg::ScanResult { devices }).await?;

            if name_updated {
                let config = state.config.read().await.clone();
                send_json(socket, &ServerMsg::Config { config }).await?;
            }
        }
        ClientMsg::SetPreview { enabled } => {
            *wants_preview = enabled;
            state
                .preview_clients
                .store(enabled, std::sync::atomic::Ordering::Relaxed);
            debug!(enabled, "preview stream toggled");
        }
        ClientMsg::UpdateCapture { config } => {
            let mut app_config = state.config.read().await.clone();
            app_config.capture = config;
            state.cmd_tx.send(Command::UpdateConfig(app_config)).await?;
            send_json(socket, &ServerMsg::ConfigUpdated).await?;
        }
    }

    Ok(())
}

async fn send_json(socket: &mut WebSocket, msg: &ServerMsg) -> anyhow::Result<()> {
    let json = serde_json::to_string(msg)?;
    socket.send(Message::Text(json.into())).await?;
    Ok(())
}
