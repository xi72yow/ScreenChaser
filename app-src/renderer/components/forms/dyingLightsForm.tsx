import React from "react";
import { ColorInput } from "@mantine/core";

interface DyingLightsFormProps {
  form: any;
}

export default function DyingLightsForm({ form }: DyingLightsFormProps) {
  React.useEffect(() => {
    if (form) {
      form.setFieldValue(
        "dyingLights.lightColor",
        form.values.dyingLights?.lightColor || "#9B03FF"
      );
    }
  }, []);
  return (
    <React.Fragment>
      <ColorInput
        placeholder="Pick color"
        label="Light Color"
        defaultValue="#9B03FF"
        onChange={(value) => {
          form.setFieldValue("dyingLights.lightColor", value);
        }}
        value={form.values.dyingLights.lightColor}
      />
    </React.Fragment>
  );
}
