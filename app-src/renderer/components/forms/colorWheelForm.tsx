import React from "react";
import QuantityInput from "./inputs/number";

interface ColorWheelProps {
  form: any;
}

export default function ColorWheelForm({ form }: ColorWheelProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="colorWheel.speed"
        label="Speed"
        defaultValue={10}
      ></QuantityInput>
    </React.Fragment>
  );
}
