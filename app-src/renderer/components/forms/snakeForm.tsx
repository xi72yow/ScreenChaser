import React from "react";
import QuantityInput from "./inputs/number";

interface SnakeFormProps {
  form: any;
}

export default function SnakeForm({ form }: SnakeFormProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="snake.speed"
        label="Speed"
        defaultValue={10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="snake.maxSnakeSize"
        label="Max Snake Size"
        defaultValue={10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="snake.appleCount"
        label="Apple Count"
        defaultValue={3}
      ></QuantityInput>
    </React.Fragment>
  );
}
