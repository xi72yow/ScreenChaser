import React from "react";
import BaseStripeInput from "./inputs/baseStripeInput";

interface FrostyPikeFormProps {
  form: any;
}

export default function StaticLightForm({ form }: FrostyPikeFormProps) {
  return (
    <React.Fragment>
      <BaseStripeInput
        form={form}
        path="staticLight.baseStripe"
        defaultValue={form.values.staticLight?.baseStripe}
      />
    </React.Fragment>
  );
}
