import { type } from "os";
import { LedField } from "./ledFields";

type VideoFrame = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  var shader = gl.createShader(type);

  if (!shader) throw new Error("Shader could not be created.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  throw new Error("Shader could not be compiled.");
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  var program = gl.createProgram();

  if (!program) throw new Error("Program could not be created.");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function createWebGLTextureFromImage(
  gl: WebGL2RenderingContext,
  image:
    | HTMLVideoElement
    | HTMLImageElement
    | HTMLCanvasElement
    | VideoFrame
    | undefined,
  unit: number,
  srcFormat: number,
  srcType: number,
  internalFormat: number = gl.RGBA
) {
  if (!image) throw new Error("Image not found.");
  // Create a texture.
  const texture = gl.createTexture();

  // make unit 0 the active texture uint
  // (ie, the unit all other texture commands will affect
  gl.activeTexture(gl.TEXTURE0 + unit);

  // Bind it to texture unit 0' 2D bind point
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we don't need mips and so we're not filtering
  // and we don't repeat at the edges
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  const mipLevel = 0; // the largest mip

  gl.texImage2D(
    gl.TEXTURE_2D,
    mipLevel,
    internalFormat,
    srcFormat, // format of data we are supplying
    srcType, // type of data we are supplying
    image
  );

  return texture;
}

function createWebGLTextureFromArray(
  gl: WebGL2RenderingContext,
  array: Uint8ClampedArray | Float32Array,
  unit: number,
  srcFormat: number,
  srcType: number
) {
  // Create a texture.
  const texture = gl.createTexture();

  // make unit 0 the active texture uint
  // (ie, the unit all other texture commands will affect
  gl.activeTexture(gl.TEXTURE0 + unit);

  // Bind it to texture unit 0' 2D bind point
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we don't need mips and so we're not filtering
  // and we don't repeat at the edges
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  const mipLevel = 0; // the largest mip
  const internalFormat = gl.RGBA32F; // format we want in the texture

  gl.texImage2D(
    gl.TEXTURE_2D,
    mipLevel,
    internalFormat,
    array.length / 4,
    1,
    0,
    srcFormat, // format of data we are supplying
    srcType, // type of data we are supplying
    array
  );

  return texture;
}

function setRectangle(
  gl: WebGL2RenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

function readPixels(gl: WebGL2RenderingContext | undefined): Uint8Array {
  if (!gl) throw new Error("WebGL not initialized.");
  // read pixels
  const pixels = new Uint8Array(gl.canvas.width * 4);

  gl.readPixels(0, 0, gl.canvas.width, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  return pixels;
}

function logPixels(pixels: string[]) {
  // read pixels

  for (let i = 0; i < pixels.length; i++) {
    console.log(`%cLED${i}: ${pixels[i]}`, `color: #${pixels[i]}`);
  }
  return pixels;
}

function updateTexture(
  gl: WebGL2RenderingContext,
  texture: number,
  videoFrame: VideoFrame
) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.activeTexture(texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    videoFrame
  );
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.flush();
  gl.finish();
}

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// used to pass the current pos to the fragment shader
out vec4 v_position;

// all shaders have a main function
void main() {
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;
  
  // current vertex position
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // pass the current position to the fragment shader to read from data texture
  v_position = vec4(zeroToOne, 0, 1);
}
`;

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

//our data texture
uniform sampler2D u_dataTexture;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// the current position of the vertex
in vec4 v_position;

// we need to declare an output for the fragment shader
// vec4 component names are x, y, z, and w (or r, g, b, a) 
out vec4 outColor;

vec4 colorSum = vec4(0.0, 0.0, 0.0, 0.0);

void main() {
  // get the current field data
  vec4 currentFieldData = texture(u_dataTexture, vec2(v_position.x, v_position.y));

  vec2 textureSize = vec2(textureSize(u_image, 0));

  vec2 onePixel = vec2(1) / textureSize;

  vec2 fragCoord = gl_FragCoord.xy;
  
  // read the current field data
  float clipX = currentFieldData.x;
  float clipY = currentFieldData.y;


  float clipWidth = currentFieldData.z;
  float clipHeight = currentFieldData.w; 

  // get the texel size
  float texelWidth = 1.0 / textureSize.x;
  float texelHeight = 1.0 / textureSize.y;
  vec2 texelSize = vec2(texelWidth, texelHeight);

  int rectWidth = int(clipWidth / texelWidth);
  if (rectWidth == 0) rectWidth = 1;

  int rectHeight = int(clipHeight / texelHeight);
  if (rectHeight == 0) rectHeight = 1;

  //sum up the color
  for (int x = 0; x < rectWidth; x++) {
    for (int y = 0; y < rectHeight; y++) {
      vec2 texCoord = vec2(clipX, clipY) + vec2(x, y) * onePixel;
      colorSum += texture(u_image, texCoord);
    }
  }

  // get the color average
  float pixelCount = float(rectWidth * rectHeight);

  if (pixelCount > 0.0) {
    outColor = colorSum / pixelCount;
  } else {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
  } 

  //outColor = texture(u_image, vec2(0.5, 1.0));

  //outColor = vec4(float(rectHeight)/255.0, 0.0, 0.0, 1.0);

  //outColor = currentFieldData;
}
`;

function renderSituationPreview(
  video: HTMLVideoElement,
  ledFields: LedField[],
  id: string
) {
  // create a canvas to render the video
  let preview = document.getElementById(
    "inspection-shaft-canvas" + id
  ) as HTMLCanvasElement;
  if (!preview) {
    preview = document.createElement("canvas");
    preview.id = "inspection-shaft-canvas" + id;
    preview.classList.add("pixelated");
    document.body.appendChild(preview);
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  // render the image to the canvas
  preview.width = width;
  preview.height = height;

  const ctx = preview.getContext("2d") as CanvasRenderingContext2D;

  ctx.drawImage(video, 0, 0);

  //render led fields to the preview canvas
  const indikatorColor = "rgba(255, 0, 0, 0.5)";
  ledFields.forEach((field, i) => {
    if (ledFields.length < 50) {
      ctx.font = "40px Arial";
      ctx.fillStyle = indikatorColor;
      ctx.fillText(
        i.toString(),
        field.x * width,
        field.y * height + 0.5 * field.height * height
      );
    }
    ctx.fillStyle = indikatorColor;
    ctx.fillRect(
      field.x * width,
      field.y * height,
      field.width * width,
      field.height * height
    );
  });
}

export class BiasCore {
  id: string = "";
  destroyed: boolean = false;
  ledFields: LedField[] = [];
  gl: WebGL2RenderingContext | undefined;
  program: WebGLProgram | undefined;
  canvas: OffscreenCanvas | undefined;
  videoFrameCallback: () => void = () => {};
  videoCallbackIndikator: number | undefined;
  constructor(
    id: string,
    ledFields: LedField[],
    width: number,
    height: number
  ) {
    this.id = id;

    if (ledFields) this.ledFields = ledFields;
    else throw new Error("No led fields provided.");

    this.init(width, height);
  }

  init(width: number, height: number) {
    this.canvas = new OffscreenCanvas(this.ledFields.length, 1);
    this.canvas.width = this.ledFields.length;

    const firstRenderCanvas = document.createElement("canvas");
    firstRenderCanvas.width = width;
    firstRenderCanvas.height = height;

    if (!this.canvas) {
      throw new Error("Canvas could not be created.");
    }

    this.gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!this.gl) {
      throw new Error("WebGL2 is not available.");
    }

    // setup GLSL program
    // compile shaders
    const vertexShader = createShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );

    const fragmentShader = createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    // setup GLSL program
    this.program = createProgram(this.gl, vertexShader, fragmentShader);

    if (!this.program) {
      throw new Error("Program could not be created.");
    }

    // look up where the vertex data needs to go.
    const positionAttributeLocation = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );

    // lookup uniforms
    const resolutionLocation = this.gl.getUniformLocation(
      this.program,
      "u_resolution"
    );
    const imageLocation = this.gl.getUniformLocation(this.program, "u_image");
    const dataTextureLocation = this.gl.getUniformLocation(
      this.program,
      "u_dataTexture"
    );

    // Create a vertex array object (attribute state)
    const vao = this.gl.createVertexArray();

    // and make it the one we're currently working with
    this.gl.bindVertexArray(vao);

    // Create a buffer and put a single pixel space rectangle in
    // it (2 triangles)
    const positionBuffer = this.gl.createBuffer();

    // Turn on the attribute
    this.gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration
    var type = this.gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // Create a texture.
    const frameTexture = createWebGLTextureFromImage(
      this.gl,
      firstRenderCanvas,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE
    );

    const data = new Float32Array(
      this.ledFields
        .map(({ x, y, width, height }) => [x, y, width, height])
        .flat()
    );

    const dataTexture = createWebGLTextureFromArray(
      this.gl,
      data,
      1,
      this.gl.RGBA,
      this.gl.FLOAT
    );

    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Clear the canvas
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    this.gl.useProgram(this.program);

    // Bind the attribute/buffer set we want.
    this.gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from pixels to clipspace in the shader
    this.gl.uniform2f(
      resolutionLocation,
      this.gl.canvas.width,
      this.gl.canvas.height
    );

    // Tell the shader to get the texture from texture unit 0
    this.gl.uniform1i(imageLocation, 0);

    // Tell the shader to get the texture from texture unit 1
    this.gl.uniform1i(dataTextureLocation, 1);

    // Bind the position buffer so gl.bufferData that will be called
    // in setRectangle puts data in the position buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Set a rectangle the same size as canvas.
    setRectangle(this.gl, 0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Draw the canvas rectangle.
    var primitiveType = this.gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    this.gl.drawArrays(primitiveType, offset, count);
  }

  processVideoFrame = (videoFrame: VideoFrame) => {
    if (!this.gl || !this.program || !videoFrame)
      throw new Error("WebGL not initialized.");

    updateTexture(this.gl, this.gl.TEXTURE0, videoFrame);
    return readPixels(this.gl);
  };

  /*  renderSituationPreview = (id: string) => {
    if (!this.video) throw new Error("Video not initialized.");
    renderSituationPreview(this.video, this.ledFields, id);
  }; */
}
