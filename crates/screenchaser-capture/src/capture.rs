use std::sync::{Arc, Mutex};

use pipewire as pw;
use pw::context::ContextBox;
use pw::main_loop::MainLoopBox;
use pw::properties::PropertiesBox;
use pw::spa::param::video::{VideoFormat, VideoInfoRaw};
use pw::spa::pod::serialize::PodSerializer;
use pw::spa::pod::{ChoiceValue, Object, Pod, Property, PropertyFlags, Value};
use pw::spa::utils::{Choice, ChoiceEnum, ChoiceFlags, Direction, Id, SpaTypes};
use pw::stream::{StreamBox, StreamFlags};
use screenchaser_config::{CapturedFrame, PixelFormat};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CaptureError {
    #[error("portal request failed: {0}")]
    Portal(String),
    #[error("pipewire stream failed: {0}")]
    PipeWire(String),
    #[error("no restore token available, setup required")]
    NoRestoreToken,
    #[error("no streams returned by portal")]
    NoStreams,
}

#[derive(Default)]
struct FrameState {
    width: u32,
    height: u32,
    format: Option<PixelFormat>,
    latest: Option<CapturedFrame>,
}

pub struct WaylandCapture {
    restore_token: Option<String>,
    state: Arc<Mutex<FrameState>>,
    _pw_thread: std::thread::JoinHandle<()>,
    _session_guard: tokio::sync::oneshot::Sender<()>,
}

impl WaylandCapture {
    pub async fn setup() -> Result<(Self, String), CaptureError> {
        let (capture, token) = Self::start(None).await?;
        let token = token.ok_or(CaptureError::Portal(
            "portal returned no restore token".into(),
        ))?;
        Ok((capture, token))
    }

    pub async fn resume(token: &str) -> Result<Self, CaptureError> {
        let (capture, _) = Self::start(Some(token)).await?;
        Ok(capture)
    }

