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

    loop {
        tokio::select! {
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Err(e) = handle_client_msg(&text, &state, &mut socket).await {
                            warn!("ws message handling failed: {e}");
                            let _ = send_json(&mut socket, &ServerMsg::Error {
                                message: e.to_string(),
                            }).await;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        debug!("websocket client disconnected");
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
        }
    }
}

async fn handle_client_msg(
    text: &str,
    state: &SharedState,
    socket: &mut WebSocket,
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
            app_config.devices.insert(id, config);
            state.cmd_tx.send(Command::UpdateConfig(app_config)).await?;
            send_json(socket, &ServerMsg::ConfigUpdated).await?;
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

            let devices: Vec<DiscoveredDeviceInfo> = discovered
                .into_iter()
                .map(|d| DiscoveredDeviceInfo {
                    ip: d.ip.to_string(),
                    name: d.name,
                    led_count: d.led_count,
                })
                .collect();

            debug!(count = devices.len(), "scan complete");
            send_json(socket, &ServerMsg::ScanResult { devices }).await?;
        }
    }

    Ok(())
}

async fn send_json(socket: &mut WebSocket, msg: &ServerMsg) -> anyhow::Result<()> {
    let json = serde_json::to_string(msg)?;
    socket.send(Message::Text(json.into())).await?;
    Ok(())
}
