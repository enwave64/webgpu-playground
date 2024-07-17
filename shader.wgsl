// A vertex shader must return at least the final position of the vertex
// being processed in clip space. This is always given as a 4D vector
// must have @vertex attribute

/**
the GPU calls a vertex shader function once for every vertex in your vertexBuffer. Each time it is called (per vertex),
a different position from the vertexBuffer is passed tot he function as an arg, and the it's the job of the vertex shader function
to return a corresponding position in clip space.

It's important to note these won't necessarily be called in sequential order, either. GPUs excel at running shaders in parallel.
In order to ensure extreme parallelization, vertex shaders can communicate with each other. Each shader invocation can only see data f
for a sihngle vertex at a time, and it's only able to ouptut values for a single vertex
 **/

@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1); // pos here maps to pos.x and pos.y
}

// Fragment shaders are similar to vertex, but they are invoked for every pixel drawn
// They are always called after vertex shaders.

/* 
Fragment shaders are always called after vertex shaders. 
The GPU takes the output of the vertex shaders and triangulates it, creating triangles out of sets of three points. 
It then rasterizes each of those triangles by figuring out which pixels of the output color attachments 
are included in that triangle, and then calls the fragment shader once for each of those pixels. 
The fragment shader returns a color, typically calculated from values sent to it from the vertex shader 
and assets like textures, which the GPU writes to the color attachment.
*/
@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(0.2, 1, 0.74, 1);
}