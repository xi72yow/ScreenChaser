use std::borrow::Cow;

use rust_embed::Embed;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoopBuilder, EventLoopProxy};
use tao::platform::unix::WindowExtUnix;
use tao::window::WindowBuilder;
use wry::http::Response as HttpResponse;
use wry::{WebContext, WebViewBuilder, WebViewBuilderExtUnix};

#[derive(Embed)]
#[folder = "frontend/dist"]
struct Assets;

#[derive(Debug)]
enum UserEvent {
    Shutdown,
}

pub struct WebviewHandle {
    proxy: EventLoopProxy<UserEvent>,
}

impl WebviewHandle {
    pub fn close(&self) {
        let _ = self.proxy.send_event(UserEvent::Shutdown);
    }
}

pub fn run(on_ready: impl FnOnce(WebviewHandle) + Send + 'static) -> ! {
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();

    {
        use gtk::prelude::*;
        if let Some(settings) = gtk::Settings::default() {
            settings.set_property("gtk-application-prefer-dark-theme", true);
        }
    }
    let proxy = event_loop.create_proxy();

    let window = WindowBuilder::new()
        .with_title("ScreenChaser")
        .with_inner_size(tao::dpi::LogicalSize::new(900.0, 700.0))
        .build(&event_loop)
        .expect("window creation");

    let mut web_context = WebContext::default();

    let _webview = WebViewBuilder::with_web_context(&mut web_context)
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
        .build_gtk(window.default_vbox().expect("tao default vbox"))
        .expect("webview creation");

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
                *control_flow = ControlFlow::Exit;
            }
            Event::UserEvent(UserEvent::Shutdown) => {
                *control_flow = ControlFlow::Exit;
            }
            _ => {}
        }
    });
}
