import React from "react";
import { ColorInput } from "@mantine/core";
import Checkbox from "./inputs/checkbox";
import QuantityInput from "./inputs/number";
import useStyles from "../styles/styles";
import Color from "./inputs/color";

interface MeteorRainFormProps {
  form: any;
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
