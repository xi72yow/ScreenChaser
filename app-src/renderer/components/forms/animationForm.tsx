import React from "react";
import QuantityInput from "./inputs/number";
import StripeInput from "./inputs/stripeInput";

interface AnnimationFormProps {
  form: any;
}

export default function AnnimationForm({ form }: AnnimationFormProps) {
  return (
    <React.Fragment>
      <StripeInput
        form={form}
        label="animation frames"
        path="animation.frames"
        defaultValue={form.values.animation?.frames}
        singleFrame={false}
      />
      <QuantityInput
        form={form}
        path="animation.fps"
        label="fps"
        defaultValue={form.values.animation?.fps || 3}
      ></QuantityInput>
    </React.Fragment>
  );
}
