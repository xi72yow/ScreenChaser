import React from "react";
import { ColorInput, NativeSelect } from "@mantine/core";
import QuantityInput from "./inputs/number";
import Checkbox from "./inputs/checkbox";

interface BouncingBallsProps {
  form: any;
}

export default function BouncingBallsForm({ form }: BouncingBallsProps) {
  return (
    <React.Fragment>
      <NativeSelect
        data={["random", "rainbow", "single"]}
        label="Ball Mode"
        {...form.getInputProps("bouncingBalls.ballMode", { type: "select" })}
      />
      <Checkbox label="Mirrored?" form={form} path="bouncingBalls.mirrored" />
      <Checkbox label="Tail?" form={form} path="bouncingBalls.tail" />
      <QuantityInput
        form={form}
        path="bouncingBalls.ballCount"
        label="Ball Count"
        defaultValue={3}
      ></QuantityInput>
      <ColorInput
        placeholder="Pick color"
        label="BaseStripe Color"
        defaultValue="#ff0000"
        {...form.getInputProps("bouncingBalls.BaseStripe", { type: "color" })}
      />
    </React.Fragment>
  );
}
