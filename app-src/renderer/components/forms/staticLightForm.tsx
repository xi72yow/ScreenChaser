import React from "react";
import StripeInput from "./inputs/stripeInput";

interface FrostyPikeFormProps {
  form: any;
}

export default function StaticLightForm({ form }: FrostyPikeFormProps) {
  return (
    <React.Fragment>
      <StripeInput
        form={form}
        path="staticLight.baseStripe"
        defaultValue={form.values.staticLight?.baseStripe}
      />
    </React.Fragment>
  );
}
