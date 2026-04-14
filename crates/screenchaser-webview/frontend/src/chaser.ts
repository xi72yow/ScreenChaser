import { generateLedFields, type LedField } from "./biasCalculation/ledFields";
import { State } from "./core/db/state";

class BiasWebGPU {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
  videoTexture: GPUTexture;
  ledFieldBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  ledCount: number;
  ledFields: LedField[];
  renderTexture: GPUTexture; // Separate texture for rendering that we can read from

  // Frame buffer related
  actualFrameCount = 0; // Track how many frames we've actually stored
  frameBuffer: GPUBuffer; // Storage buffer for fps*seconds frames of LED data
  averageBuffer: GPUBuffer; // Output buffer for averaged data
  paramsBuffer: GPUBuffer; // Uniform buffer for compute shader parameters
  frameBufferBindGroup: GPUBindGroup;
  frameBufferPipeline: GPUComputePipeline;
  currentFrameIndex = 0;
  useFrameBuffer = false;
  currentFPS = 60; // Track current FPS for buffer sizing
  bufferSeconds = 5; // Configurable buffer duration in seconds
  allocatedFrames = 0; // How many frames the current GPU buffer can hold

  constructor(
    device: GPUDevice,
    context: GPUCanvasContext,
    ledFields: LedField[],
  ) {
    this.device = device;
    this.context = context;
    this.ledFields = ledFields;
    this.ledCount = ledFields.length;
  }

