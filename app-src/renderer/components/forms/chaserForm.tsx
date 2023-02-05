import styled from "@emotion/styled";
import {
  Box,
  Button,
  Grid,
  Group,
  Image as MantineImage,
  Modal,
  NumberInput,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import Checkbox from "./inputs/checkbox";
import { UseFormReturnType } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconChevronDown } from "@tabler/icons";
import { ipcRenderer } from "electron";
import React from "react";
import { useEffect, useState } from "react";
import { ConfigInterface } from "../database/db";
import CheckboxInput from "./inputs/checkbox";
import SourcePicker from "./inputs/sourcePicker";
import QuantityInput from "./inputs/number";
import CheckBoxGroup from "./inputs/checkBoxGroup";

const PreviewImage = styled(MantineImage)`
  cursor: pointer;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0);
  &:hover {
    border: 2px solid #9b03ff;
    border-radius: 8px;
  }
`;

interface ChaserProps {
  form: UseFormReturnType<ConfigInterface>;
  selectedDevice: number;
}

export default function ChaserForm({ form, selectedDevice }: ChaserProps) {
  return (
    <React.Fragment>
      <SourcePicker
        form={form}
        path="chaser.sourceId"
        label="Source"
        defaultValue={form.values.chaser.sourceId}
      />

      <QuantityInput
        form={form}
        max={999}
        min={0}
        path="chaser.width"
        label="Horizontal Pixels"
        defaultValue={form.values.chaser.width}
      ></QuantityInput>
      <QuantityInput
        form={form}
        max={999}
        min={0}
        path="chaser.height"
        label="Vertical Pixels"
        defaultValue={form.values.chaser.height}
      ></QuantityInput>
      <QuantityInput
        form={form}
        max={9999}
        min={0}
        path="chaser.startLed"
        label="Start-Led"
        defaultValue={form.values.chaser.startLed}
      ></QuantityInput>
      <CheckBoxGroup label="Setup">
        <Checkbox
          label="Top"
          form={form}
          path="chaser.setUp.rowT"
          mode="number"
        />
        <Checkbox
          label="Right"
          form={form}
          path="chaser.setUp.colR"
          mode="number"
        />
        <Checkbox
          label="Bottom"
          form={form}
          path="chaser.setUp.rowB"
          mode="number"
        />
        <Checkbox
          label="Left"
          form={form}
          path="chaser.setUp.colL"
          mode="number"
        />
        <Checkbox label="Clockwise" form={form} path="chaser.clockWise" />
      </CheckBoxGroup>
    </React.Fragment>
  );
}
