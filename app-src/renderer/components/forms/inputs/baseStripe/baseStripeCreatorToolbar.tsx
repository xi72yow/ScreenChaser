import {
  ActionIcon,
  Box,
  ColorPicker,
  ColorSwatch,
  Group,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconColorPicker,
  IconPlayerPlay,
  IconRelationOneToMany,
  IconSquareMinus,
  IconSquarePlus,
  IconTrash,
} from "@tabler/icons";
import React, { useState } from "react";

function FrameSwatch({ activeFrame, setActiveFrame, index }) {
  const theme = useMantineTheme();
  return (
    <Group position="center" spacing="xs">
      <ColorSwatch
        component="button"
        color={
          activeFrame === index ? theme.colors.grape[6] : theme.colors.gray[5]
        }
        onClick={() => setActiveFrame(index)}
        sx={{ color: "#fff", cursor: "pointer" }}
      ></ColorSwatch>
    </Group>
  );
}

type Props = {
  path: string;
  form: any;
  color: string;
  baseStripe: any;
  setColor: (color: string) => void;
  swatches: string[];
  setSwatches: any;
  setChangeColorEvent: any;
  setBaseStripe: any;
};

export default function BaseStripeCreatorToolbar({
  path,
  form,
  color,
  setColor,
  baseStripe,
  swatches,
  setSwatches,
  setChangeColorEvent,
  setBaseStripe,
}: Props) {
  return (
    <Box>
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
          <Tooltip label="Save Color">
            <ActionIcon
              size={"xl"}
              variant="outline"
              onClick={() => {
                if (swatches.includes(color)) {
                  return;
                }
                setSwatches((swatches: string[]) => [...swatches, color]);
              }}
            >
              <IconColorPicker />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Remove Color">
            <ActionIcon
              size={"xl"}
              variant="outline"
              onClick={() => {
                const swatchesCopy = [...swatches];
                if (swatchesCopy.indexOf(color) > -1) {
                  swatchesCopy.splice(swatchesCopy.indexOf(color), 1);
                  setSwatches(swatchesCopy);
                }
              }}
            >
              <IconTrash />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Set all to this color">
            <ActionIcon
              size={"xl"}
              variant="outline"
              onClick={() => {
                setBaseStripe((baseStripe: any) => {
                  return baseStripe.map(() => color);
                });
                setChangeColorEvent((a) => !a);
              }}
            >
              <IconRelationOneToMany />
            </ActionIcon>
          </Tooltip>
          {/*         <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
            <IconSquarePlus />
          </ActionIcon>
          <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
            <IconSquareMinus />
          </ActionIcon>
          <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
            <IconPlayerPlay />
          </ActionIcon> */}
        </Box>
      </Box>
      {/*       <Group sx={{ display: "flex", paddingTop: "0.5rem" }} position="center">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
          <FrameSwatch key={index} index={index}></FrameSwatch>
        ))}
      </Group> */}
    </Box>
  );
}
