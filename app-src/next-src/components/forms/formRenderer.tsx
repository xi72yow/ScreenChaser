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

  const renderers = [
    ...vanillaRenderers,
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
    <FormProvider
      selectedDeviceId={selectedDeviceId}
      selectedConfigId={selectedConfigId}
    >
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
