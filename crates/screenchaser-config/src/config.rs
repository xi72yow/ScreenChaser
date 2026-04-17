use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_bind_address")]
    pub bind_address: String,
    #[serde(default)]
    pub restore_token: Option<String>,
    #[serde(default)]
    pub capture: CaptureConfig,
    #[serde(default)]
    pub devices: HashMap<String, DeviceConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    #[serde(default = "default_target_fps")]
    pub target_fps: u32,
    #[serde(default)]
    pub monitor_index: u32,
    #[serde(default = "default_preview_width")]
    pub preview_width: u32,
    #[serde(default = "default_preview_quality")]
    pub preview_quality: u8,
    #[serde(default = "default_preview_fps")]
    pub preview_fps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceConfig {
    pub ip: Ipv4Addr,
    #[serde(default)]
    pub name: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    pub chaser: ChaserConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChaserConfig {
    #[serde(default)]
    pub led_count_top: u32,
    #[serde(default)]
    pub led_count_bottom: u32,
    #[serde(default)]
    pub led_count_left: u32,
    #[serde(default)]
    pub led_count_right: u32,
    #[serde(default = "default_field_size")]
    pub field_width: f32,
    #[serde(default = "default_field_size")]
    pub field_height: f32,
    #[serde(default)]
    pub start_led: u32,
    #[serde(default = "default_true")]
    pub clockwise: bool,
    #[serde(default = "default_buffer_seconds")]
    pub buffer_seconds: f32,
    #[serde(default)]
    pub fields: Option<Vec<crate::LedField>>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            bind_address: default_bind_address(),
            restore_token: None,
            capture: CaptureConfig::default(),
            devices: HashMap::new(),
        }
    }
}

impl Default for CaptureConfig {
    fn default() -> Self {
        Self {
            target_fps: default_target_fps(),
            monitor_index: 0,
            preview_width: default_preview_width(),
            preview_quality: default_preview_quality(),
            preview_fps: default_preview_fps(),
        }
    }
}

impl Default for ChaserConfig {
    fn default() -> Self {
        Self {
            led_count_top: 0,
            led_count_bottom: 0,
            led_count_left: 0,
            led_count_right: 0,
            field_width: default_field_size(),
            field_height: default_field_size(),
            start_led: 0,
            clockwise: true,
            buffer_seconds: default_buffer_seconds(),
            fields: None,
        }
    }
}

fn default_bind_address() -> String {
    "127.0.0.1:19447".to_string()
}

fn default_target_fps() -> u32 {
    60
}

fn default_preview_width() -> u32 {
    960
}

fn default_preview_quality() -> u8 {
    70
}

fn default_preview_fps() -> u32 {
    15
}

fn default_field_size() -> f32 {
    10.0
}

fn default_buffer_seconds() -> f32 {
    5.0
}

fn default_true() -> bool {
    true
}

pub fn config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("~/.config"))
        .join("screenchaser")
        .join("config.toml")
}

pub fn load_config() -> Result<AppConfig, Box<dyn std::error::Error>> {
    let path = config_path();
    if path.exists() {
        let content = std::fs::read_to_string(&path)?;
        Ok(toml::from_str(&content)?)
    } else {
        Ok(AppConfig::default())
    }
}

pub fn save_config(config: &AppConfig) -> Result<(), Box<dyn std::error::Error>> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let content = toml::to_string_pretty(config)?;
    std::fs::write(&path, content)?;
    Ok(())
}
