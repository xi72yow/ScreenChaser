import React, { useContext, useEffect, useState } from "react";
import Autocomplete from "./inputs/autocomplete";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../database/db";
import AnimationForm from "./animationForm";
import BouncingBallsForm from "./bouncingBallsForm";
import BubblesForm from "./bubblesForm";
import ChaserForm from "./chaserForm";
import ColorWheelForm from "./colorWheelForm";
import DyingLightsForm from "./dyingLightsForm";
import FireFlameForm from "./fireFlameForm";
import FrostyPikeForm from "./frostyPikeForm";
import MeteorRainForm from "./meteorRainForm";
import SnakeForm from "./snakeForm";
import StaticLightForm from "./staticLightForm";

import { JsonForms } from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";

import numberTester from "./inputs/numberTester";
import number from "./inputs/number";
import colorTester from "./inputs/colorTester";
import color from "./inputs/color";
import booleanTester from "./inputs/booleanTester";
import boolean from "./inputs/boolean";
import swatches from "./inputs/swatches";
import swatchesTester from "./inputs/swatchesTester";
import selectTester from "./inputs/selectTester";
import select from "./inputs/select";
import sourcePickerTester from "./inputs/sourcePickerTester";
import sourcePicker from "./inputs/sourcePicker";
import stripeInputTester from "./inputs/stripeInputTester";
import stripeInput from "./inputs/stripeInput";
import { FormContext, FormProvider } from "./formContext";

const schema = {
  type: "object",
  properties: {
    fadeValue: {
      type: "integer",
      maximum: 255,
      minimum: 0,
    },
    meteorColor: {
      type: "string",
    },
    rainbow: {
      type: "boolean",
    },
    colors: {
      type: "array",
    },
    ballMode: {
      type: "string",
      enum: ["foo", "bar", "foobar"],
    },
    device: {
      type: "string",
    },
    baseStripe: {
      type: "array",
      singleFrame: true,
    },
  },
};
const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "TestLabel",
      scope: "#/properties/fadeValue",
    },
    {
      type: "Control",
      label: "Hallo",
      scope: "#/properties/meteorColor",
      options: { color: true },
    },
    {
      type: "Control",
      label: "Rainbow",
      scope: "#/properties/rainbow",
    },
    {
      type: "Control",
      label: "Colors",
      scope: "#/properties/colors",
      options: { colors: true },
    },
    {
      type: "Control",
      label: "Ball Mode",
      scope: "#/properties/ballMode",
      options: { select: true },
    },
    {
      type: "Control",
      label: "Device",
      scope: "#/properties/device",
      options: { device: true },
    },
    {
      type: "Control",
      label: "Base Stripe",
      scope: "#/properties/baseStripe",
      options: { stripe: true },
    },
  ],
};
const initialData = {
  fadeValue: 15,
  meteorColor: "#9B03FF",
  rainbow: false,
  colors: ["#9B03FF", "#9B03FF", "#9B03FF", "#9B03FF", "#9B03FF"],
  ballMode: "foo",
  device: "food3l1m173r",
  baseStripe: [["#9B03FF", "#9B03FF", "#9B03FF", "#9B03FF", "#9B03FF"]],
};

type Props = {
  selectedDeviceId: number;
  selectedTaskId: number;
  setData: (data: any) => void;
};

export default function FormRenderer({
  selectedDeviceId,
  selectedTaskId,
  setData,
}: Props) {
  const configs = useLiveQuery(
    async () => {
      return await db.configs
        .where("deviceId")
        .equals(selectedDeviceId)
        .and((config) => config.taskId === selectedTaskId)
        .toArray();
    },
    [selectedDeviceId, selectedTaskId],
    []
  );

  const currentTask = useLiveQuery(
    async () => {
      return db.tasks.get(selectedTaskId);
    },
    [selectedTaskId],
    null
  );

  const { setSelectedDeviceIdContext } = useContext(FormContext);

  useEffect(() => {
    setSelectedDeviceIdContext && setSelectedDeviceIdContext(selectedDeviceId);
  }, [selectedDeviceId]);

  // list of renderers declared outside the App component
  const renderers = [
    ...vanillaRenderers,
    //register custom renderers
    { tester: numberTester, renderer: number },
    { tester: colorTester, renderer: color },
    { tester: booleanTester, renderer: boolean },
    { tester: swatchesTester, renderer: swatches },
    { tester: selectTester, renderer: select },
    { tester: sourcePickerTester, renderer: sourcePicker },
    { tester: stripeInputTester, renderer: stripeInput },
  ];

  if (currentTask === null) {
    return <div>loading</div>;
  }

  return (
    <FormProvider>
      <Autocomplete data={configs}></Autocomplete>
      <JsonForms
        schema={currentTask.schema}
        uischema={currentTask.uiSchema}
        data={currentTask.defaultData}
        renderers={renderers}
        cells={vanillaCells}
        onChange={({ data }) => setData(data)}
      />
    </FormProvider>
  );
}
