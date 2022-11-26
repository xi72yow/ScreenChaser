import React from "react";
import { ColorInput } from "@mantine/core";
import QuantityInput from "./inputs/number";
import StripeInput from "./inputs/stripeInput";

interface FrostyPikeFormProps {
  form: any;
}

export default function FrostyPikeForm({ form }: FrostyPikeFormProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="frostyPike.delay"
        label="Delay"
        defaultValue={form.values.frostyPike?.delay || 10}
      ></QuantityInput>
      <StripeInput
        form={form}
        label="baseStripe"
        path="frostyPike.baseStripe"
        defaultValue={[form.values.frostyPike?.baseStripe]}
      />
    </React.Fragment>
  );
}