    async fn start(restore_token: Option<&str>) -> Result<(Self, Option<String>), CaptureError> {
        use ashpd::desktop::{
            screencast::{
                CursorMode, OpenPipeWireRemoteOptions, Screencast, SelectSourcesOptions,
                SourceType, StartCastOptions,
            },
            PersistMode,
        };

        let proxy = Screencast::new()
            .await
            .map_err(|e| CaptureError::Portal(e.to_string()))?;
        let session = proxy
            .create_session(Default::default())
            .await
            .map_err(|e| CaptureError::Portal(e.to_string()))?;

        let sources_opts = SelectSourcesOptions::default()
            .set_cursor_mode(CursorMode::Hidden)
            .set_sources(ashpd::enumflags2::BitFlags::from(SourceType::Monitor))
            .set_multiple(false)
            .set_persist_mode(PersistMode::ExplicitlyRevoked)
            .set_restore_token(restore_token);

        proxy
            .select_sources(&session, sources_opts)
            .await
            .map_err(|e| CaptureError::Portal(e.to_string()))?;

        let response = proxy
            .start(&session, None, StartCastOptions::default())
            .await
            .map_err(|e| CaptureError::Portal(e.to_string()))?
            .response()
            .map_err(|e| CaptureError::Portal(e.to_string()))?;

        let streams = response.streams();
        if streams.is_empty() {
            return Err(CaptureError::NoStreams);
        }
        let node_id = streams[0].pipe_wire_node_id();
        let new_token = response.restore_token().map(|s| s.to_string());

        let fd = proxy
            .open_pipe_wire_remote(&session, OpenPipeWireRemoteOptions::default())
            .await
            .map_err(|e| CaptureError::Portal(e.to_string()))?;

        // keep portal session alive for the lifetime of WaylandCapture
        let (session_guard, session_rx) = tokio::sync::oneshot::channel::<()>();
        tokio::spawn(async move {
            let _ = session_rx.await;
            drop(session);
            drop(proxy);
        });

        let state: Arc<Mutex<FrameState>> = Arc::new(Mutex::new(FrameState::default()));
        let state_clone = state.clone();

        let pw_thread = std::thread::spawn(move || {
            let mainloop = MainLoopBox::new(None).expect("pw mainloop");
            let context =
                ContextBox::new(mainloop.loop_(), None).expect("pw context");
            let core = context.connect_fd(fd, None).expect("pw connect_fd");

            let stream = StreamBox::new(
                &core,
                "screenchaser",
                {
                    let mut props = PropertiesBox::new();
                    props.insert(*pw::keys::MEDIA_TYPE, "Video");
                    props.insert(*pw::keys::MEDIA_CATEGORY, "Capture");
                    props.insert(*pw::keys::MEDIA_ROLE, "Screen");
                    props
                },
            )
            .expect("pw stream");

            let _listener = stream
                .add_local_listener_with_user_data(state_clone)
                .state_changed(|_stream, _state, old, new| {
                    tracing::info!("stream state: {:?} -> {:?}", old, new);
                })
                .param_changed(|_stream, state, id, param| {
                    let Some(param) = param else { return };
                    if id != pw::spa::param::ParamType::Format.as_raw() {
                        return;
                    }

                    let mut info = VideoInfoRaw::new();
                    if info.parse(param).is_ok() {
                        let size = info.size();
                        let fmt = match info.format() {
                            VideoFormat::BGRA | VideoFormat::BGRx => Some(PixelFormat::Bgra8),
                            VideoFormat::RGBA | VideoFormat::RGBx => Some(PixelFormat::Rgba8),
                            other => {
                                tracing::warn!("unsupported video format: {:?}", other);
                                None
                            }
                        };
                        let mut s = state.lock().unwrap();
                        s.width = size.width;
                        s.height = size.height;
                        s.format = fmt;
                        tracing::info!(
                            "negotiated format: {:?} {}x{}",
                            info.format(),
                            size.width,
                            size.height,
                        );
                    }
                })
                .process(|stream, state| {
                    let Some(mut buffer) = stream.dequeue_buffer() else {
                        return;
                    };
                    let datas = buffer.datas_mut();
                    if datas.is_empty() {
                        return;
                    }
                    let data = &mut datas[0];
                    let chunk = data.chunk();
                    let size = chunk.size() as usize;
                    let offset = chunk.offset() as usize;
                    if size == 0 {
                        return;
                    }

                    let Some(mapped) = data.data() else {
                        return;
                    };
                    if offset + size > mapped.len() {
                        return;
                    }
                    let pixels = &mapped[offset..offset + size];

                    let s = state.lock().unwrap();
                    if s.width == 0 || s.height == 0 || s.format.is_none() {
                        return;
                    }
                    let frame = CapturedFrame {
                        data: pixels.to_vec(),
                        width: s.width,
                        height: s.height,
                        format: s.format.unwrap(),
                    };
                    drop(s);
                    state.lock().unwrap().latest = Some(frame);
                })
                .register()
                .expect("pw listener");

            let format_pod = build_video_format_pod();
            let pod = Pod::from_bytes(&format_pod).expect("format pod");
            stream
                .connect(
                    Direction::Input,
                    Some(node_id),
                    StreamFlags::AUTOCONNECT | StreamFlags::MAP_BUFFERS,
                    &mut [pod],
                )
                .expect("pw stream connect");

            mainloop.run();
        });

        Ok((
            WaylandCapture {
                restore_token: new_token.clone(),
                state,
                _pw_thread: pw_thread,
                _session_guard: session_guard,
            },
            new_token,
        ))
    }

    pub fn current_frame(&self) -> Option<CapturedFrame> {
        self.state.lock().ok()?.latest.take()
    }

    pub fn restore_token(&self) -> Option<&str> {
        self.restore_token.as_deref()
    }
}

fn build_video_format_pod() -> Vec<u8> {
    use pw::spa::param::format::{FormatProperties, MediaSubtype, MediaType};

    let obj = Value::Object(Object {
        type_: SpaTypes::ObjectParamFormat.as_raw(),
        id: pw::spa::param::ParamType::EnumFormat.as_raw(),
        properties: vec![
            Property {
                key: FormatProperties::MediaType.as_raw(),
                flags: PropertyFlags::empty(),
                value: Value::Id(Id(MediaType::Video.as_raw())),
            },
            Property {
                key: FormatProperties::MediaSubtype.as_raw(),
                flags: PropertyFlags::empty(),
                value: Value::Id(Id(MediaSubtype::Raw.as_raw())),
            },
            Property {
                key: FormatProperties::VideoFormat.as_raw(),
                flags: PropertyFlags::empty(),
                value: Value::Choice(ChoiceValue::Id(Choice(
                    ChoiceFlags::empty(),
                    ChoiceEnum::Enum {
                        default: Id(VideoFormat::BGRx.as_raw()),
                        alternatives: vec![
                            Id(VideoFormat::BGRx.as_raw()),
                            Id(VideoFormat::RGBx.as_raw()),
                            Id(VideoFormat::BGRA.as_raw()),
                            Id(VideoFormat::RGBA.as_raw()),
                        ],
                    },
                ))),
            },
        ],
    });

    let mut buf = vec![0u8; 1024];
    let (_, len) =
        PodSerializer::serialize(std::io::Cursor::new(&mut buf), &obj).expect("serialize pod");
    buf.truncate(len as usize);
    buf
}
