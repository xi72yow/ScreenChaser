import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import QuantityInput from "./inputs/number";

interface SnakeFormProps {
  form: UseFormReturnType<ConfigInterface>;
}

export default function SnakeForm({ form }: SnakeFormProps) {
  return (
    <React.Fragment>
      <QuantityInput
        form={form}
        path="snake.speed"
        label="Speed"
        defaultValue={form.values.snake?.speed || 10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="snake.maxSnakeSize"
        label="Max Snake Size"
        defaultValue={form.values.snake?.maxSnakeSize || 10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="snake.appleCount"
        label="Apple Count"
        defaultValue={form.values.snake?.appleCount || 3}
      ></QuantityInput>
    </React.Fragment>
  );
}
