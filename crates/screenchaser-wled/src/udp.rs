use screenchaser_config::RgbColor;
use std::net::{Ipv4Addr, SocketAddrV4};
use thiserror::Error;
use tokio::net::UdpSocket;

const WLED_UDP_PORT: u16 = 21324;
const DRGB_PROTOCOL: u8 = 0x02;
const TIMEOUT_SECONDS: u8 = 255;

#[derive(Error, Debug)]
pub enum UdpError {
    #[error("socket error: {0}")]
    Socket(#[from] std::io::Error),
}

pub struct WledUdpSender {
    socket: UdpSocket,
    target: SocketAddrV4,
}

impl WledUdpSender {
    pub async fn new(ip: Ipv4Addr) -> Result<Self, UdpError> {
        let socket = UdpSocket::bind("0.0.0.0:0").await?;
        Ok(Self {
            socket,
            target: SocketAddrV4::new(ip, WLED_UDP_PORT),
        })
    }

    pub async fn send_colors(&self, colors: &[RgbColor]) -> Result<usize, UdpError> {
        let packet = build_drgb_packet(colors);
        let sent = self.socket.send_to(&packet, self.target).await?;
        tracing::trace!(
            target = %self.target,
            packet_len = packet.len(),
            sent_bytes = sent,
            packet_hex = %hex_str(&packet),
            "udp packet sent",
        );
        Ok(sent)
    }

    pub fn target(&self) -> SocketAddrV4 {
        self.target
    }
}

fn hex_str(data: &[u8]) -> String {
    data.iter().map(|b| format!("{b:02x}")).collect()
}

fn build_drgb_packet(colors: &[RgbColor]) -> Vec<u8> {
    let mut packet = Vec::with_capacity(2 + colors.len() * 3);
    packet.push(DRGB_PROTOCOL);
    packet.push(TIMEOUT_SECONDS);
    for color in colors {
        packet.push(color.r);
        packet.push(color.g);
        packet.push(color.b);
    }
    packet
}
