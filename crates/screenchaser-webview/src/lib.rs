use std::borrow::Cow;

use rust_embed::Embed;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoopBuilder, EventLoopProxy};
use tao::platform::unix::WindowExtUnix;
use tao::window::WindowBuilder;
use tray_icon::menu::{Menu, MenuEvent, MenuItem};
use tray_icon::{Icon, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use wry::http::Response as HttpResponse;
use wry::{WebContext, WebViewBuilder, WebViewBuilderExtUnix};

#[derive(Embed)]
#[folder = "frontend/dist"]
struct Assets;

const TRAY_ICON_PNG: &[u8] = include_bytes!("../assets/tray.png");

#[derive(Debug)]
enum UserEvent {
    ShowWindow,
    QuitRequested,
    Shutdown,
}

pub struct WebviewHandle {
    proxy: EventLoopProxy<UserEvent>,
}

impl WebviewHandle {
    pub fn show(&self) {
        let _ = self.proxy.send_event(UserEvent::ShowWindow);
    }

    pub fn close(&self) {
        let _ = self.proxy.send_event(UserEvent::Shutdown);
    }
}

pub fn run<R, Q>(on_ready: R, on_quit: Q)
where
    R: FnOnce(WebviewHandle) + Send + 'static,
    Q: Fn() + Send + 'static,
{
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();

    {
        use gtk::prelude::*;
        if let Some(settings) = gtk::Settings::default() {
            settings.set_property("gtk-application-prefer-dark-theme", true);
        }
    }

    let window = WindowBuilder::new()
        .with_title("ScreenChaser")
        .with_inner_size(tao::dpi::LogicalSize::new(900.0, 700.0))
        .build(&event_loop)
        .expect("window creation");

    let mut web_context = WebContext::default();

    let _webview = WebViewBuilder::new_with_web_context(&mut web_context)
        .with_custom_protocol("sc".into(), move |_id, request| {
            let path = request.uri().path();
            let path = if path == "/" { "index.html" } else { path };
            let path = path.trim_start_matches('/');

            tracing::debug!(path, "webview asset request");

            match Assets::get(path) {
                Some(file) => {
                    let mime = mime_guess::from_path(path)
                        .first_or_octet_stream()
                        .to_string();
                    HttpResponse::builder()
                        .header("Content-Type", &mime)
                        .header("Access-Control-Allow-Origin", "*")
                        .body(Cow::Owned(file.data.to_vec()))
                        .unwrap()
                }
                None => {
                    tracing::warn!(path, "asset not found");
                    HttpResponse::builder()
                        .status(404)
                        .body(Cow::Borrowed(b"not found" as &[u8]))
                        .unwrap()
                }
            }
        })
        .with_url("sc://localhost/index.html")
        .with_devtools(cfg!(debug_assertions))
        .with_navigation_handler(|url| {
            if url.starts_with("sc://") {
                true
            } else {
                let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
                false
            }
        })
        .build_gtk(window.default_vbox().expect("tao default vbox"))
        .expect("webview creation");

    let tray_menu = Menu::new();
    let quit_item = MenuItem::new("Quit ScreenChaser", true, None);
    tray_menu
        .append(&quit_item)
        .expect("append tray menu item");
    let quit_id = quit_item.id().clone();

    let _tray = TrayIconBuilder::new()
        .with_tooltip("ScreenChaser")
        .with_menu(Box::new(tray_menu))
        .with_icon(load_tray_icon())
        .build()
        .expect("tray icon");

    let tray_proxy = event_loop.create_proxy();
    TrayIconEvent::set_event_handler(Some(move |event: TrayIconEvent| {
        if let TrayIconEvent::Click { button_state, .. } = event {
            if button_state == MouseButtonState::Up {
                let _ = tray_proxy.send_event(UserEvent::ShowWindow);
            }
        }
    }));

    let menu_proxy = event_loop.create_proxy();
    MenuEvent::set_event_handler(Some(move |event: MenuEvent| {
        if event.id == quit_id {
            let _ = menu_proxy.send_event(UserEvent::QuitRequested);
        }
    }));

    let handle = WebviewHandle {
        proxy: event_loop.create_proxy(),
    };

    std::thread::spawn(move || on_ready(handle));

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                window.set_visible(false);
            }
            Event::UserEvent(UserEvent::ShowWindow) => {
                window.set_visible(true);
                window.set_focus();
            }
            Event::UserEvent(UserEvent::QuitRequested) => {
                on_quit();
            }
            Event::UserEvent(UserEvent::Shutdown) => {
                *control_flow = ControlFlow::Exit;
            }
            _ => {}
        }
    });
}

fn load_tray_icon() -> Icon {
    let decoder = png::Decoder::new(TRAY_ICON_PNG);
    let mut reader = decoder.read_info().expect("tray icon header");
    let mut buf = vec![0; reader.output_buffer_size()];
    let info = reader.next_frame(&mut buf).expect("tray icon frame");
    let bytes = &buf[..info.buffer_size()];

    let rgba = match info.color_type {
        png::ColorType::Rgba => bytes.to_vec(),
        png::ColorType::Rgb => {
            let mut out = Vec::with_capacity(bytes.len() / 3 * 4);
            for chunk in bytes.chunks_exact(3) {
                out.extend_from_slice(chunk);
                out.push(255);
            }
            out
        }
        png::ColorType::GrayscaleAlpha => {
            let mut out = Vec::with_capacity(bytes.len() * 2);
            for chunk in bytes.chunks_exact(2) {
                out.extend_from_slice(&[chunk[0], chunk[0], chunk[0], chunk[1]]);
            }
            out
        }
        png::ColorType::Grayscale => {
            let mut out = Vec::with_capacity(bytes.len() * 4);
            for &g in bytes {
                out.extend_from_slice(&[g, g, g, 255]);
            }
            out
        }
        _ => panic!("unsupported tray icon color type: {:?}", info.color_type),
    };

    Icon::from_rgba(rgba, info.width, info.height).expect("tray icon from rgba")
}
