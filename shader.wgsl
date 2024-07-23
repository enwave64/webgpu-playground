// https://codelabs.developers.google.com/your-first-webgpu-app#3:~:text=Define%20the%20vertex%20shader

// defines a uniform, a 2d float vector that matches the uniform buffer
// the uniform is specified to be bound at @group(0) and @binding(0)
@group(0) @binding(0) var<uniform> grid: vec2f;

// A vertex shader must return at least the final position of the vertex
// being processed in clip space. This is always given as a 4D vector
// must have @vertex attribute


// the GPU calls a vertex shader function once for every vertex in your vertexBuffer. Each time it is called (per vertex),
// a different position from the vertexBuffer is passed tot he function as an arg, and the it's the job of the vertex shader function
// to return a corresponding position in clip space.

// It's important to note these won't necessarily be called in sequential order, either. GPUs excel at running shaders in parallel.
// In order to ensure extreme parallelization, vertex shaders can communicate with each other. Each shader invocation can only see data f
// for a sihngle vertex at a time, and it's only able to ouptut values for a single vertex
 

@vertex
fn vertexMain(@location(0) pos: vec2f, @builtin(instance_index) instance: u32) -> @builtin(position) vec4f {

    // // Add 1 to the position before dividing by the grid size
    // // note that let in wgsl is like JS const; if you need mutable use var
    // // pos is doign a component-wise add: like pos + vec2f(1, 1)
    // // same goes for grid - 1
    // let cell = vec2f(1, 1); // Cell(1,1) in the grid image

    // // but lets save the instance index as a float now and use that instead
    // // the f32() is effectively a typecast from the u32
    let i = f32(instance);

    // // this is create, but it it just gives you a diagonal
    // let cell = vec2f(i, i); // Cell(1,1) in the grid image
    
    // instead, we need some math; compute the cell coordinate from the instance_index
    // modulo over grid width so we cycle throug on repetition: 0,1,2,3 ; 0,1,2,3, etc
    // floor of i divided by grid width so we gradually increment: 0,0,0,0 ; 1,1,1,1 etc 
    let cell = vec2f(i % grid.x, floor(i / grid.x));


    // since the canvas coordinates go from -1 to +1, it's actually 2 units across. That means if you want to move a vertex one-fourth of the canvas over, you have to move it 0.5 units. 
    let cellOffset = cell / grid * 2; // Compute the offset to the cell. The 2 is for moving the 0.5 units
    let gridPos = (pos + 1) / grid - 1 + cellOffset;
    // this division is component wise, like vec2f(pos.x / grid.x, pos.y / grid.y)
    return vec4f(gridPos, 0, 1); // pos here maps to pos.x and pos.y
}

// Fragment shaders are similar to vertex, but they are invoked for every pixel drawn
// They are always called after vertex shaders.

// Fragment shaders are always called after vertex shaders. 
// The GPU takes the output of the vertex shaders and triangulates it, creating triangles out of sets of three points. 
// It then rasterizes each of those triangles by figuring out which pixels of the output color attachments 
// are included in that triangle, and then calls the fragment shader once for each of those pixels. 
// The fragment shader returns a color, typically calculated from values sent to it from the vertex shader 
// and assets like textures, which the GPU writes to the color attachment.

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(0.2, 1, 0.74, 1);
}