  async init(videoWidth: number, videoHeight: number) {
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    // Create video texture
    this.videoTexture = this.device.createTexture({
      size: [videoWidth, videoHeight],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Create render texture that we can read from
    this.renderTexture = this.device.createTexture({
      size: [this.ledCount, 1],
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    // Create frame buffer for storing fps*bufferSeconds frames
    const initialFrames = Math.round(this.currentFPS * this.bufferSeconds);
    this.allocatedFrames = initialFrames;
    this.frameBuffer = this.device.createBuffer({
      size: this.ledCount * 4 * 4 * initialFrames, // RGBA * float32 * frames
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    // Create compute shader for averaging frames
    const computeShaderModule = this.device.createShaderModule({
      label: "Frame average compute shader",
      code: `
        @group(0) @binding(0) var<storage, read_write> frameBuffer: array<vec4f>;
        @group(0) @binding(1) var<storage, read_write> averageOutput: array<vec4f>;
        @group(0) @binding(2) var<uniform> params: vec2u; // x: frameCount, y: ledCount

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) id: vec3u) {
          let ledIndex = id.x;
          let frameCount = params.x;
          let ledCount = params.y;

          if (ledIndex >= ledCount) {
            return;
          }

          var sum = vec4f(0.0, 0.0, 0.0, 0.0);

          // Sum all frames for this LED
          for (var frame = 0u; frame < frameCount; frame++) {
            let index = frame * ledCount + ledIndex;
            sum += frameBuffer[index];
          }

          // Calculate average
          if (frameCount > 0u) {
            averageOutput[ledIndex] = sum / f32(frameCount);
          } else {
            averageOutput[ledIndex] = vec4f(0.0, 0.0, 0.0, 1.0);
          }
        }
      `,
    });

    // Create compute pipeline
    this.frameBufferPipeline = this.device.createComputePipeline({
      label: "Frame buffer averaging pipeline",
      layout: "auto",
      compute: {
        module: computeShaderModule,
        entryPoint: "main",
      },
    });

    // Create average output buffer
    this.averageBuffer = this.device.createBuffer({
      size: this.ledCount * 4 * 4, // RGBA * float32
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Create uniform buffer for compute shader parameters
    this.paramsBuffer = this.device.createBuffer({
      size: 8, // 2 * uint32 (frameCount, ledCount)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind group for compute shader
    this.frameBufferBindGroup = this.device.createBindGroup({
      layout: this.frameBufferPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.frameBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.averageBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.paramsBuffer,
          },
        },
      ],
    });

    // Create LED field data buffer
    const ledFieldData = new Float32Array(this.ledFields.length * 4);
    this.ledFields.forEach((field, i) => {
      const offset = i * 4;
      ledFieldData[offset + 0] = field.x;
      ledFieldData[offset + 1] = field.y;
      ledFieldData[offset + 2] = field.width;
      ledFieldData[offset + 3] = field.height;
    });

    this.ledFieldBuffer = this.device.createBuffer({
      size: ledFieldData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.ledFieldBuffer, 0, ledFieldData);

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      label: "LED bias shader",
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        };

        @vertex
        fn vertexShader(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          // Full screen triangle
          let pos = array(
            vec2f(-1.0,  3.0),
            vec2f(-1.0, -1.0),
            vec2f( 3.0, -1.0)
          );

          let texCoord = array(
            vec2f(0.0, -1.0),
            vec2f(0.0,  1.0),
            vec2f(2.0,  1.0)
          );

          var output: VertexOutput;
          output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
          output.texCoord = texCoord[vertexIndex];
          return output;
        }

        struct LedField {
          x: f32,
          y: f32,
          width: f32,
          height: f32,
        };

        @group(0) @binding(0) var videoTexture: texture_2d<f32>;
        @group(0) @binding(1) var<storage, read> ledFields: array<LedField>;

        @fragment
        fn fragmentShader(input: VertexOutput) -> @location(0) vec4f {
          let fragCoord = input.position.xy;
          let ledIndex = u32(fragCoord.x);

          if (ledIndex >= arrayLength(&ledFields)) {
            return vec4f(0.0, 0.0, 0.0, 1.0);
          }

          let field = ledFields[ledIndex];
          let textureDims = textureDimensions(videoTexture);
          let textureSize = vec2f(f32(textureDims.x), f32(textureDims.y));

          // Calculate pixel coordinates for sampling area
          let startPixelX = u32(field.x * textureSize.x);
          let startPixelY = u32(field.y * textureSize.y);
          let endPixelX = u32((field.x + field.width) * textureSize.x);
          let endPixelY = u32((field.y + field.height) * textureSize.y);

          // Clamp to texture bounds
          let minX = clamp(startPixelX, 0u, textureDims.x - 1u);
          let minY = clamp(startPixelY, 0u, textureDims.y - 1u);
          let maxX = clamp(endPixelX, 0u, textureDims.x - 1u);
          let maxY = clamp(endPixelY, 0u, textureDims.y - 1u);

          // Limit samples for performance
          let maxSamples = 20u;
          let stepX = max(1u, (maxX - minX) / maxSamples);
          let stepY = max(1u, (maxY - minY) / maxSamples);

          var colorSum = vec4f(0.0, 0.0, 0.0, 0.0);
          var sampleCount = 0u;

          // Average color over the LED field area using textureLoad
          for (var px = minX; px <= maxX; px = px + stepX) {
            for (var py = minY; py <= maxY; py = py + stepY) {
              colorSum += textureLoad(videoTexture, vec2u(px, py), 0);
              sampleCount = sampleCount + 1u;
            }
          }

          if (sampleCount > 0u) {
            return colorSum / f32(sampleCount);
          } else {
            return vec4f(0.0, 0.0, 0.0, 1.0);
          }
        }
      `,
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "read-only-storage",
          },
        },
      ],
    });

    // Create pipeline
    this.pipeline = this.device.createRenderPipeline({
      label: "LED bias pipeline",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: "vertexShader",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentShader",
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    // Create bind group
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.videoTexture.createView(),
        },
        {
          binding: 1,
          resource: {
            buffer: this.ledFieldBuffer,
          },
        },
      ],
    });
  }

  updateVideoTexture(
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
  ) {
    // Get actual dimensions based on source type
    let width = 0;
    let height = 0;

    if (source instanceof HTMLVideoElement) {
      width = source.videoWidth;
      height = source.videoHeight;
    } else if (source instanceof HTMLCanvasElement) {
      width = source.width;
      height = source.height;
    } else if (source instanceof ImageBitmap) {
      width = source.width;
      height = source.height;
    }

    // Skip if dimensions are invalid
    if (width === 0 || height === 0) {
      console.warn("Skipping texture update - source has zero dimensions");
      return;
    }

    this.device.queue.copyExternalImageToTexture(
      { source },
      { texture: this.videoTexture },
      { width, height },
    );
  }

  render() {
    const encoder = this.device.createCommandEncoder();

    // Render to our readable texture
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.renderTexture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.draw(3);
    renderPass.end();

    // Also render directly to canvas for display (instead of copying)
    const canvasPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    canvasPass.setPipeline(this.pipeline);
    canvasPass.setBindGroup(0, this.bindGroup);
    canvasPass.draw(3);
    canvasPass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  async updateFrameBuffer(pixels: Uint8Array) {
    // Calculate actual buffer size based on current FPS (fps * bufferSeconds)
    const targetBufferSize = Math.round(this.currentFPS * this.bufferSeconds);

    // Update the ring buffer with new frame data
    const offset = this.currentFrameIndex * this.ledCount * 4 * 4;

    // Convert Uint8 to Float32
    const floatData = new Float32Array(this.ledCount * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      const idx = i / 4;
      floatData[idx * 4 + 0] = pixels[i] / 255.0;
      floatData[idx * 4 + 1] = pixels[i + 1] / 255.0;
      floatData[idx * 4 + 2] = pixels[i + 2] / 255.0;
      floatData[idx * 4 + 3] = pixels[i + 3] / 255.0;
    }

    // Write to buffer at current frame position
    this.device.queue.writeBuffer(this.frameBuffer, offset, floatData);

    // Update ring buffer index and actual frame count
    this.currentFrameIndex = (this.currentFrameIndex + 1) % targetBufferSize;
    this.actualFrameCount = Math.min(
      this.actualFrameCount + 1,
      targetBufferSize,
    );
  }

  async computeAverageFrame(): Promise<Uint8Array> {
    // Only average the actual frames we have stored
    const framesToAverage = this.actualFrameCount;

    // Update uniform buffer with current frame count
    const paramsData = new Uint32Array([framesToAverage, this.ledCount]);
    this.device.queue.writeBuffer(this.paramsBuffer, 0, paramsData);

    // Run compute shader to calculate average
    const encoder = this.device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(this.frameBufferPipeline);
    computePass.setBindGroup(0, this.frameBufferBindGroup);
    computePass.dispatchWorkgroups(this.ledCount);
    computePass.end();

    // Read result from average buffer
    const readBuffer = this.device.createBuffer({
      size: this.ledCount * 4 * 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Copy from average buffer to read buffer
    encoder.copyBufferToBuffer(
      this.averageBuffer,
      0,
      readBuffer,
      0,
      this.ledCount * 4 * 4,
    );

    this.device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const floatData = new Float32Array(readBuffer.getMappedRange());

    // Convert back to Uint8 and swap BGR to RGB
    const result = new Uint8Array(this.ledCount * 4);
    for (let i = 0; i < this.ledCount; i++) {
      // Swap BGR to RGB
      result[i * 4 + 0] = Math.round(floatData[i * 4 + 2] * 255); // R = B
      result[i * 4 + 1] = Math.round(floatData[i * 4 + 1] * 255); // G = G
      result[i * 4 + 2] = Math.round(floatData[i * 4 + 0] * 255); // B = R
      result[i * 4 + 3] = Math.round(floatData[i * 4 + 3] * 255); // A = A
    }

    readBuffer.unmap();
    readBuffer.destroy();

    return result;
  }

  async readPixels(): Promise<Uint8Array> {
    if (this.useFrameBuffer) {
      // First get current frame pixels
      const currentPixels = await this.readCurrentFrame();
      // Update frame buffer
      await this.updateFrameBuffer(currentPixels);
      // Return averaged result
      return await this.computeAverageFrame();
    } else {
      return await this.readCurrentFrame();
    }
  }

  private async readCurrentFrame(): Promise<Uint8Array> {
    // Read from our render texture, not the canvas
    const bytesPerRow = Math.ceil((this.ledCount * 4 * 4) / 256) * 256;
    const buffer = this.device.createBuffer({
      size: bytesPerRow,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = this.device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: this.renderTexture },
      { buffer, bytesPerRow },
      { width: this.ledCount, height: 1 },
    );
    this.device.queue.submit([encoder.finish()]);

    await buffer.mapAsync(GPUMapMode.READ);
    const rawData = new Uint8Array(
      buffer.getMappedRange().slice(0, this.ledCount * 4),
    );

    // Convert BGRA to RGBA (swap R and B channels)
    const data = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 4) {
      data[i + 0] = rawData[i + 2]; // R = B
      data[i + 1] = rawData[i + 1]; // G = G
      data[i + 2] = rawData[i + 0]; // B = R
      data[i + 3] = rawData[i + 3]; // A = A
    }

    buffer.unmap();
    buffer.destroy();

    return data;
  }

  setFrameBufferEnabled(enabled: boolean) {
    this.useFrameBuffer = enabled;
    if (!enabled) {
      this.currentFrameIndex = 0;
      this.actualFrameCount = 0;
    }
  }

  updateFPS(fps: number) {
    this.currentFPS = fps;
    this.reallocateFrameBufferIfNeeded();
  }

  setBufferSeconds(seconds: number) {
    this.bufferSeconds = Math.max(0.01, seconds);
    this.reallocateFrameBufferIfNeeded();
  }

  private reallocateFrameBufferIfNeeded() {
    const requiredFrames = Math.round(this.currentFPS * this.bufferSeconds);
    if (requiredFrames === this.allocatedFrames) return;

    this.allocatedFrames = requiredFrames;
    this.currentFrameIndex = 0;
    this.actualFrameCount = 0;

    // Destroy old buffer and create new one
    this.frameBuffer.destroy();
    this.frameBuffer = this.device.createBuffer({
      size: this.ledCount * 4 * 4 * requiredFrames,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    // Recreate bind group with new buffer
    this.frameBufferBindGroup = this.device.createBindGroup({
      layout: this.frameBufferPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.frameBuffer } },
        { binding: 1, resource: { buffer: this.averageBuffer } },
        { binding: 2, resource: { buffer: this.paramsBuffer } },
      ],
    });
  }
}

interface DeviceProcessor {
  ip: string;
  processor: BiasWebGPU;
  config: any;
  ledFields: LedField[];
}

const deviceProcessors: Map<string, DeviceProcessor> = new Map();
let globalDevice: GPUDevice | null = null;
let globalVideo: HTMLVideoElement | null = null;
let globalContext: GPUCanvasContext | null = null;

async function handleDeviceUpdate(
  ip: string,
  deviceData: any,
  gpuDevice: GPUDevice,
  context: GPUCanvasContext,
  video: HTMLVideoElement | null,
) {
  const config = deviceData?.chaserConfig;
  if (!config || !video) {
    console.log(`No chaser config for device ${ip}, skipping...`);
    return;
  }

  // Generate LED fields based on config
  const ledFields = generateLedFields({
    ledsX: config.ledCountBottom + config.ledCountTop,
    ledsY: config.ledCountLeft + config.ledCountRight,
    bottom: config.ledCountBottom > 0,
    left: config.ledCountLeft > 0,
    right: config.ledCountRight > 0,
    top: config.ledCountTop > 0,
    clockwise: config.clockWise === 1,
    fieldHeight: config.fieldHeight,
    fieldWidth: config.fieldWidth,
    startLed: config.startLed,
  });

  // Check if processor exists and needs update
  if (deviceProcessors.has(ip)) {
    const existing = deviceProcessors.get(ip)!;

    // Check if configuration actually changed
    const configChanged =
      JSON.stringify(existing.config) !== JSON.stringify(config);

    if (configChanged) {
      console.log(`Updating configuration for device ${ip}`);

      // For significant changes, recreate the processor
      const processor = new BiasWebGPU(gpuDevice, context, ledFields);
      await processor.init(video.videoWidth, video.videoHeight);
      processor.setBufferSeconds(config.bufferSeconds);
      processor.setFrameBufferEnabled(existing.processor.useFrameBuffer);

      // Replace the processor
      deviceProcessors.set(ip, {
        ip,
        processor,
        config,
        ledFields,
      });

      console.log(`Device ${ip} reconfigured with ${ledFields.length} LEDs`);
    }
  } else {
    // Create new processor
    const processor = new BiasWebGPU(gpuDevice, context, ledFields);
    await processor.init(video.videoWidth, video.videoHeight);
    processor.setBufferSeconds(config.bufferSeconds);

    deviceProcessors.set(ip, {
      ip,
      processor,
      config,
      ledFields,
    });

    console.log(`Device ${ip} initialized with ${ledFields.length} LEDs`);
  }
}

async function startScreenCapture() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();

  if (!device) {
    console.error("WebGPU not supported");
    return;
  }

  // Device lost handling
  device.lost.then((info) => {
    console.error(`WebGPU device was lost: ${info.message}`);

    // Show error message to user
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff5555;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    errorDiv.innerHTML = `
      <h3>⚠️ WebGPU Device Lost</h3>
      <p>Reason: ${info.reason}</p>
      <p>Message: ${info.message || "Unknown error"}</p>
      <button onclick="location.reload()" style="
        background: white;
        color: #ff5555;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-top: 10px;
      ">Reload Page</button>
    `;
    document.body.appendChild(errorDiv);

    // If not intentionally destroyed, try to recover
    if (info.reason !== "destroyed") {
      console.log("Attempting to recover WebGPU device...");
      setTimeout(() => {
        location.reload(); // Simple recovery: reload the page
      }, 3000);
    }
  });

  // Setup canvas
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("webgpu");

  if (!context) {
    console.error("Failed to get WebGPU context");
    return;
  }

  // Store global references
  globalDevice = device;
  globalContext = context;

  // Set canvas size for visualization
  canvas.width = 114; // Default LED count for visualization
  canvas.height = 1;

  // Get screen capture - Electron specific
  try {
    // Check for global ipcRenderer (exposed by preload script)
    const globalAny = globalThis as any;
    const ipcRenderer = globalAny.ipcRenderer || globalAny.global?.ipcRenderer;

    if (!ipcRenderer) {
      console.error("ipcRenderer not found in:", {
        globalThis: Object.keys(globalThis),
        global: globalAny.global ? Object.keys(globalAny.global) : "undefined",
      });
      throw new Error("ipcRenderer not available - check preload script");
    }

    // Get screen sources from Electron
    const sources = await ipcRenderer.invoke("GET_SOURCES");
    console.log("Available sources:", sources);

    if (!sources || sources.length === 0) {
      throw new Error("No screen sources available");
    }

    // Prioritize screen sources over window sources
    let screenSource = sources.find((source: any) =>
      source.id.startsWith("screen:"),
    );

    // If no screen source found, try to find by name
    if (!screenSource) {
      screenSource = sources.find(
        (source: any) =>
          source.name === "Entire screen" ||
          source.name === "Gesamter Bildschirm" ||
          source.name.includes("Screen") ||
          source.name.includes("Bildschirm"),
      );
    }

    // Last fallback to first source
    if (!screenSource) {
      console.warn("No screen source found, using first available source");
      screenSource = sources[0];
    }

    console.log("Selected source:", screenSource);

    // Get media stream using getUserMedia with the screen source
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // @ts-ignore - Electron specific constraints
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: screenSource.id,
          maxWidth: 1920,
          maxHeight: 1080,
        },
      },
    } as any);

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    // Add video element to page for preview (small)
    video.style.width = "400px";
    video.style.height = "225px";
    video.style.border = "2px solid white";
    video.style.marginTop = "20px";
    video.style.display = "block";
    document.body.appendChild(video);

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(true);
      };
    });

    // Store global video reference
    globalVideo = video;

    // Get all existing device keys first
    const tempState = new State([]);
    const db = await tempState.dbConnect();
    const allKeys = await db.getAllKeys("state");
    const deviceKeys = allKeys.map((key) => key as string);

    // Initialize state to listen for ALL device changes
    const state = new State(deviceKeys, async (name, value) => {
      console.log(`Database change detected for device: ${name}`);
      if (globalDevice && globalVideo && globalContext) {
        await handleDeviceUpdate(
          name,
          value,
          globalDevice,
          globalContext,
          globalVideo,
        );
      }
    });

    // Load all existing devices
    for (const key of deviceKeys) {
      const deviceData = await state.get(key);
      if (deviceData && deviceData.chaserConfig) {
        console.log(
          `Loading device ${key} with config:`,
          deviceData.chaserConfig,
        );
        await handleDeviceUpdate(key, deviceData, device, context, video);
      }
    }

    // Create a default processor for visualization if no devices are configured
    let defaultProcessor: BiasWebGPU | null = null;
    if (deviceProcessors.size === 0) {
      const defaultFields = generateLedFields({
        ledsX: 10,
        ledsY: 0,
        bottom: true,
        left: false,
        right: false,
        top: false,
        clockwise: false,
        fieldHeight: 10,
        fieldWidth: 10,
        startLed: 0,
      });
      defaultProcessor = new BiasWebGPU(device, context, defaultFields);
      await defaultProcessor.init(video.videoWidth, video.videoHeight);
    }

    // Create status display
    const statusDiv = document.createElement("div");
    statusDiv.style.cssText = `
      display: flex;
      gap: 20px;
      align-items: center;
      margin: 20px 0;
      color: white;
      font-family: monospace;
    `;
    statusDiv.textContent = `Processing ${deviceProcessors.size} device(s)`;
    document.body.insertBefore(statusDiv, video);

    // Create result display area
    const resultDiv = document.createElement("div");
    resultDiv.style.cssText = `
      background: #333;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
      font-family: monospace;
      color: white;
      min-height: 50px;
    `;
    document.body.appendChild(resultDiv);

    // FPS display
    const fpsDiv = document.createElement("div");
    fpsDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: #50fa7b;
      padding: 5px 10px;
      font-family: monospace;
      border-radius: 4px;
      font-size: 12px;
    `;
    document.body.appendChild(fpsDiv);

    // Device status display
    const deviceStatusDiv = document.createElement("div");
    deviceStatusDiv.style.cssText = "margin-bottom: 10px; color: #50fa7b;";
    deviceStatusDiv.textContent = "Active devices will appear here...";
    resultDiv.appendChild(deviceStatusDiv);

    // LED display row for active devices
    const ledRow = document.createElement("div");
    ledRow.style.cssText =
      "display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;";
    resultDiv.appendChild(ledRow);

    // Create LED elements placeholder
    const ledElements: HTMLDivElement[] = [];
    const maxLeds = 114; // Maximum LEDs to display
    for (let i = 0; i < maxLeds; i++) {
      const ledDiv = document.createElement("div");
      ledDiv.style.cssText = `
        background: #000;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      ledDiv.textContent = i.toString();
      ledElements.push(ledDiv);
      ledRow.appendChild(ledDiv);
    }

    // Live processing variables
    let isLiveProcessing = true;
    let frameCount = 0;
    let lastTime = performance.now();
    const devicePixelData: Map<string, Uint8Array> = new Map();

    // Live processing function for all devices
    const processLiveFrame = async () => {
      if (!isLiveProcessing) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Process each device
        for (const [ip, deviceProc] of deviceProcessors) {
          // Update texture with current frame
          deviceProc.processor.updateVideoTexture(video);

          // Render
          deviceProc.processor.render();

          // Read pixels
          const pixels = await deviceProc.processor.readPixels();
          devicePixelData.set(ip, pixels);

          // Send LED data to device via IPC
          if (ipcRenderer) {
            ipcRenderer
              .invoke("SEND_LED_DATA", {
                ip: ip,
                data: Array.from(pixels),
                ledCount: deviceProc.ledFields.length,
              })
              .catch((err: any) => {
                console.error(`Failed to send data to ${ip}:`, err);
              });
          }

          // Update visual display for first device only
          if (
            deviceProcessors.size > 0 &&
            ip === Array.from(deviceProcessors.keys())[0]
          ) {
            const visibleLeds = Math.min(deviceProc.ledFields.length, maxLeds);
            for (let i = 0; i < visibleLeds; i++) {
              const offset = i * 4;
              const r = pixels[offset];
              const g = pixels[offset + 1];
              const b = pixels[offset + 2];
              const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

              ledElements[i].style.display = "flex";
              ledElements[i].style.background = hex;
              ledElements[i].style.color = r + g + b > 384 ? "black" : "white";
            }
          }
        }

        // Process default processor if exists
        if (defaultProcessor) {
          defaultProcessor.updateVideoTexture(video);
          defaultProcessor.render();
          const pixels = await defaultProcessor.readPixels();

          // Show default visualization if no devices
          if (deviceProcessors.size === 0) {
            for (let i = 0; i < 10; i++) {
              const offset = i * 4;
              const r = pixels[offset];
              const g = pixels[offset + 1];
              const b = pixels[offset + 2];
              const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

              ledElements[i].style.display = "flex";
              ledElements[i].style.background = hex;
              ledElements[i].style.color = r + g + b > 384 ? "black" : "white";
            }
          }
        }

        // Update status display
        deviceStatusDiv.textContent =
          deviceProcessors.size > 0
            ? `Processing ${deviceProcessors.size} device(s): ${Array.from(deviceProcessors.keys()).join(", ")}`
            : "No devices configured - waiting for device configuration...";

        // Update FPS
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
          const avgFrameTime = 1000 / frameCount;

          fpsDiv.innerHTML = `
            <div>FPS: <span style="color: ${frameCount >= 30 ? "#50fa7b" : "#ffb86c"}">${frameCount}</span></div>
            <div style="font-size: 10px; color: #8be9fd;">Frame time: ${avgFrameTime.toFixed(1)}ms</div>
            <div style="font-size: 10px; color: #6272a4;">Devices: ${deviceProcessors.size}</div>
          `;

          frameCount = 0;
          lastTime = currentTime;
        }
      }

      requestAnimationFrame(processLiveFrame);
    };

    // Start live processing
    processLiveFrame();

    // Show initial message with timestamp
    const timestamp = document.createElement("div");
    timestamp.style.cssText = "color: #888; font-size: 12px; margin-top: 10px;";
    timestamp.textContent = `Live processing started at: ${new Date().toLocaleTimeString()}`;
    resultDiv.appendChild(timestamp);
  } catch (error) {
    console.error("Failed to get screen capture:", error);
    document.body.innerHTML += `
      <div style="color: red; margin-top: 20px; font-family: monospace;">
        Error: Failed to get screen capture. ${error.message}
      </div>
    `;
  }
}

// Start the application
startScreenCapture();
