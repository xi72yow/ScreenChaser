use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
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

pub struct SharedState {
    pub config: RwLock<AppConfig>,
    pub cmd_tx: mpsc::Sender<Command>,
    pub status_rx: watch::Receiver<DaemonStatus>,
    pub colors_rx: watch::Receiver<HashMap<String, Vec<RgbColor>>>,
    pub preview_rx: watch::Receiver<Option<Vec<u8>>>,
    pub preview_clients: AtomicBool,
}

pub struct ChannelSet {
    pub cmd_tx: mpsc::Sender<Command>,
    pub cmd_rx: mpsc::Receiver<Command>,
    pub status_tx: watch::Sender<DaemonStatus>,
    pub status_rx: watch::Receiver<DaemonStatus>,
    pub colors_tx: watch::Sender<HashMap<String, Vec<RgbColor>>>,
    pub colors_rx: watch::Receiver<HashMap<String, Vec<RgbColor>>>,
    pub preview_tx: watch::Sender<Option<Vec<u8>>>,
    pub preview_rx: watch::Receiver<Option<Vec<u8>>>,
}

pub fn create_channels() -> ChannelSet {
    let (cmd_tx, cmd_rx) = mpsc::channel(16);
    let (status_tx, status_rx) = watch::channel(DaemonStatus::default());
    let (colors_tx, colors_rx) = watch::channel(HashMap::new());
    let (preview_tx, preview_rx) = watch::channel(None);
    ChannelSet {
        cmd_tx,
        cmd_rx,
        status_tx,
        status_rx,
        colors_tx,
        colors_rx,
        preview_tx,
        preview_rx,
    }
}

pub fn build_shared_state(
    config: AppConfig,
    cmd_tx: mpsc::Sender<Command>,
    status_rx: watch::Receiver<DaemonStatus>,
    colors_rx: watch::Receiver<HashMap<String, Vec<RgbColor>>>,
    preview_rx: watch::Receiver<Option<Vec<u8>>>,
) -> Arc<SharedState> {
    Arc::new(SharedState {
        config: RwLock::new(config),
        cmd_tx,
        status_rx,
        colors_rx,
        preview_rx,
        preview_clients: AtomicBool::new(false),
    })
}
