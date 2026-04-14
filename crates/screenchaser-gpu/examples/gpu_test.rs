use screenchaser_config::{CapturedFrame, LedField, PixelFormat};
use screenchaser_gpu::GpuPipeline;

fn make_solid_frame(r: u8, g: u8, b: u8, width: u32, height: u32) -> CapturedFrame {
    let pixel = [r, g, b, 255u8];
    let data = pixel.repeat((width * height) as usize);
    CapturedFrame {
        data,
        width,
        height,
        format: PixelFormat::Rgba8,
    }
}

fn make_gradient_frame(width: u32, height: u32) -> CapturedFrame {
    let mut data = Vec::with_capacity((width * height * 4) as usize);
    for y in 0..height {
        for x in 0..width {
            let r = (x * 255 / width) as u8;
            let g = (y * 255 / height) as u8;
            let b = 128u8;
            data.extend_from_slice(&[r, g, b, 255]);
        }
    }
    CapturedFrame {
        data,
        width,
        height,
        format: PixelFormat::Rgba8,
    }
}

fn make_quad_frame(width: u32, height: u32) -> CapturedFrame {
    let mut data = Vec::with_capacity((width * height * 4) as usize);
    let hw = width / 2;
    let hh = height / 2;
    for y in 0..height {
        for x in 0..width {
            let (r, g, b) = match (x < hw, y < hh) {
                (true, true) => (255u8, 0u8, 0u8),
                (false, true) => (0, 255, 0),
                (true, false) => (0, 0, 255),
                (false, false) => (255, 255, 0),
            };
            data.extend_from_slice(&[r, g, b, 255]);
        }
    }
    CapturedFrame {
        data,
        width,
        height,
        format: PixelFormat::Rgba8,
    }
}

fn simple_led_strip(count: u32) -> Vec<LedField> {
    (0..count)
        .map(|i| {
            let t = (i as f32 + 0.5) / count as f32;
            LedField {
                x: t - 0.04,
                y: 0.0,
                width: 0.08,
                height: 0.1,
            }
        })
        .collect()
}

fn corner_fields() -> Vec<LedField> {
    vec![
        LedField { x: 0.0, y: 0.0, width: 0.1, height: 0.1 },
        LedField { x: 0.9, y: 0.0, width: 0.1, height: 0.1 },
        LedField { x: 0.0, y: 0.9, width: 0.1, height: 0.1 },
        LedField { x: 0.9, y: 0.9, width: 0.1, height: 0.1 },
    ]
}

