import React, { useState } from "react";
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
  ],
};
const initialData = {
  fadeValue: 15,
  meteorColor: "#9B03FF",
  rainbow: false,
  colors: ["#9B03FF", "#9B03FF", "#9B03FF", "#9B03FF", "#9B03FF"],
  ballMode: "foo",
  device: "food3l1m173r",
};

type Props = {
  selectedDeviceId: number;
  selectedTaskId: number;
};

export default function FormRenderer({
  selectedDeviceId,
  selectedTaskId,
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

  const currentTaskCode = useLiveQuery(
    async () => {
      return (await db.tasks.get(selectedTaskId)).taskCode;
    },
    [selectedTaskId],
    null
  );

  const [data, setData] = useState(initialData);
  console.log("🚀 ~ file: formRenderer.tsx:100 ~ data:", data);

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
  ];

  return (
    <>
      <Autocomplete data={configs}></Autocomplete>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        renderers={renderers}
        cells={vanillaCells}
        onChange={({ data }) => setData(data)}
      />
      {(() => {
        switch (currentTaskCode) {
          /*           case "meteorRain":
            return (
              <MeteorRainForm
                form={form}
                key={selectedDeviceId + "meteorRain"}
              ></MeteorRainForm>
            );
          case "bouncingBalls":
            return (
              <BouncingBallsForm
                form={form}
                key={selectedDeviceId + "bouncingBalls"}
              ></BouncingBallsForm>
            );
          case "fireFlame":
            return (
              <FireFlameForm
                form={form}
                key={selectedDeviceId + "fireFlame"}
              ></FireFlameForm>
            );
          case "colorWheel":
            return (
              <ColorWheelForm
                form={form}
                key={selectedDeviceId + "colorWheel"}
              ></ColorWheelForm>
            );
          case "frostyPike":
            return (
              <FrostyPikeForm
                form={form}
                key={selectedDeviceId + "frostyPike"}
              ></FrostyPikeForm>
            );
          case "dyingLights":
            return (
              <DyingLightsForm
                form={form}
                key={selectedDeviceId + "dyingLights"}
              ></DyingLightsForm>
            );
          case "snake":
            return (
              <SnakeForm
                key={selectedDeviceId + "snake"}
                form={form}
              ></SnakeForm>
            );
                case "chaser":
            return (
              <ChaserForm
                key={selectedDeviceId + "chaser"}
                selectedDevice={selectedDevice}
                form={form}
              ></ChaserForm>
            ); 
          case "bubbles":
            return (
              <BubblesForm
                key={selectedDeviceId + "bubbles"}
                form={form}
              ></BubblesForm>
            );
          case "staticLight":
            return (
              <StaticLightForm
                key={selectedDeviceId + "staticLight"}
                form={form}
              ></StaticLightForm>
            );
          case "animation":
            return (
              <AnimationForm
                key={selectedDeviceId + "staticLight"}
                form={form}
              ></AnimationForm>
            ); */
          default:
            return <div>Not implemented</div>;
        }
      })()}
    </>
  );
}
