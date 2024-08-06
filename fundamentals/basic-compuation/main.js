// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html

// WebGPU is an asynchronous API so it’s easiest to use in an async function.
const main = async () => {
  const adapter = await navigator.gpu?.requestAdapter()
  const device = await adapter?.requestDevice()
  if (!device) {
    fail('browser does not support WebGPU')
  }

  const canvas = document.querySelector('canvas')
  const context = canvas.getContext('webgpu')
  const presentationFormat = navigator.gpu?.getPreferredCanvasFormat() //either rgba8unorm or bgra8unorm
  context.configure({
    device,
    format: presentationFormat,
  })

  const module = device.createShaderModule({
    label: 'doubling compute module',
    code: /* wgsl */`
      @group(0) @binding(0) var<storage, read_write> data: array<f32>;
 
      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3u
      ) {
        let i = id.x;
        data[i] = data[i] * 2.0;
      }
    `,
  })

  const pipeline = device.createComputePipeline({
    label: 'doubling compute pipeline',
    layout: 'auto',
    compute: {
      module,
    },
  })

  const input = new Float32Array([1, 3, 5])

  // in order for webgpu to use the input buffer, we need to make a corresponding buffer
  // on the gpu and copy it in
  const workBuffer = device.createBuffer({
    label: 'work buffer',
    size: input.byteLength,
    // some flags that let us read/write
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  })

  // copy our input data into the buffer
  device.queue.writeBuffer(workBuffer, 0, input)

  // we can't directly read the gpu buffer, we need to map it back to a js buffer
  const resultBuffer = device.createBuffer({
    label: 'result buffer',
    size: input.byteLength,
    // map flags
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  })

  // Setup a bindGroup to tell the shader which
  // buffer to use for the computation
  const bindGroup = device.createBindGroup({
    label: 'bindGroup for work buffer',
    // the 0 corresponds to group 0 in the shader
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: workBuffer } },
    ],
  })

  // Encode commands to do the computation
  const encoder = device.createCommandEncoder({
    label: 'doubling encoder',
  });
  const pass = encoder.beginComputePass({
    label: 'doubling compute pass',
  });
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  // always needed for a compute shader
  pass.dispatchWorkgroups(input.length)
  pass.end()

  // Encode a command to copy the results to a mappable buffer.
  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size)


  // Read the results
  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());

  console.log('input', input);
  console.log('result', result);

  resultBuffer.unmap();
}

const fail = () => {
  alert(msg)
}

main()

