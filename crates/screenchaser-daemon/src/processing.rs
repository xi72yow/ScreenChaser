use std::collections::HashMap;
use std::io::Cursor;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::{Duration, Instant};

use screenchaser_capture::WaylandCapture;
use screenchaser_config::{generate_led_fields, AppConfig, RgbColor};
use screenchaser_gpu::GpuPipeline;
use screenchaser_wled::WledUdpSender;
use tokio::sync::{mpsc, watch};
use tracing::{debug, error, info, warn};

use crate::state::{Command, DaemonStatus, DeviceStatus, SharedState};

struct PreviewSettings {
    width: u32,
    fps_divider: u64,
}

struct DeviceRuntime {
    udp: WledUdpSender,
    enabled: bool,
    led_count: u32,
}

pub async fn run(
    capture: WaylandCapture,
    mut gpu: GpuPipeline,
    config: AppConfig,
    shared: Arc<SharedState>,
    mut cmd_rx: mpsc::Receiver<Command>,
    status_tx: watch::Sender<DaemonStatus>,
    colors_tx: watch::Sender<HashMap<String, Vec<RgbColor>>>,
    preview_tx: watch::Sender<Option<Vec<u8>>>,
) {
    let mut devices = register_devices(&mut gpu, &config).await;
    let mut target_fps = config.capture.target_fps.max(1);
    let mut preview_settings = preview_settings_from_config(&config);
    let mut interval =
        tokio::time::interval(Duration::from_micros(1_000_000 / target_fps as u64));
    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

    let mut frame_count = 0u64;
    let mut tick_count = 0u64;
    let mut fps_timer = Instant::now();
    let mut current_fps = 0.0f32;
    let mut status_interval = tokio::time::interval(Duration::from_secs(1));

    info!(
        fps = target_fps,
        devices = devices.len(),
        "processing loop started"
    );

    loop {
        tokio::select! {
            _ = interval.tick() => {
                process_tick(
                    &capture, &mut gpu, &mut devices, &colors_tx,
                    &preview_tx, &shared, &preview_settings, &mut tick_count,
                ).await;
                tick_count += 1;
                frame_count += 1;

                let elapsed = fps_timer.elapsed().as_secs_f32();
                if elapsed >= 1.0 {
                    current_fps = frame_count as f32 / elapsed;
                    debug!(fps = format!("{:.1}", current_fps), "processing");
                    frame_count = 0;
                    fps_timer = Instant::now();
                }
            }
            _ = status_interval.tick() => {
                let status = DaemonStatus {
                    fps: current_fps,
                    capturing: true,
                    devices: devices.iter().map(|(id, d)| {
                        (id.clone(), DeviceStatus {
                            enabled: d.enabled,
                            led_count: d.led_count,
                            sending: d.enabled,
                        })
                    }).collect(),
                };
                let _ = status_tx.send(status);
            }
            cmd = cmd_rx.recv() => {
                match cmd {
                    Some(Command::UpdateConfig(new_config)) => {
                        info!("applying config update");
                        devices = register_devices(&mut gpu, &new_config).await;
                        target_fps = new_config.capture.target_fps.max(1);
                        preview_settings = preview_settings_from_config(&new_config);
                        interval = tokio::time::interval(Duration::from_micros(
                            1_000_000 / target_fps as u64,
                        ));
                        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

                        *shared.config.write().await = new_config.clone();
                        if let Err(e) = screenchaser_config::save_config(&new_config) {
                            error!("failed to save config: {e}");
                        }
                    }
                    Some(Command::Shutdown) | None => {
                        info!("processing loop shutting down");
                        break;
                    }
                }
            }
        }
    }
}

async fn process_tick(
    capture: &WaylandCapture,
    gpu: &mut GpuPipeline,
    devices: &mut HashMap<String, DeviceRuntime>,
    colors_tx: &watch::Sender<HashMap<String, Vec<RgbColor>>>,
    preview_tx: &watch::Sender<Option<Vec<u8>>>,
    shared: &SharedState,
    pv: &PreviewSettings,
    tick_count: &mut u64,
) {
    let Some(frame) = capture.current_frame() else {
        return;
    };

    gpu.upload_frame(&frame);

    let mut all_colors = HashMap::new();

    for (id, dev) in devices.iter() {
        if !dev.enabled {
            continue;
        }
        match gpu.process_device(id) {
            Ok(colors) => {
                if let Err(e) = dev.udp.send_colors(&colors).await {
                    debug!(device = %id, "udp send failed: {e}");
                }
                all_colors.insert(id.clone(), colors);
            }
            Err(e) => {
                debug!(device = %id, "gpu process failed: {e}");
            }
        }
    }

    let _ = colors_tx.send(all_colors);

    if shared.preview_clients.load(Ordering::Relaxed) && *tick_count % pv.fps_divider.max(1) == 0 {
        match gpu.downscale_frame(pv.width) {
            Ok((w, h, rgba)) => {
                let mut msg = Vec::with_capacity(8 + rgba.len());
                msg.extend_from_slice(&w.to_le_bytes());
                msg.extend_from_slice(&h.to_le_bytes());
                msg.extend_from_slice(&rgba);
                let _ = preview_tx.send(Some(msg));
            }
            Err(e) => debug!("downscale failed: {e}"),
        }
    }
}

fn preview_settings_from_config(config: &AppConfig) -> PreviewSettings {
    let target_fps = config.capture.target_fps.max(1);
    let preview_fps = config.capture.preview_fps.max(1);
    PreviewSettings {
        width: config.capture.preview_width.max(100),
        fps_divider: (target_fps / preview_fps).max(1) as u64,
    }
}

async fn register_devices(
    gpu: &mut GpuPipeline,
    config: &AppConfig,
) -> HashMap<String, DeviceRuntime> {
    let mut devices = HashMap::new();
    let fps = config.capture.target_fps.max(1);

    for (id, dev_config) in &config.devices {
        let fields = generate_led_fields(&dev_config.chaser);
        if fields.is_empty() {
            warn!(device = %id, "no led fields generated, skipping");
            continue;
        }

        let buffer_frames = (fps as f32 * dev_config.chaser.buffer_seconds) as u32;
        gpu.register_device(id, &fields, buffer_frames.max(1));

        match WledUdpSender::new(dev_config.ip).await {
            Ok(udp) => {
                info!(
                    device = %id,
                    ip = %dev_config.ip,
                    leds = fields.len(),
                    "registered device"
                );
                devices.insert(
                    id.clone(),
                    DeviceRuntime {
                        udp,
                        enabled: dev_config.enabled,
                        led_count: fields.len() as u32,
                    },
                );
            }
            Err(e) => {
                error!(device = %id, "failed to create udp sender: {e}");
            }
        }
    }

    devices
}
