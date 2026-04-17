use screenchaser_capture::WaylandCapture;
use std::time::{Duration, Instant};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    println!("=== capture pipeline test ===\n");

    println!("[1] opening portal (select your monitor)...");
    let (capture, token) = match WaylandCapture::setup().await {
        Ok(result) => {
            println!("    ok");
            println!("    restore token: {}\n", &token_preview(&result.1));
            result
        }
        Err(e) => {
            eprintln!("    FAILED: {e}");
            std::process::exit(1);
        }
    };

    println!("[2] waiting for first frame (5s timeout)...");
    let start = Instant::now();
    let mut first_frame = None;
    while start.elapsed() < Duration::from_secs(5) {
        if let Some(frame) = capture.current_frame() {
            first_frame = Some(frame);
            break;
        }
        std::thread::sleep(Duration::from_millis(50));
    }

    match first_frame {
        Some(ref frame) => {
            println!("    got frame: {}x{} {:?}", frame.width, frame.height, frame.format);
            print_pixel_samples(frame);
            println!("    -> PASS\n");
        }
        None => {
            println!("    FAILED: no frame within 5s\n");
            std::process::exit(1);
        }
    }

    println!("[3] measuring capture rate (2s)...");
    let start = Instant::now();
    let mut count = 0u32;
    while start.elapsed() < Duration::from_secs(2) {
        if capture.current_frame().is_some() {
            count += 1;
        }
        std::thread::sleep(Duration::from_millis(1));
    }
    let fps = count as f64 / 2.0;
    println!("    captured {count} frames in 2s ({fps:.1} fps)");
    println!(
        "    -> {}\n",
        if count > 10 { "PASS" } else { "FAIL (< 5fps)" }
    );

    println!("[4] testing resume with token...");
    drop(capture);
    std::thread::sleep(Duration::from_millis(500));

    let token_str = token;
    match WaylandCapture::resume(&token_str).await {
        Ok(capture2) => {
            println!("    resumed ok, waiting for frame...");
            let start = Instant::now();
            let mut got_frame = false;
            while start.elapsed() < Duration::from_secs(5) {
                if let Some(frame) = capture2.current_frame() {
                    println!(
                        "    frame: {}x{} {:?}",
                        frame.width, frame.height, frame.format
                    );
                    got_frame = true;
                    break;
                }
                std::thread::sleep(Duration::from_millis(50));
            }
            println!(
                "    -> {}\n",
                if got_frame {
                    "PASS"
                } else {
                    "FAIL (no frame)"
                }
            );
        }
        Err(e) => {
            println!("    resume failed: {e}");
            println!("    -> FAIL\n");
        }
    }

    println!("=== done ===");
}

fn token_preview(token: &str) -> String {
    if token.len() > 20 {
        format!("{}...", &token[..20])
    } else {
        token.to_string()
    }
}

fn print_pixel_samples(frame: &screenchaser_config::CapturedFrame) {
    let bpp = 4;
    let stride = frame.width as usize * bpp;
    let samples = [
        ("top-left", 0, 0),
        ("top-right", frame.width as usize - 1, 0),
        ("center", frame.width as usize / 2, frame.height as usize / 2),
        ("bottom-left", 0, frame.height as usize - 1),
        ("bottom-right", frame.width as usize - 1, frame.height as usize - 1),
    ];
    for (label, x, y) in samples {
        let offset = y * stride + x * bpp;
        if offset + 3 < frame.data.len() {
            let (r, g, b) = match frame.format {
                screenchaser_config::PixelFormat::Rgba8 => {
                    (frame.data[offset], frame.data[offset + 1], frame.data[offset + 2])
                }
                screenchaser_config::PixelFormat::Bgra8 => {
                    (frame.data[offset + 2], frame.data[offset + 1], frame.data[offset])
                }
            };
            println!("    {label:>14}: ({r:3},{g:3},{b:3})");
        }
    }
}
