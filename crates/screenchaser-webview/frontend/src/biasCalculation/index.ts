import { LedField } from "./ledFields";

type VideoFrame = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

async function createShaderModule(
  device: GPUDevice,
  code: string,
  type: "vertex" | "fragment"
): Promise<GPUShaderModule> {
  return device.createShaderModule({
    code,
    label: type + " shader",
  });
}

async function createPipeline(
  device: GPUDevice,
  vertexShaderModule: GPUShaderModule,
  fragmentShaderModule: GPUShaderModule,
  format: GPUTextureFormat
): Promise<GPURenderPipeline> {
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: vertexShaderModule,
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 8,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x2",
            },
          ],
        },
      ],
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: "main",
      targets: [
        {
          format,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });
}

async function createTextureFromImage(
  device: GPUDevice,
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  format: GPUTextureFormat
): Promise<GPUTexture> {
  const texture = device.createTexture({
    size: [image.width, image.height, 1],
    format,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const imageBitmap = await createImageBitmap(image);
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [image.width, image.height, 1]
  );

  return texture;
}

async function createTextureFromArray(
  device: GPUDevice,
  array: Uint8ClampedArray | Float32Array,
  width: number,
  height: number,
  format: GPUTextureFormat
): Promise<GPUTexture> {
  const texture = device.createTexture({
    size: [width, height, 1],
    format,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const buffer = device.createBuffer({
    size: array.byteLength,
    usage: GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });

  new (array.constructor as new (buffer: ArrayBuffer) =>
    | Uint8ClampedArray
    | Float32Array)(buffer.getMappedRange()).set(array);
  buffer.unmap();

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToTexture(
    { buffer, bytesPerRow: width * array.BYTES_PER_ELEMENT },
    { texture },
    [width, height, 1]
  );

  device.queue.submit([commandEncoder.finish()]);

  return texture;
}

async function readPixels(
  device: GPUDevice,
  texture: GPUTexture,
  width: number,
  height: number
): Promise<Uint8Array> {
  const buffer = device.createBuffer({
    size: width * height * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToBuffer(
    { texture },
    { buffer, bytesPerRow: width * 4 },
    [width, height, 1]
  );

  device.queue.submit([commandEncoder.finish()]);

  await buffer.mapAsync(GPUMapMode.READ);
  const arrayBuffer = buffer.getMappedRange();
  const pixels = new Uint8Array(arrayBuffer.slice(0));
  buffer.unmap();

  return pixels;
}

const vertexShaderSource = `#version 450
layout(location = 0) in vec2 a_position;
layout(location = 1) uniform vec2 u_resolution;
layout(location = 2) out vec4 v_position;

void main() {
  vec2 zeroToOne = a_position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  v_position = vec4(zeroToOne, 0, 1);
}
`;

const fragmentShaderSource = `#version 450
layout(set = 0, binding = 0) uniform sampler2D u_image;
layout(set = 0, binding = 1) uniform sampler2D u_dataTexture;
layout(location = 2) in vec4 v_position;
layout(location = 0) out vec4 outColor;

void main() {
  vec4 currentFieldData = texture(u_dataTexture, vec2(v_position.x, v_position.y));
  vec2 textureSize = vec2(textureSize(u_image, 0));
  vec2 onePixel = vec2(1) / textureSize;
  vec2 fragCoord = gl_FragCoord.xy;
  float clipX = currentFieldData.x;
  float clipY = currentFieldData.y;
  float clipWidth = currentFieldData.z;
  float clipHeight = currentFieldData.w;
  float texelWidth = 1.0 / textureSize.x;
  float texelHeight = 1.0 / textureSize.y;
  vec2 texelSize = vec2(texelWidth, texelHeight);
  int rectWidth = int(clipWidth / texelWidth);
  if (rectWidth == 0) rectWidth = 1;
  int rectHeight = int(clipHeight / texelHeight);
  if (rectHeight == 0) rectHeight = 1;
  vec4 colorSum = vec4(0.0, 0.0, 0.0, 0.0);
  for (int x = 0; x < rectWidth; x++) {
    for (int y = 0; y < rectHeight; y++) {
      vec2 texCoord = vec2(clipX, clipY) + vec2(x, y) * onePixel;
      colorSum += texture(u_image, texCoord);
    }
  }
  float pixelCount = float(rectWidth * rectHeight);
  if (pixelCount > 0.0) {
    outColor = colorSum / pixelCount;
  } else {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}
`;

export class BiasCore {
  id: string = "";
  destroyed: boolean = false;
  ledFields: LedField[] = [];
  device: GPUDevice | undefined;
  pipeline: GPURenderPipeline | undefined;
  canvas: OffscreenCanvas | undefined;
  videoFrameCallback: () => void = () => {};
  videoCallbackIndikator: number | undefined;

  constructor(id: string, ledFields: LedField[]) {
    this.id = id;

    if (ledFields) this.ledFields = ledFields;
    else throw new Error("No led fields provided.");

    this.init();
  }

  async init() {
    this.canvas = new OffscreenCanvas(this.ledFields.length, 1);
    this.canvas.width = this.ledFields.length;

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("WebGPU adapter not found.");

    this.device = await adapter.requestDevice();
    if (!this.device) throw new Error("WebGPU device not found.");

    const vertexShaderModule = await createShaderModule(
      this.device,
      vertexShaderSource,
      "vertex"
    );

    const fragmentShaderModule = await createShaderModule(
      this.device,
      fragmentShaderSource,
      "fragment"
    );

    this.pipeline = await createPipeline(
      this.device,
      vertexShaderModule,
      fragmentShaderModule,
      "rgba8unorm"
    );

    const data = new Float32Array(
      this.ledFields
        .map(({ x, y, width, height }) => [x, y, width, height])
        .flat()
    );

    const dataTexture = await createTextureFromArray(
      this.device,
      data,
      this.ledFields.length,
      1,
      "rgba32float"
    );

    // Additional setup for rendering, binding groups, etc.
  }

  async processVideoFrame(videoFrame: VideoFrame) {
    if (!this.device || !this.pipeline || !videoFrame)
      throw new Error("WebGPU not initialized.");

    const texture = await createTextureFromImage(
      this.device,
      videoFrame,
      "rgba8unorm"
    );

    // Additional rendering commands to process the video frame and read pixels
    const pixels = await readPixels(
      this.device,
      texture,
      this.canvas!.width,
      this.canvas!.height
    );

    return pixels;
  }
}
