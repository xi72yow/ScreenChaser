use std::net::Ipv4Addr;
use std::time::Duration;
use thiserror::Error;
use tracing::info;

#[derive(Error, Debug)]
pub enum DiscoveryError {
    #[error("mdns daemon failed: {0}")]
    Mdns(String),
    #[error("device query failed: {0}")]
    Query(String),
}

#[derive(Debug, Clone)]
pub struct DiscoveredDevice {
    pub ip: Ipv4Addr,
    pub name: String,
    pub led_count: u32,
}

pub async fn discover_wled_devices(
    timeout: Duration,
) -> Result<Vec<DiscoveredDevice>, DiscoveryError> {
    let mdns = mdns_sd::ServiceDaemon::new()
        .map_err(|e| DiscoveryError::Mdns(e.to_string()))?;

    let receiver = mdns
        .browse("_http._tcp.local.")
        .map_err(|e| DiscoveryError::Mdns(e.to_string()))?;

    let mut devices = Vec::new();
    let deadline = tokio::time::Instant::now() + timeout;

    while tokio::time::Instant::now() < deadline {
        match receiver.recv_timeout(Duration::from_millis(100)) {
            Ok(mdns_sd::ServiceEvent::ServiceResolved(info)) => {
                if let Some(ip) = info.get_addresses_v4().into_iter().next() {
                    match crate::api::fetch_wled_info(*ip).await {
                        Ok(data) => {
                            info!(ip = %ip, name = %data.info.name, "discovered wled device");
                            devices.push(DiscoveredDevice {
                                ip: *ip,
                                name: data.info.name,
                                led_count: data.info.leds.count,
                            });
                        }
                        Err(_) => {} // not a wled device
                    }
                }
            }
            Ok(_) => {}
            Err(_) => {}
        }
    }

    let _ = mdns.shutdown();
    Ok(devices)
}
