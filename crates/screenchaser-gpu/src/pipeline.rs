use bytemuck::{Pod, Zeroable};
use screenchaser_config::{CapturedFrame, LedField, PixelFormat, RgbColor};
use std::collections::HashMap;
use thiserror::Error;
use wgpu::util::DeviceExt;

#[derive(Error, Debug)]
pub enum GpuError {
    #[error("no suitable gpu adapter found")]
    NoAdapter,
    #[error("device request failed: {0}")]
    DeviceRequest(String),
    #[error("unknown device: {0}")]
    UnknownDevice(String),
    #[error("no frame uploaded")]
    NoFrame,
    #[error("buffer readback failed")]
    ReadbackFailed,
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct GpuLedField {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct AverageParams {
    frame_count: u32,
    led_count: u32,
}

struct DeviceGpuState {
    led_count: u32,
    led_field_buffer: wgpu::Buffer,
    color_output_buffer: wgpu::Buffer,
    frame_ring_buffer: wgpu::Buffer,
    average_output_buffer: wgpu::Buffer,
    readback_buffer: wgpu::Buffer,
    params_buffer: wgpu::Buffer,
    extract_bind_group: Option<wgpu::BindGroup>,
    average_bind_group: wgpu::BindGroup,
    current_frame_index: u32,
    actual_frame_count: u32,
    allocated_frames: u32,
    texture_generation: u64,
}

pub struct GpuPipeline {
    device: wgpu::Device,
    queue: wgpu::Queue,
    extract_pipeline: wgpu::ComputePipeline,
    average_pipeline: wgpu::ComputePipeline,
    extract_bind_group_layout: wgpu::BindGroupLayout,
    device_states: HashMap<String, DeviceGpuState>,
    texture: Option<wgpu::Texture>,
    texture_view: Option<wgpu::TextureView>,
    texture_generation: u64,
    texture_size: (u32, u32),
    texture_format: wgpu::TextureFormat,
}

impl GpuPipeline {
    pub async fn new() -> Result<Self, GpuError> {
        let instance = wgpu::Instance::new(&wgpu::InstanceDescriptor {
            backends: wgpu::Backends::VULKAN,
            ..Default::default()
        });

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::LowPower,
                compatible_surface: None,
                force_fallback_adapter: false,
            })
            .await
            .map_err(|_| GpuError::NoAdapter)?;

        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor::default())
            .await
            .map_err(|e| GpuError::DeviceRequest(e.to_string()))?;

