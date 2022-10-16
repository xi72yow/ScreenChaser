import { Button, ColorPicker, Group, Modal } from "@mantine/core";
import { IconColorPicker, IconPalette, IconTrash } from "@tabler/icons";
import React, { useState, useRef, useEffect } from "react";
import BaseStripeCanvas from "./baseStripeCanvas";
import { DropzoneButton } from "./dropzone";

interface BaseStripeInputProps {
  form: any;
  path: string;
}

export default function BaseStripeInput({ form, path }: BaseStripeInputProps) {
  const [open, setOpen] = useState(false);
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
    <React.Fragment>
      <Modal
        fullScreen
        sx={{ opacity: 0.95 }}
        opened={open}
        onClose={() => setOpen(false)}
        title="BaseStripe Creator"
      >
        <BaseStripeCanvas
          color={color}
          path={path}
          form={form}
        ></BaseStripeCanvas>
        <Group sx={{ display: "flex", paddingTop: "0.5rem" }} position="center">
          {/* <DropzoneButton></DropzoneButton> */}
          <ColorPicker
            format="hex"
            value={color}
            onChange={(value) => setColor(value)}
            swatches={swatches}
          />
          <Button
            sx={{ marginTop: "0.5rem" }}
            onClick={() => {
              if (swatches.includes(color)) {
                return;
              }
              setSwatches((swatches) => [...swatches, color]);
            }}
            rightIcon={<IconColorPicker />}
          >
            Save Color
          </Button>
          <Button
            sx={{ marginTop: "0.5rem" }}
            onClick={() => {
              const swatchesCopy = [...swatches];
              if (swatchesCopy.indexOf(color) > -1) {
                swatchesCopy.splice(swatchesCopy.indexOf(color), 1);
                setSwatches(swatchesCopy);
              }
            }}
            rightIcon={<IconTrash />}
          >
            Remove Color
          </Button>
        </Group>
      </Modal>
      <Button
        sx={{ marginTop: "0.5rem" }}
        onClick={() => {
          setOpen(true);
        }}
        rightIcon={<IconPalette />}
      >
        BaseStripe
      </Button>
      <div>BaseStripeInput</div>
    </React.Fragment>
  );
}
