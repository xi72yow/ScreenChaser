import React from "react";
import { ColorInput } from "@mantine/core";
import QuantityInput from "./inputs/number";

interface FrostyPikeFormProps {
  form: any;
}

export default function FrostyPikeForm({ form }: FrostyPikeFormProps) {
  return (
    <React.Fragment>
      <ColorInput
        placeholder="Pick color"
        label="Base Stripe Color"
        defaultValue="#ff0000"
        {...form.getInputProps("frostyPike.BaseStripe", { type: "color" })}
      />
      <QuantityInput
        form={form}
        path="frostyPike.delay"
        label="Delay"
        defaultValue={10}
      ></QuantityInput>
    </React.Fragment>
  );
}
