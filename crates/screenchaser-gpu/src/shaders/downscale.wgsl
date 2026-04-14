@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> output: array<u32>;
@group(0) @binding(2) var<uniform> params: vec2u;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let out_w = params.x;
    let out_h = params.y;

    if (id.x >= out_w || id.y >= out_h) {
        return;
    }

    let tex_dims = textureDimensions(input_texture);
    let src_x = id.x * tex_dims.x / out_w;
    let src_y = id.y * tex_dims.y / out_h;

    let color = textureLoad(input_texture, vec2u(src_x, src_y), 0);
    let r = u32(clamp(color.r * 255.0, 0.0, 255.0));
    let g = u32(clamp(color.g * 255.0, 0.0, 255.0));
    let b = u32(clamp(color.b * 255.0, 0.0, 255.0));

    output[id.y * out_w + id.x] = r | (g << 8u) | (b << 16u) | (255u << 24u);
}
