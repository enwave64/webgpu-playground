const FONT_PATH = 'Roboto-Regular.png'

const vsShaderCode = /* wgsl */`
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@location(0) position: vec4<f32>, @location(1) uv: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = position;
  output.uv = uv;
  return output;
}
`;

// Enhanced Fragment Shader Code for Black Text with White Outline on Orange Background
const fsShaderCode = /* wgsl */`
@group(0) @binding(0) var myTexture: texture_2d<f32>;
@group(0) @binding(1) var mySampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let sdf = textureSample(myTexture, mySampler, uv).r;
  let distance = (sdf - 0.5) / fwidth(sdf);
  let alpha = clamp(distance, 0.0, 1.0);

  let textColor = vec4<f32>(0.0, 0.0, 0.0, alpha); // Black text
  let outlineColor = vec4<f32>(1.0, 1.0, 1.0, smoothstep(0.4, 0.5, sdf)); // White outline

  return mix(outlineColor, textColor, alpha);
}
`;

async function initWebGPU(canvas) {
  if (!navigator.gpu) {
    console.error("WebGPU not supported!");
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const context = canvas.getContext('webgpu');
  const swapChainFormat = 'bgra8unorm';

  context.configure({
    device,
    format: swapChainFormat,
    alphaMode: 'opaque'
  });

  return { device, context, swapChainFormat };
}

async function loadTexture(device, url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  
  const imageBitmap = await createImageBitmap(img);

  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height, 1]
  );

  return texture;
}

function createPipeline(device, swapChainFormat, texture, sampler) {
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} }
    ]
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });

  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({
        code: vsShaderCode,
      }),
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: 24,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x4' },
          { shaderLocation: 1, offset: 16, format: 'float32x2' }
        ]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: fsShaderCode,
      }),
      entryPoint: 'fs_main',
      targets: [{
        format: swapChainFormat,
      }]
    },
    primitive: {
      topology: 'triangle-strip',
      stripIndexFormat: 'uint32'
    },
  });

  const textureBindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: texture.createView() },
      { binding: 1, resource: sampler }
    ]
  });

  return { pipeline, textureBindGroup };
}

function createVertexBuffer(device) {
  const vertices = new Float32Array([
    // positions        // uvs
    -1.0, -1.0, 0.0, 1.0,  0.0, 0.0,
     1.0, -1.0, 0.0, 1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0, 1.0,  0.0, 1.0,
     1.0,  1.0, 0.0, 1.0,  1.0, 1.0,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  return vertexBuffer;
}

async function renderText(device, context, pipeline, textureBindGroup, vertexBuffer) {
  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();

  const renderPassDescriptor = {
    colorAttachments: [{
      view: textureView,
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: { r: 1.0, g: 0.65, b: 0.0, a: 1.0 }, // Orange background
    }],
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.setBindGroup(0, textureBindGroup);
  passEncoder.draw(4, 1, 0, 0);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}

(async () => {
  const canvas = document.getElementById('canvas');

  const { device, context, swapChainFormat } = await initWebGPU(canvas);
  const texture = await loadTexture(device, FONT_PATH); // Use FONT_PATH here
  const sampler = device.createSampler();

  const { pipeline, textureBindGroup } = createPipeline(device, swapChainFormat, texture, sampler);
  const vertexBuffer = createVertexBuffer(device);

  function frame() {
    renderText(device, context, pipeline, textureBindGroup, vertexBuffer);
    requestAnimationFrame(frame);
  }

  frame();
})();

