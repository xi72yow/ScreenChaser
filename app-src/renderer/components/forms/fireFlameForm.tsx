import React from "react";
import QuantityInput from "./inputs/number";

interface FireFlameProps {
  form: any;
}

export default function FireFlameForm({ form }: FireFlameProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="fireFlame.cooling"
        label="Cooling"
        defaultValue={55}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="fireFlame.sparking"
        label="Sparking"
        defaultValue={120}
      ></QuantityInput>
    </React.Fragment>
  );
}
