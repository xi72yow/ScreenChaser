@group(0) @binding(0) var<storage, read_write> frame_buffer: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> average_output: array<vec4f>;
@group(0) @binding(2) var<uniform> params: vec2u; // x: frame_count, y: led_count

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let led_index = id.x;
    let frame_count = params.x;
    let led_count = params.y;

    if (led_index >= led_count) {
        return;
    }

    var sum = vec4f(0.0, 0.0, 0.0, 0.0);
    for (var frame = 0u; frame < frame_count; frame++) {
        sum += frame_buffer[frame * led_count + led_index];
    }

    if (frame_count > 0u) {
        average_output[led_index] = sum / f32(frame_count);
    } else {
        average_output[led_index] = vec4f(0.0, 0.0, 0.0, 1.0);
    }
}
