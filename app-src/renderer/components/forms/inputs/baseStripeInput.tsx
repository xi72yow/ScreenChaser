import { AppShell, Button, ColorPicker, Group, Modal } from "@mantine/core";
import { IconColorPicker, IconPalette, IconTrash } from "@tabler/icons";
import React, { useState, useRef, useEffect } from "react";
import BaseStripeCanvas from "./baseStripeCanvas";
import { Canvas } from "@react-three/fiber";
import { DropzoneButton } from "./dropzone";
import BaseStripeCreatorToolbar from "./baseStripe/baseStripeCreatorToolbar";

interface BaseStripeInputProps {
  form: any;
  path: string;
  defaultValue: any;
}

export default function BaseStripeInput({
  form,
  path,
  defaultValue,
}: BaseStripeInputProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#9B03FF");

  const [swatches, setSwatches] = useState(
    form.values.globals.swatches || [
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
    ]
  );

  useEffect(() => {
    form.setFieldValue("globals.swatches", swatches);
  }, [swatches]);

  return (
    <React.Fragment>
      <Modal
        fullScreen
        sx={{ opacity: 0.95 }}
        opened={open}
        onClose={() => setOpen(false)}
        title="BaseStripe Creator"
      >
        <Canvas
          style={{ border: "1px solid red", width: "100%", height: "12vh" }}
        >
          <ambientLight intensity={0.1} />
          <directionalLight color="red" position={[0, 0, 5]} />
          <mesh>
            <boxGeometry />
            <meshStandardMaterial />
          </mesh>
        </Canvas>
        <BaseStripeCreatorToolbar></BaseStripeCreatorToolbar>

        {/* <BaseStripeCanvas
          color={color}
          path={path}
          form={form}
          defaultValue={defaultValue}
        ></BaseStripeCanvas>
        <Group sx={{ display: "flex", paddingTop: "0.5rem" }} position="center">
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
        </Group> */}
      </Modal>
      <Button
        fullWidth
        sx={{ marginTop: "1rem" }}
        onClick={() => {
          setOpen(true);
        }}
        rightIcon={<IconPalette />}
      >
        BaseStripe
      </Button>
    </React.Fragment>
  );
}
