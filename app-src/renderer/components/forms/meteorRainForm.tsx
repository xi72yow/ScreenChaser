import React from "react";
import { ColorInput } from "@mantine/core";
import Checkbox from "./inputs/checkbox";
import QuantityInput from "./inputs/number";

interface MeteorRainFormProps {
  form: any;
}

export default function MeteorRainForm({ form }: MeteorRainFormProps) {
  React.useEffect(() => {
    if (form) {
      form.setFieldValue(
        "meteorRain.meteorColor",
        form.values.meteorRain?.meteorColor || "#9B03FF"
      );
    }
  }, []);
  return (
    <React.Fragment>
      <ColorInput
        placeholder="Pick color"
        label="Meteor Color"
        onChange={(value) => {
          form.setFieldValue("meteorRain.meteorColor", value);
        }}
        value={form.values.meteorRain.meteorColor}
      />
      <QuantityInput
        form={form}
        path="meteorRain.meteorSize"
        label="Meteor Size"
        defaultValue={10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="meteorRain.meteorTrailDecay"
        label="Meteor Trail Decay"
        defaultValue={64}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="meteorRain.meteorRandomDecay"
        label="Meteor Random Decay"
        defaultValue={3}
      ></QuantityInput>
      <Checkbox label="Rainbow Meteor?" form={form} path="meteorRain.rainbow" />
    </React.Fragment>
  );
}
