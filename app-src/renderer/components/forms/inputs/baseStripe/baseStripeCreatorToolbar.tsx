import { ActionIcon, Box, ColorPicker, Group, Navbar } from "@mantine/core";
import {
  IconColorPicker,
  IconPlayerPlay,
  IconSquareMinus,
  IconSquarePlus,
  IconTrash,
} from "@tabler/icons";
import React, { useState } from "react";

type Props = {};

export default function BaseStripeCreatorToolbar({}: Props) {
  const [color, setColor] = useState("#9B03FF");

  const [swatches, setSwatches] = useState([
    "#25262b",
    "#868e96",
    "#fa5252",
    "#e64980",
    "#be4bdb",
    "#7950f2",
    "#4c6ef5",
    "#228be6",
    "#15aabf",
    "#12b886",
    "#40c057",
    "#82c91e",
    "#fab005",
    "#fd7e14",
  ]);
  return (
    <Box
      sx={{
        display: "flex",
        paddingTop: "1rem",

        gap: "1rem",
        height: 210,
        justifyContent: "start",
      }}
    >
      <Box>
        <ColorPicker
          format="hex"
          value={color}
          onChange={(value) => setColor(value)}
          swatches={swatches}
        />
      </Box>
      <Box
        sx={{
          gap: "1rem",
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          justifyContent: "start",
        }}
      >
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconColorPicker />
        </ActionIcon>
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconTrash />
        </ActionIcon>
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconSquarePlus />
        </ActionIcon>
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconSquareMinus />
        </ActionIcon>
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconPlayerPlay />
        </ActionIcon>
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconPlayerPlay />
        </ActionIcon>
        <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
          <IconPlayerPlay />
        </ActionIcon>
      </Box>
    </Box>
  );
}
