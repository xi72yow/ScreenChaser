use serde::{Deserialize, Serialize};
use std::net::Ipv4Addr;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("http request failed: {0}")]
    Http(#[from] reqwest::Error),
}

#[derive(Debug, Clone, Deserialize)]
pub struct WledDeviceData {
    pub state: WledState,
    pub info: WledInfo,
    #[serde(default)]
    pub effects: Vec<String>,
    #[serde(default)]
    pub palettes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WledState {
    pub on: bool,
    pub bri: u8,
    #[serde(default)]
    pub transition: u16,
    #[serde(default)]
    pub seg: Vec<WledSegment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WledSegment {
    #[serde(default)]
    pub start: u32,
    #[serde(default)]
    pub stop: u32,
    #[serde(default)]
    pub len: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WledInfo {
    pub ver: String,
    pub leds: WledLedInfo,
    pub name: String,
    #[serde(default)]
    pub mac: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WledLedInfo {
    pub count: u32,
}

pub async fn fetch_wled_info(ip: Ipv4Addr) -> Result<WledDeviceData, ApiError> {
    let url = format!("http://{}/json", ip);
    let resp = reqwest::get(&url).await?.json::<WledDeviceData>().await?;
    Ok(resp)
}

pub async fn is_reachable(ip: Ipv4Addr) -> bool {
    let url = format!("http://{}/json/info", ip);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .unwrap();
    client.get(&url).send().await.is_ok()
}

pub async fn set_wled_state(ip: Ipv4Addr, state: &WledState) -> Result<WledDeviceData, ApiError> {
    let url = format!("http://{}/json/state", ip);
    let resp = reqwest::Client::new()
        .post(&url)
        .json(state)
        .send()
        .await?
        .json::<WledDeviceData>()
        .await?;
    Ok(resp)
}
