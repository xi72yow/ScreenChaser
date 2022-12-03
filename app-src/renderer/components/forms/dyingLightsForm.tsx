import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import Color from "./inputs/color";

interface DyingLightsFormProps {
  form: UseFormReturnType<ConfigInterface>;
}

export default function DyingLightsForm({ form }: DyingLightsFormProps) {
  return (
    <React.Fragment>
      <Color
        form={form}
        path={"dyingLights.lightColor"}
        label="Light Color"
        defaultValue={form.values.dyingLights?.lightColor}
      />
    </React.Fragment>
  );
}
