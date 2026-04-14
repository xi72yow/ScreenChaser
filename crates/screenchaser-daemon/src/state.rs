use std::collections::HashMap;
use std::sync::Arc;

use screenchaser_config::{AppConfig, RgbColor};
use serde::Serialize;
use tokio::sync::{mpsc, watch, RwLock};

#[derive(Debug)]
pub enum Command {
    UpdateConfig(AppConfig),
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct DaemonStatus {
    pub fps: f32,
    pub capturing: bool,
    pub devices: HashMap<String, DeviceStatus>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DeviceStatus {
    pub enabled: bool,
    pub led_count: u32,
    pub sending: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct LedColorUpdate {
    pub device_id: String,
    pub colors: Vec<RgbColor>,
}

pub struct SharedState {
    pub config: RwLock<AppConfig>,
    pub cmd_tx: mpsc::Sender<Command>,
    pub status_rx: watch::Receiver<DaemonStatus>,
    pub colors_rx: watch::Receiver<HashMap<String, Vec<RgbColor>>>,
}

pub fn create_channels() -> (
    mpsc::Sender<Command>,
    mpsc::Receiver<Command>,
    watch::Sender<DaemonStatus>,
    watch::Receiver<DaemonStatus>,
    watch::Sender<HashMap<String, Vec<RgbColor>>>,
    watch::Receiver<HashMap<String, Vec<RgbColor>>>,
) {
    let (cmd_tx, cmd_rx) = mpsc::channel(16);
    let (status_tx, status_rx) = watch::channel(DaemonStatus::default());
    let (colors_tx, colors_rx) = watch::channel(HashMap::new());
    (cmd_tx, cmd_rx, status_tx, status_rx, colors_tx, colors_rx)
}

pub fn build_shared_state(
    config: AppConfig,
    cmd_tx: mpsc::Sender<Command>,
    status_rx: watch::Receiver<DaemonStatus>,
    colors_rx: watch::Receiver<HashMap<String, Vec<RgbColor>>>,
) -> Arc<SharedState> {
    Arc::new(SharedState {
        config: RwLock::new(config),
        cmd_tx,
        status_rx,
        colors_rx,
    })
}
