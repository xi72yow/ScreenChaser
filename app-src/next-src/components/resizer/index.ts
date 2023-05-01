function createDownScaleCore(canvas, width, height) {
  const downscaleWidth = width * 2;
  const downscaleHeight = height * 2;

  canvas.width = downscaleWidth;
  canvas.height = downscaleHeight;

  const gl = canvas.getContext("webgl");

  // Create the texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Create the vertex shader
  // TODO: fix clipspace
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;
  
  
    void main() {
      v_texCoord = vec2(a_position.x, a_position.y);
      gl_Position = vec4(a_position.x, a_position.y, 0, 1);
    }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // Create the fragment shader
  const fragmentShaderSource = `
    precision highp float;
    uniform sampler2D u_image;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;
  
    void main() {
      // +1.0 to temp fix clipspace
      vec2 texCoord = vec2((v_texCoord.x+1.0) * (u_resolution.x / ${downscaleWidth}.0), (v_texCoord.y+1.0) * (u_resolution.y / ${downscaleHeight}.0));
      vec4 color = texture2D(u_image, texCoord);
      gl_FragColor = color;
    }
  `;

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Create the position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create the position attribute
  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // Create the resolution uniform
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // Create the image uniform
  const imageLocation = gl.getUniformLocation(program, "u_image");
  gl.uniform1i(imageLocation, 0);

  return gl;
}

function downScaleImageBitmap(imageBitmap, width, height, gl) {
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    imageBitmap
  );

  // Draw the image to the canvas
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Read the pixels from the canvas
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return pixels;
}

export { downScaleImageBitmap, createDownScaleCore };
