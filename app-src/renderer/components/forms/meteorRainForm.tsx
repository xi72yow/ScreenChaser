import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { ConfigInterface } from "../database/db";
import Checkbox from "./inputs/checkbox";
import Color from "./inputs/color";
import QuantityInput from "./inputs/number";

interface MeteorRainFormProps {
  form: UseFormReturnType<ConfigInterface>;
}

export default function MeteorRainForm({ form }: MeteorRainFormProps) {
  return (
    <React.Fragment>
      <Color
        form={form}
        path={"meteorRain.meteorColor"}
        label={"Meteor Color"}
        defaultValue={form.values.meteorRain?.meteorColor}
      />
      <QuantityInput
        form={form}
        path="meteorRain.meteorSize"
        label="Meteor Size"
        defaultValue={form.values.meteorRain?.meteorSize || 10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="meteorRain.meteorTrailDecay"
        label="Meteor Trail Decay"
        defaultValue={form.values.meteorRain?.meteorTrailDecay || 64}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="meteorRain.meteorRandomDecay"
        label="Meteor Random Decay"
        defaultValue={form.values.meteorRain?.meteorRandomDecay || 7}
      ></QuantityInput>
      <Checkbox label="Rainbow Meteor?" form={form} path="meteorRain.rainbow" />
    </React.Fragment>
  );
}