#[tokio::main]
async fn main() {
    println!("=== gpu pipeline test ===\n");

    println!("[1] initializing gpu pipeline...");
    let mut gpu = match GpuPipeline::new().await {
        Ok(gpu) => {
            println!("    ok\n");
            gpu
        }
        Err(e) => {
            eprintln!("    FAILED: {e}");
            std::process::exit(1);
        }
    };

    // test 1: solid red frame, top strip
    println!("[2] solid red frame, 8 LEDs top strip");
    gpu.register_device("test-solid", &simple_led_strip(8), 4);
    let frame = make_solid_frame(255, 0, 0, 1920, 1080);
    gpu.upload_frame(&frame);
    match gpu.process_device("test-solid") {
        Ok(colors) => {
            print!("    ");
            for c in &colors {
                print!("({:3},{:3},{:3}) ", c.r, c.g, c.b);
            }
            println!();
            let all_red = colors.iter().all(|c| c.r > 200 && c.g < 30 && c.b < 30);
            println!("    expected: all ~(255,0,0) -> {}\n", if all_red { "PASS" } else { "FAIL" });
        }
        Err(e) => println!("    FAILED: {e}\n"),
    }

    // test 2: quad frame (rot/gruen/blau/gelb), corner fields
    println!("[3] quad frame, 4 corner LEDs");
    gpu.register_device("test-quad", &corner_fields(), 4);
    let frame = make_quad_frame(1920, 1080);
    gpu.upload_frame(&frame);
    match gpu.process_device("test-quad") {
        Ok(colors) => {
            let labels = ["top-left(red)", "top-right(green)", "bottom-left(blue)", "bottom-right(yellow)"];
            for (c, label) in colors.iter().zip(labels.iter()) {
                println!("    {label:>22}: ({:3},{:3},{:3})", c.r, c.g, c.b);
            }
            let ok = colors[0].r > 200 && colors[0].g < 30
                && colors[1].g > 200 && colors[1].r < 30
                && colors[2].b > 200 && colors[2].r < 30
                && colors[3].r > 200 && colors[3].g > 200 && colors[3].b < 30;
            println!("    -> {}\n", if ok { "PASS" } else { "FAIL" });
        }
        Err(e) => println!("    FAILED: {e}\n"),
    }

    // test 3: gradient, top strip
    println!("[4] gradient frame, 4 LEDs top strip");
    gpu.register_device("test-grad", &simple_led_strip(4), 4);
    let frame = make_gradient_frame(1920, 1080);
    gpu.upload_frame(&frame);
    match gpu.process_device("test-grad") {
        Ok(colors) => {
            print!("    ");
            for c in &colors {
                print!("({:3},{:3},{:3}) ", c.r, c.g, c.b);
            }
            println!();
            let r_increasing = colors.windows(2).all(|w| w[1].r >= w[0].r);
            println!("    expected: R increasing left->right -> {}\n", if r_increasing { "PASS" } else { "FAIL" });
        }
        Err(e) => println!("    FAILED: {e}\n"),
    }

    // test 4: frame averaging (multiple solid frames)
    println!("[5] averaging: 3x red + 1x blue, 1 LED");
    let single = vec![LedField { x: 0.0, y: 0.0, width: 1.0, height: 1.0 }];
    gpu.register_device("test-avg", &single, 8);
    for _ in 0..3 {
        let frame = make_solid_frame(255, 0, 0, 64, 64);
        gpu.upload_frame(&frame);
        let _ = gpu.process_device("test-avg");
    }
    let frame = make_solid_frame(0, 0, 255, 64, 64);
    gpu.upload_frame(&frame);
    match gpu.process_device("test-avg") {
        Ok(colors) => {
            let c = &colors[0];
            println!("    averaged: ({},{},{})", c.r, c.g, c.b);
            let ok = c.r > 150 && c.r < 220 && c.b > 40 && c.b < 100;
            println!("    expected: ~(191,0,63) (3/4 red + 1/4 blue) -> {}\n", if ok { "PASS" } else { "FAIL" });
        }
        Err(e) => println!("    FAILED: {e}\n"),
    }

    // test 5: BGRA format
    println!("[6] bgra format test, solid green");
    let single = vec![LedField { x: 0.0, y: 0.0, width: 1.0, height: 1.0 }];
    gpu.register_device("test-bgra", &single, 1);
    let bgra_frame = CapturedFrame {
        data: [0u8, 255, 0, 255].repeat(64 * 64),
        width: 64,
        height: 64,
        format: PixelFormat::Bgra8,
    };
    gpu.upload_frame(&bgra_frame);
    match gpu.process_device("test-bgra") {
        Ok(colors) => {
            let c = &colors[0];
            println!("    result: ({},{},{})", c.r, c.g, c.b);
            let ok = c.g > 200 && c.r < 30 && c.b < 30;
            println!("    expected: ~(0,255,0) -> {}\n", if ok { "PASS" } else { "FAIL" });
        }
        Err(e) => println!("    FAILED: {e}\n"),
    }

    gpu.remove_device("test-solid");
    gpu.remove_device("test-quad");
    gpu.remove_device("test-grad");
    gpu.remove_device("test-avg");
    gpu.remove_device("test-bgra");
    println!("=== done ===");
}
