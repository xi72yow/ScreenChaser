import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import QuantityInput from "./inputs/number";
import Swatches from "./inputs/swatches";

interface BubblesFormProps {
  form: UseFormReturnType<ConfigInterface>;
}

const bubbleColors = ["#24D024", "#EA0D0D"];

export default function BubblesForm({ form }: BubblesFormProps) {
  return (
    <React.Fragment>
      <Swatches
        label="colors"
        form={form}
        path="bubbles.colors"
        defaultValue={form.values.bubbles?.colors || bubbleColors}
      ></Swatches>
      <QuantityInput
        form={form}
        path="bubbles.fadeValue"
        label="fadevalue"
        defaultValue={form.values.bubbles?.fadeValue || 10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="bubbles.maxParticles"
        label="maxParticles"
        defaultValue={form.values.bubbles?.maxParticles || 10}
      ></QuantityInput>
    </React.Fragment>
  );
}
