use crate::{ChaserConfig, LedField};

#[derive(Debug, Clone, Copy)]
enum Edge {
    Top,
    Bottom,
    Left,
    Right,
}

fn place_rectangles_along_edge(
    count: u32,
    field_width_pct: f32,
    field_height_pct: f32,
    edge: Edge,
) -> Vec<LedField> {
    if count == 0 {
        return Vec::new();
    }

    let fw = field_width_pct / 100.0;
    let fh = field_height_pct / 100.0;

    (0..count)
        .map(|i| {
            let t = (i as f32 + 0.5) / count as f32;
            match edge {
                Edge::Top => LedField {
                    x: t - fw / 2.0,
                    y: 0.0,
                    width: fw,
                    height: fh,
                },
                Edge::Bottom => LedField {
                    x: t - fw / 2.0,
                    y: 1.0 - fh,
                    width: fw,
                    height: fh,
                },
                Edge::Left => LedField {
                    x: 0.0,
                    y: t - fh / 2.0,
                    width: fw,
                    height: fh,
                },
                Edge::Right => LedField {
                    x: 1.0 - fw,
                    y: t - fh / 2.0,
                    width: fw,
                    height: fh,
                },
            }
        })
        .collect()
}

pub fn generate_led_fields(config: &ChaserConfig) -> Vec<LedField> {
    if let Some(fields) = &config.fields {
        if !fields.is_empty() {
            return fields.clone();
        }
    }

    let top = place_rectangles_along_edge(
        config.led_count_top,
        config.field_width,
        config.field_height,
        Edge::Top,
    );
    let bottom = place_rectangles_along_edge(
        config.led_count_bottom,
        config.field_width,
        config.field_height,
        Edge::Bottom,
    );
    let left = place_rectangles_along_edge(
        config.led_count_left,
        config.field_width,
        config.field_height,
        Edge::Left,
    );
    let right = place_rectangles_along_edge(
        config.led_count_right,
        config.field_width,
        config.field_height,
        Edge::Right,
    );

    let mut fields = Vec::new();

    if config.clockwise {
        fields.extend(bottom.into_iter().rev());
        fields.extend(right);
        fields.extend(top);
        fields.extend(left.into_iter().rev());
        fields.reverse();
    } else {
        fields.extend(bottom);
        fields.extend(right.into_iter().rev());
        fields.extend(top.into_iter().rev());
        fields.extend(left);
    }

    let total = fields.len();
    if total == 0 {
        return fields;
    }

    let start = config.start_led as usize % total;
    let mut rotated = fields[start..].to_vec();
    rotated.extend_from_slice(&fields[..start]);
    rotated
}
