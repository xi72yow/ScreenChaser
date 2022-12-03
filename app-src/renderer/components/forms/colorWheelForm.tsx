import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import QuantityInput from "./inputs/number";

interface ColorWheelProps {
  form: UseFormReturnType<ConfigInterface>;
}

export default function ColorWheelForm({ form }: ColorWheelProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="colorWheel.speed"
        label="Speed"
        defaultValue={form.values.colorWheel?.speed || 10}
      ></QuantityInput>
    </React.Fragment>
  );
}
