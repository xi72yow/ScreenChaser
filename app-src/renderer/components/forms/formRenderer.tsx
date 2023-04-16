import { useLiveQuery } from "dexie-react-hooks";
import { useContext, useEffect } from "react";
import { db } from "../database/db";

import { JsonForms } from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";

import { FormContext, FormProvider } from "./formContext";
import boolean from "./inputs/boolean";
import booleanTester from "./inputs/booleanTester";
import color from "./inputs/color";
import colorTester from "./inputs/colorTester";
import ConfigPicker from "./inputs/configPicker";
import number from "./inputs/number";
import numberTester from "./inputs/numberTester";
import select from "./inputs/select";
import selectTester from "./inputs/selectTester";
import sourcePicker from "./inputs/sourcePicker";
import sourcePickerTester from "./inputs/sourcePickerTester";
import stripeInput from "./inputs/stripeInput";
import stripeInputTester from "./inputs/stripeInputTester";
import swatches from "./inputs/swatches";
import swatchesTester from "./inputs/swatchesTester";
import { Box } from "@mantine/core";

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
  data: any;
  selectedConfigId: number;
  setSelectedConfigId: (id: number) => void;
};

export default function FormRenderer({
  selectedDeviceId,
  selectedTaskId,
  setData,
  data,
  selectedConfigId,
  setSelectedConfigId,
}: Props) {
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
      <ConfigPicker
        selectedTaskId={selectedTaskId}
        selectedDeviceId={selectedDeviceId}
        selectedConfigId={selectedConfigId}
        setSelectedConfigId={setSelectedConfigId}
        data={data}
        setData={setData}
      ></ConfigPicker>
      <Box
        sx={{
          pointerEvents: selectedConfigId === -1 ? "none" : "auto",
          opacity: selectedConfigId === -1 ? 0.5 : 1,
        }}
      >
        <JsonForms
          key={selectedConfigId + "-JsonForms"}
          schema={currentTask.schema}
          uischema={currentTask.uiSchema}
          data={selectedConfigId === -1 ? currentTask.defaultData : data}
          renderers={renderers}
          cells={vanillaCells}
          onChange={({ data }) => setData(data)}
        />
      </Box>
    </FormProvider>
  );
}
