import React from "react";
import { Button, ColorInput } from "@mantine/core";
import QuantityInput from "./inputs/number";
import Checkbox from "./inputs/checkbox";
import Select from "./inputs/select";
import BaseStripeInput from "./inputs/baseStripeInput";

interface BouncingBallsProps {
  form: any;
}

export default function BouncingBallsForm({ form }: BouncingBallsProps) {
  return (
    <React.Fragment>
      <Select
        data={["random", "fixed"]}
        label="Ball Mode"
        form={form}
        path="bouncingBalls.ballMode"
        defaultValue={form.values.bouncingBalls?.ballMode || "random"}
      />
      <Checkbox
        label="Mirrored?"
        form={form}
        path="bouncingBalls.mirrored"
        defaultValue={form.values.bouncingBalls?.mirrored || false}
      />
      <QuantityInput
        form={form}
        path="bouncingBalls.tail"
        label="Tail"
        defaultValue={form.values.bouncingBalls?.tail || 10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="bouncingBalls.ballCount"
        label="Ball Count"
        defaultValue={form.values.bouncingBalls?.ballCount || 3}
      ></QuantityInput>
      {/*     <ColorInput
        placeholder="Pick color"
        label="BaseStripe Color"
        defaultValue="#ff0000"
        {...form.getInputProps("bouncingBalls.BaseStripe", { type: "color" })}
      /> */}
      <BaseStripeInput
        form={form}
        path="bouncingBalls.baseStripe"
        defaultValue={form.values.bouncingBalls?.baseStripe}
      />
    </React.Fragment>
  );
}
