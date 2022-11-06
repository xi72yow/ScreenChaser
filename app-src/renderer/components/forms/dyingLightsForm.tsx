import React from "react";
import Color from "./inputs/color";

interface DyingLightsFormProps {
  form: any;
}

export default function DyingLightsForm({ form }: DyingLightsFormProps) {
  return (
    <React.Fragment>
      <Color
        form={form}
        path={"dyingLights.lightColor"}
        label="Light Color"
        defaultValue={form.values.dyingLights?.lightColor}
      />
    </React.Fragment>
  );
}
