import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import QuantityInput from "./inputs/number";

interface FireFlameProps {
  form: UseFormReturnType<ConfigInterface>;
}

export default function FireFlameForm({ form }: FireFlameProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="fireFlame.cooling"
        label="Cooling"
        defaultValue={form.values.fireFlame?.cooling || 55}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="fireFlame.sparking"
        label="Sparking"
        defaultValue={form.values.fireFlame?.sparking || 120}
      ></QuantityInput>
    </React.Fragment>
  );
}
