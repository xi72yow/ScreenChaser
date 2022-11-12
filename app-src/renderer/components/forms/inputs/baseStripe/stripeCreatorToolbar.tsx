import {
  ActionIcon,
  Box,
  ColorPicker,
  ColorSwatch,
  Group,
  Pagination,
  ScrollArea,
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
import React from "react";

type Props = {
  path: string;
  form: any;
  color: string;
  setColor: (color: string) => void;
  swatches: string[];
  setSwatches: any;
  setChangeColorEvent: any;
  setFrames: any;
  setActiveFrame: any;
  activeFrame: number;
  frames: any;
  singleFrame: boolean;
};

export default function StripeCreatorToolbar({
  path,
  form,
  color,
  setColor,
  swatches,
  setSwatches,
  setChangeColorEvent,
  setFrames,
  activeFrame,
  setActiveFrame,
  frames,
  singleFrame,
}: Props) {
  function handleAddFrame(neoPixelCount) {
    setFrames((prev) => {
      return [...prev, new Array(neoPixelCount).fill("#000000")];
    });
  }

  function handleRemoveFrame() {
    if (frames.length > 1) {
      setFrames((prev) => {
        return [...prev.slice(0, -1)];
      });
    }
  }
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
                setFrames((frames: any) => {
                  const newFrames = [...frames];
                  newFrames[activeFrame - 1] = frames[activeFrame - 1].map(
                    () => color
                  );
                  return newFrames;
                });
                setChangeColorEvent((a) => !a);
              }}
            >
              <IconRelationOneToMany />
            </ActionIcon>
          </Tooltip>
          {/*       <ActionIcon size={"xl"} variant="outline" onClick={() => {}}>
            <IconPlayerPlay />
          </ActionIcon> */}
        </Box>
      </Box>
      {!singleFrame && (
        <Group position="center" spacing="xs">
          <Tooltip label="Delete last Frame" key={"minus-frame"}>
            <ActionIcon size={"lg"} onClick={() => handleRemoveFrame()}>
              <IconSquareMinus />
            </ActionIcon>
          </Tooltip>
          <Pagination
            page={activeFrame}
            onChange={setActiveFrame}
            total={frames.length}
          />

          <Tooltip label="Add Frame" key={"plus-frame"}>
            <ActionIcon
              size={"lg"}
              onClick={() => handleAddFrame(form.values.device.neoPixelCount)}
            >
              <IconSquarePlus />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Box>
  );
}
