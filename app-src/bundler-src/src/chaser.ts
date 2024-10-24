import { generateLedFields } from "./biasCalculation/ledFields";

async function checkWebGpu() {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    console.error("WebGPU not supported... :(");
    return;
  }
  console.log("WebGPU supported! Let's go! 🚀");
}

async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    fail("need a browser that supports WebGPU");
    return;
  }

  device.lost.then((info) => {
    console.error(`WebGPU device was lost: ${info.message}`);

    // 'reason' will be 'destroyed' if we intentionally destroy the device.
    if (info.reason !== "destroyed") {
      // try again
      //start();
    }
  });

  // Get a WebGPU context from the canvas and configure it
  const canvas = document.querySelector("canvas");

  const ledCount = 5;

  canvas.width = ledCount;
  canvas.height = 1;

  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const ledFields = generateLedFields({
    ledsX: 2,
    ledsY: 2,
    bottom: true,
    left: false,
    right: false,
    top: false,
    clockwise: true,
    fieldHeight: 10,
    fieldWidth: 10,
    startLed: 0,
  });

  const ledFieldTexture = device.createTexture({
    size: [ledCount, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  console.log("🚀 ~ main ~ ledFieldTexture:", ledFields);

  const ledFieldTextureData = new Uint8Array(ledFields.length * 4);

  ledFields.forEach((field, i) => {
    const offset = i * 4;
    ledFieldTextureData[offset + 0] = field.x;
    ledFieldTextureData[offset + 1] = field.y;
    ledFieldTextureData[offset + 2] = field.width;
    ledFieldTextureData[offset + 3] = field.height;
  });

  device.queue.writeTexture(
    { texture: ledFieldTexture },
    ledFieldTextureData,
    { bytesPerRow: ledFieldTextureData.length },
    { width: ledCount, height: 1 }
  );

  const sampler = device.createSampler();

  const module = device.createShaderModule({
    label: "our hardcoded red triangle shaders",
    code: `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f
      };

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let pos = array(
          vec2f(-1.0,  3.0),  
          vec2f(-1.0, -1.0),  
          vec2f( 3.0, -1.0)   
        );
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        return vsOutput;
      }

      @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
        let red = vec4f(1, 0, 0, 1);
        let cyan = vec4f(0, 1, 1, 1);
 
        let grid = vec2u(fsInput.position.xy);
        let checker = (grid.x) % 2 == 1;
 
        return select(red, cyan, checker);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red triangle pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const renderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0, 0, 0, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  function render() {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: "our encoder" });

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.draw(3); // call our vertex shader 3 times.
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  render();
}

function fail(msg) {
  // eslint-disable-next-line no-alert
  alert(msg);
}

async function run() {
  await checkWebGpu();
  main();
}

run();
