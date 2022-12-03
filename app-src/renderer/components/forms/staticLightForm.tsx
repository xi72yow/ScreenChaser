import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import StripeInput from "./inputs/stripeInput";

interface FrostyPikeFormProps {
  form: UseFormReturnType<ConfigInterface>;
}

export default function StaticLightForm({ form }: FrostyPikeFormProps) {
  return (
    <React.Fragment>
      <StripeInput
        form={form}
        label="baseStripe"
        path="staticLight.baseStripe"
        defaultValue={[form.values.staticLight?.baseStripe]}
      />
    </React.Fragment>
  );
}
