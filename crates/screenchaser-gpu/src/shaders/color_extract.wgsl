struct LedField {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
};

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var<storage, read> led_fields: array<LedField>;
@group(0) @binding(2) var<storage, read_write> output_colors: array<vec4f>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let led_index = id.x;
    if (led_index >= arrayLength(&led_fields)) {
        return;
    }

    let field = led_fields[led_index];
    let tex_dims = textureDimensions(input_texture);
    let tex_w = f32(tex_dims.x);
    let tex_h = f32(tex_dims.y);

    let min_x = u32(clamp(field.x * tex_w, 0.0, tex_w - 1.0));
    let min_y = u32(clamp(field.y * tex_h, 0.0, tex_h - 1.0));
    let max_x = u32(clamp((field.x + field.width) * tex_w, 0.0, tex_w - 1.0));
    let max_y = u32(clamp((field.y + field.height) * tex_h, 0.0, tex_h - 1.0));

    let max_samples = 20u;
    let step_x = max(1u, (max_x - min_x) / max_samples);
    let step_y = max(1u, (max_y - min_y) / max_samples);

    var color_sum = vec4f(0.0, 0.0, 0.0, 0.0);
    var sample_count = 0u;

    for (var px = min_x; px <= max_x; px += step_x) {
        for (var py = min_y; py <= max_y; py += step_y) {
            color_sum += textureLoad(input_texture, vec2u(px, py), 0);
            sample_count += 1u;
        }
    }

    if (sample_count > 0u) {
        output_colors[led_index] = color_sum / f32(sample_count);
    } else {
        output_colors[led_index] = vec4f(0.0, 0.0, 0.0, 1.0);
    }
}
