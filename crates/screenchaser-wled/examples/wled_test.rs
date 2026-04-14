use screenchaser_config::RgbColor;
use screenchaser_wled::{discover_wled_devices, fetch_wled_info, WledUdpSender};
use std::net::Ipv4Addr;
use std::time::Duration;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    println!("=== wled pipeline test ===\n");

    // test 1: mdns discovery
    println!("[1] scanning for wled devices (10s)...");
    let devices = match discover_wled_devices(Duration::from_secs(10)).await {
        Ok(d) => {
            if d.is_empty() {
                println!("    no devices found");
                println!("    -> SKIP (no devices on network)\n");
                println!("    hint: pass an IP as argument to test directly");
                println!("    usage: ./wled_test <ip>\n");
            } else {
                for dev in &d {
                    println!(
                        "    found: {} ({}) - {} LEDs",
                        dev.name, dev.ip, dev.led_count
                    );
                }
                println!("    -> PASS\n");
            }
            d
        }
        Err(e) => {
            println!("    discovery error: {e}");
            println!("    -> FAIL\n");
            vec![]
        }
    };

    let target_ip: Option<Ipv4Addr> = std::env::args()
        .nth(1)
        .and_then(|s| s.parse().ok())
        .or_else(|| devices.first().map(|d| d.ip));

    let Some(ip) = target_ip else {
        println!("no target device available, skipping remaining tests");
        println!("\n=== done ===");
        return;
    };
    println!("using device: {ip}\n");

    // test 2: rest api
    println!("[2] fetching device info via REST API...");
    match fetch_wled_info(ip).await {
        Ok(data) => {
            println!("    name: {}", data.info.name);
            println!("    version: {}", data.info.ver);
            println!("    led count: {}", data.info.leds.count);
            println!("    mac: {}", data.info.mac);
            println!("    on: {}, brightness: {}", data.state.on, data.state.bri);
            println!("    -> PASS\n");
        }
        Err(e) => {
            println!("    FAILED: {e}\n");
            return;
        }
    }

    // test 3: udp sender
    println!("[3] sending test colors via UDP DRGB...");
    match WledUdpSender::new(ip).await {
        Ok(sender) => {
            // solid red
            let red: Vec<RgbColor> = (0..30)
                .map(|_| RgbColor { r: 255, g: 0, b: 0 })
                .collect();
            if let Err(e) = sender.send_colors(&red).await {
                println!("    send failed: {e}");
                println!("    -> FAIL\n");
                return;
            }
            println!("    sent red (check your LEDs!)");
            tokio::time::sleep(Duration::from_secs(1)).await;

            // rainbow
            let rainbow: Vec<RgbColor> = (0..30)
                .map(|i| {
                    let hue = (i as f32 / 30.0) * 360.0;
                    hsv_to_rgb(hue, 1.0, 1.0)
                })
                .collect();
            if let Err(e) = sender.send_colors(&rainbow).await {
                println!("    send failed: {e}");
                println!("    -> FAIL\n");
                return;
            }
            println!("    sent rainbow (check your LEDs!)");
            tokio::time::sleep(Duration::from_secs(2)).await;

            // off
            let off: Vec<RgbColor> = (0..30)
                .map(|_| RgbColor { r: 0, g: 0, b: 0 })
                .collect();
            let _ = sender.send_colors(&off).await;
            println!("    sent off");
            println!("    -> PASS (visual check)\n");
        }
        Err(e) => {
            println!("    FAILED: {e}\n");
        }
    }

    println!("=== done ===");
}

fn hsv_to_rgb(h: f32, s: f32, v: f32) -> RgbColor {
    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;
    let (r, g, b) = match h as u32 {
        0..60 => (c, x, 0.0),
        60..120 => (x, c, 0.0),
        120..180 => (0.0, c, x),
        180..240 => (0.0, x, c),
        240..300 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };
    RgbColor {
        r: ((r + m) * 255.0) as u8,
        g: ((g + m) * 255.0) as u8,
        b: ((b + m) * 255.0) as u8,
    }
}