        let extract_shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("color_extract"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shaders/color_extract.wgsl").into()),
        });

        let average_shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("frame_average"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shaders/frame_average.wgsl").into()),
        });

        let extract_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                label: Some("extract_bgl"),
                entries: &[
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::COMPUTE,
                        ty: wgpu::BindingType::Texture {
                            sample_type: wgpu::TextureSampleType::Float { filterable: false },
                            view_dimension: wgpu::TextureViewDimension::D2,
                            multisampled: false,
                        },
                        count: None,
                    },
                    wgpu::BindGroupLayoutEntry {
                        binding: 1,
                        visibility: wgpu::ShaderStages::COMPUTE,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Storage { read_only: true },
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                    wgpu::BindGroupLayoutEntry {
                        binding: 2,
                        visibility: wgpu::ShaderStages::COMPUTE,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Storage { read_only: false },
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                ],
            });

        let average_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                label: Some("average_bgl"),
                entries: &[
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::COMPUTE,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Storage { read_only: false },
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                    wgpu::BindGroupLayoutEntry {
                        binding: 1,
                        visibility: wgpu::ShaderStages::COMPUTE,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Storage { read_only: false },
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                    wgpu::BindGroupLayoutEntry {
                        binding: 2,
                        visibility: wgpu::ShaderStages::COMPUTE,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Uniform,
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                ],
            });

        let extract_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("extract_layout"),
            bind_group_layouts: &[&extract_bind_group_layout],
            push_constant_ranges: &[],
        });

        let average_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("average_layout"),
            bind_group_layouts: &[&average_bind_group_layout],
            push_constant_ranges: &[],
        });

        let extract_pipeline =
            device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
                label: Some("extract_pipeline"),
                layout: Some(&extract_layout),
                module: &extract_shader,
                entry_point: Some("main"),
                compilation_options: Default::default(),
                cache: None,
            });

        let average_pipeline =
            device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
                label: Some("average_pipeline"),
                layout: Some(&average_layout),
                module: &average_shader,
                entry_point: Some("main"),
                compilation_options: Default::default(),
                cache: None,
            });

        Ok(Self {
            device,
            queue,
            extract_pipeline,
            average_pipeline,
            extract_bind_group_layout,
            device_states: HashMap::new(),
            texture: None,
            texture_view: None,
            texture_generation: 0,
            texture_size: (0, 0),
            texture_format: wgpu::TextureFormat::Rgba8Unorm,
        })
    }

    pub fn register_device(
        &mut self,
        device_id: &str,
        led_fields: &[LedField],
        buffer_frames: u32,
    ) {
        let led_count = led_fields.len() as u32;
        if led_count == 0 {
            return;
        }
        let buffer_frames = buffer_frames.max(1);

        let gpu_fields: Vec<GpuLedField> = led_fields
            .iter()
            .map(|f| GpuLedField {
                x: f.x,
                y: f.y,
                width: f.width,
                height: f.height,
            })
            .collect();

        let led_field_buffer = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("led_fields"),
            contents: bytemuck::cast_slice(&gpu_fields),
            usage: wgpu::BufferUsages::STORAGE,
        });

        let color_output_buffer = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("color_output"),
            size: led_count as u64 * 16,
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
            mapped_at_creation: false,
        });

        let frame_ring_buffer = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("frame_ring"),
            size: buffer_frames as u64 * led_count as u64 * 16,
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let average_output_buffer = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("average_output"),
            size: led_count as u64 * 16,
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
            mapped_at_creation: false,
        });

        let readback_buffer = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("readback"),
            size: led_count as u64 * 16,
            usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        let params_buffer = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("average_params"),
            contents: bytemuck::bytes_of(&AverageParams {
                frame_count: 0,
                led_count,
            }),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        let average_bind_group = self.device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("average_bg"),
            layout: &self.average_pipeline.get_bind_group_layout(0),
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: frame_ring_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: average_output_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: params_buffer.as_entire_binding(),
                },
            ],
        });

        self.device_states.insert(
            device_id.to_string(),
            DeviceGpuState {
                led_count,
                led_field_buffer,
                color_output_buffer,
                frame_ring_buffer,
                average_output_buffer,
                readback_buffer,
                params_buffer,
                extract_bind_group: None,
                average_bind_group,
                current_frame_index: 0,
                actual_frame_count: 0,
                allocated_frames: buffer_frames,
                texture_generation: 0,
            },
        );
    }

    pub fn remove_device(&mut self, device_id: &str) {
        self.device_states.remove(device_id);
    }

    pub fn upload_frame(&mut self, frame: &CapturedFrame) {
        let format = match frame.format {
            PixelFormat::Rgba8 => wgpu::TextureFormat::Rgba8Unorm,
            PixelFormat::Bgra8 => wgpu::TextureFormat::Bgra8Unorm,
        };

        if self.texture_size != (frame.width, frame.height) || self.texture_format != format {
            let texture = self.device.create_texture(&wgpu::TextureDescriptor {
                label: Some("capture_frame"),
                size: wgpu::Extent3d {
                    width: frame.width,
                    height: frame.height,
                    depth_or_array_layers: 1,
                },
                mip_level_count: 1,
                sample_count: 1,
                dimension: wgpu::TextureDimension::D2,
                format,
                usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
                view_formats: &[],
            });
            self.texture_view =
                Some(texture.create_view(&wgpu::TextureViewDescriptor::default()));
            self.texture = Some(texture);
            self.texture_size = (frame.width, frame.height);
            self.texture_format = format;
            self.texture_generation += 1;
        }

        self.queue.write_texture(
            wgpu::TexelCopyTextureInfo {
                texture: self.texture.as_ref().unwrap(),
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &frame.data,
            wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(frame.width * 4),
                rows_per_image: None,
            },
            wgpu::Extent3d {
                width: frame.width,
                height: frame.height,
                depth_or_array_layers: 1,
            },
        );
    }

    pub fn process_device(
        &mut self,
        device_id: &str,
    ) -> Result<Vec<RgbColor>, GpuError> {
        let texture_view = self.texture_view.as_ref().ok_or(GpuError::NoFrame)?;

        let state = self
            .device_states
            .get_mut(device_id)
            .ok_or_else(|| GpuError::UnknownDevice(device_id.to_string()))?;

        if state.texture_generation != self.texture_generation
            || state.extract_bind_group.is_none()
        {
            state.extract_bind_group =
                Some(self.device.create_bind_group(&wgpu::BindGroupDescriptor {
                    label: Some("extract_bg"),
                    layout: &self.extract_bind_group_layout,
                    entries: &[
                        wgpu::BindGroupEntry {
                            binding: 0,
                            resource: wgpu::BindingResource::TextureView(texture_view),
                        },
                        wgpu::BindGroupEntry {
                            binding: 1,
                            resource: state.led_field_buffer.as_entire_binding(),
                        },
                        wgpu::BindGroupEntry {
                            binding: 2,
                            resource: state.color_output_buffer.as_entire_binding(),
                        },
                    ],
                }));
            state.texture_generation = self.texture_generation;
        }

        let ring_offset =
            state.current_frame_index as u64 * state.led_count as u64 * 16;
        state.current_frame_index =
            (state.current_frame_index + 1) % state.allocated_frames;
        state.actual_frame_count = state
            .actual_frame_count
            .saturating_add(1)
            .min(state.allocated_frames);

        self.queue.write_buffer(
            &state.params_buffer,
            0,
            bytemuck::bytes_of(&AverageParams {
                frame_count: state.actual_frame_count,
                led_count: state.led_count,
            }),
        );

        let workgroups = (state.led_count + 63) / 64;

        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("gpu_pipeline"),
            });

        {
            let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                label: Some("extract"),
                timestamp_writes: None,
            });
            pass.set_pipeline(&self.extract_pipeline);
            pass.set_bind_group(0, state.extract_bind_group.as_ref().unwrap(), &[]);
            pass.dispatch_workgroups(workgroups, 1, 1);
        }

        encoder.copy_buffer_to_buffer(
            &state.color_output_buffer,
            0,
            &state.frame_ring_buffer,
            ring_offset,
            state.led_count as u64 * 16,
        );

        {
            let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                label: Some("average"),
                timestamp_writes: None,
            });
            pass.set_pipeline(&self.average_pipeline);
            pass.set_bind_group(0, &state.average_bind_group, &[]);
            pass.dispatch_workgroups(workgroups, 1, 1);
        }

        encoder.copy_buffer_to_buffer(
            &state.average_output_buffer,
            0,
            &state.readback_buffer,
            0,
            state.led_count as u64 * 16,
        );

        self.queue.submit(std::iter::once(encoder.finish()));

        let buffer_slice = state.readback_buffer.slice(..);
        let (tx, rx) = std::sync::mpsc::channel();
        buffer_slice.map_async(wgpu::MapMode::Read, move |result| {
            tx.send(result).ok();
        });
        self.device
            .poll(wgpu::PollType::Wait)
            .map_err(|_| GpuError::ReadbackFailed)?;
        rx.recv()
            .map_err(|_| GpuError::ReadbackFailed)?
            .map_err(|_| GpuError::ReadbackFailed)?;

        let data = buffer_slice.get_mapped_range();
        let floats: &[[f32; 4]] = bytemuck::cast_slice(&data);
        let colors = floats
            .iter()
            .map(|c| RgbColor {
                r: (c[0] * 255.0).clamp(0.0, 255.0) as u8,
                g: (c[1] * 255.0).clamp(0.0, 255.0) as u8,
                b: (c[2] * 255.0).clamp(0.0, 255.0) as u8,
            })
            .collect();

        drop(data);
        state.readback_buffer.unmap();

        Ok(colors)
    }
}
