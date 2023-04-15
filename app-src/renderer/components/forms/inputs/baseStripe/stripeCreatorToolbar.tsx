import {
  ActionIcon,
  Box,
  ColorPicker,
  Group,
  Pagination,
  Tooltip,
} from "@mantine/core";
import {
  IconColorPicker,
  IconCopy,
  IconRelationOneToMany,
  IconSquareMinus,
  IconSquarePlus,
  IconTrash,
} from "@tabler/icons";
import React from "react";
import { useConfirm } from "../../../hooks/confirm";

type Props = {
  color: string;
  setColor: (color: string) => void;
  swatches: Array<string>;
  setSwatches: React.Dispatch<React.SetStateAction<Array<string>>>;
  setChangeColorEvent: React.Dispatch<React.SetStateAction<boolean>>;
  setFrames: React.Dispatch<React.SetStateAction<Array<Array<string>>>>;
  setActiveFrame: React.Dispatch<React.SetStateAction<number>>;
  activeFrame: number;
  frames: Array<Array<string>>;
  singleFrame?: boolean;
};

const insert = (index, arr, newItem) => [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

export default function StripeCreatorToolbar({
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
      return insert(
        activeFrame,
        prev,
        new Array(neoPixelCount).fill("#000000")
      );
    });
    setActiveFrame((prev) => prev + 1);
  }

  function handleDupFrame(neoPixelCount) {
    setFrames((prev) => {
      return insert(activeFrame, prev, [...prev[activeFrame - 1]]);
    });
    setActiveFrame((prev) => prev + 1);
  }

  function handleRemoveFrame() {
    if (frames.length > 1) {
      setFrames((prev) => {
        const newFrames = [...prev];
        newFrames.splice(activeFrame - 1, 1);

        return [...newFrames];
      });
      setActiveFrame((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          return prev;
        }
      });
    }
  }

  const confirm = useConfirm();

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
        <ColorPicker
          fullWidth
          format="hex"
          value={color}
          onChange={(value) => setColor(value)}
          swatches={swatches}
          swatchesPerRow={25}
        />
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
          <Tooltip label="Delete current Frame" key={"minus-frame"}>
            <ActionIcon
              size={"lg"}
              onClick={() => {
                confirm
                  .showConfirmation(
                    "Are you sure you want to delete the current Frame?",
                    true
                  )
                  .then((res) => {
                    handleRemoveFrame();
                  });
              }}
            >
              <IconSquareMinus />
            </ActionIcon>
          </Tooltip>
          <Pagination
            page={activeFrame}
            onChange={setActiveFrame}
            total={frames.length}
          />

          <Tooltip label="Add next Frame" key={"plus-frame"}>
            <ActionIcon
              size={"lg"}
              onClick={() => handleAddFrame(frames[0].length)}
            >
              <IconSquarePlus />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Duplicate Frame as Next" key={"dup-frame"}>
            <ActionIcon
              size={"lg"}
              onClick={() => handleDupFrame(frames[0].length)}
            >
              <IconCopy />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Box>
  );
}
