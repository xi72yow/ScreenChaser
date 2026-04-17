use std::net::UdpSocket;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

fn main() {
    let ip = std::env::args().nth(1).unwrap_or_else(|| {
        eprintln!("usage: color_diag <wled-ip>");
        std::process::exit(1);
    });

    println!("=== raw udp color test ===\n");

    let socket = UdpSocket::bind("0.0.0.0:0").expect("bind");

    // try both known WLED ports
    let ports = [21324u16, 19446];

    for port in ports {
        let addr = format!("{ip}:{port}");
        println!("--- testing port {port} ---\n");

        // DRGB: [0x02, timeout, R, G, B]
        print_and_send(&socket, &addr, "DRGB RED", &[0x02, 0x02, 0xFF, 0x00, 0x00]);
        print_and_send(&socket, &addr, "DRGB GREEN", &[0x02, 0x02, 0x00, 0xFF, 0x00]);
        print_and_send(&socket, &addr, "DRGB BLUE", &[0x02, 0x02, 0x00, 0x00, 0xFF]);

        // WARLS: [0x01, timeout, index, R, G, B]
        print_and_send(&socket, &addr, "WARLS RED", &[0x01, 0x02, 0x00, 0xFF, 0x00, 0x00]);
        print_and_send(&socket, &addr, "WARLS GREEN", &[0x01, 0x02, 0x00, 0x00, 0xFF, 0x00]);
        print_and_send(&socket, &addr, "WARLS BLUE", &[0x01, 0x02, 0x00, 0x00, 0x00, 0xFF]);

        // off
        socket.send_to(&[0x02, 0x01, 0x00, 0x00, 0x00], &addr).ok();
        std::thread::sleep(Duration::from_millis(100));
    }

    println!("=== done ===");
}

fn print_and_send(socket: &UdpSocket, addr: &str, label: &str, packet: &[u8]) {
    let hex: String = packet.iter().map(|b| format!("{b:02x}")).collect::<Vec<_>>().join(" ");
    println!("[{label}] sending to {addr}: [{hex}]");
    println!("    press enter when ready...");
    wait_enter();

    let stop = Arc::new(AtomicBool::new(false));
    let stop_c = stop.clone();
    let sock = socket.try_clone().unwrap();
    let addr_c = addr.to_string();
    let pkt = packet.to_vec();

    let handle = std::thread::spawn(move || {
        while !stop_c.load(Ordering::Relaxed) {
            sock.send_to(&pkt, &addr_c).ok();
            std::thread::sleep(Duration::from_millis(50));
        }
    });

    println!("    sending... what color is the LED? press enter to stop");
    wait_enter();
    stop.store(true, Ordering::Relaxed);
    handle.join().ok();
    println!();
}

fn wait_enter() {
    let mut buf = String::new();
    std::io::stdin().read_line(&mut buf).ok();
}
