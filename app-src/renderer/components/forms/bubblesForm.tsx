import {
  Button,
  Text,
  CheckIcon,
  ColorPicker,
  ColorSwatch,
  Grid,
  Group,
  Popover,
  useMantineTheme,
  ActionIcon,
  createStyles,
  Box,
} from "@mantine/core";
import Swatches from "./inputs/swatches";
import { showNotification } from "@mantine/notifications";
import { IconSquareX, IconEdit } from "@tabler/icons";
import React, { useEffect, useState } from "react";
import Color from "./inputs/color";
import QuantityInput from "./inputs/number";

interface BubblesFormProps {
  form: any;
}

const bubbleColors = ["#24D024", "#EA0D0D"];

export default function BubblesForm({ form }: BubblesFormProps) {
  return (
    <React.Fragment>
      <Swatches
        label="colors"
        form={form}
        path="bubbles.colors"
        defaultValue={form.values.bubbles?.colors || bubbleColors}
      ></Swatches>
      <QuantityInput
        form={form}
        path="bubbles.fadeValue"
        label="fadevalue"
        defaultValue={form.values.bubbles?.fadeValue || 10}
      ></QuantityInput>
      <QuantityInput
        form={form}
        path="bubbles.maxParticles"
        label="maxParticles"
        defaultValue={form.values.bubbles?.maxParticles || 10}
      ></QuantityInput>
    </React.Fragment>
  );
}
