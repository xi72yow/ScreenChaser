import React from "react";
import { ColorInput } from "@mantine/core";
import QuantityInput from "./inputs/number";
import BaseStripeInput from "./inputs/baseStripeInput";

interface FrostyPikeFormProps {
  form: any;
}

export default function FrostyPikeForm({ form }: FrostyPikeFormProps) {
  return (
    <React.Fragment>
      <BaseStripeInput
        form={form}
        path="frostyPike.baseStripe"
        defaultValue={form.values.frostyPike?.baseStripe}
      />
      <QuantityInput
        form={form}
        path="frostyPike.delay"
        label="Delay"
        defaultValue={form.values.frostyPike?.delay || 10}
      ></QuantityInput>
    </React.Fragment>
  );
}
