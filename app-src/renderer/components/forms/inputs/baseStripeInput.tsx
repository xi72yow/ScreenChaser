import { AppShell, Button, ColorPicker, Group, Modal } from "@mantine/core";
import { IconColorPicker, IconPalette, IconTrash } from "@tabler/icons";
import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { DropzoneButton } from "./dropzone";
import BaseStripeCreatorToolbar from "./baseStripe/baseStripeCreatorToolbar";
import { useHotkeys } from "@mantine/hooks";

interface BaseStripeInputProps {
  form: any;
  path: string;
  defaultValue: any;
}

function LED(props) {
  const mesh = useRef();
  const [color, setColor] = useState(props.defaultColor);

  useEffect(() => {
    props.setBaseStripe((prev) => {
      prev[props.index] = color;
      return prev;
    });
  }, [color]);

  useEffect(() => {
    setColor(props.baseStripe[props.index]);
  }, [props.changeColor]);

  const [hovered, setHover] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  //useFrame((state, delta) => (mesh.current.rotation.x += 0.01));
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={mesh}
      position={props.position}
      scale={hovered ? 1.2 : 1}
      onClick={
        (e) => {
          setColor(props.color);
        } /* props.color */
      }
      onPointerOver={(e) => {
        if (e.ctrlKey) {
          setColor(props.color);
        }
        setHover(true);
      }}
      onPointerOut={(event) => setHover(false)}
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color={hovered ? props.color : color} />
    </mesh>
  );
}

//test hexcolor string
function isHexColor(str) {
  return str.match(/^#[0-9A-F]{6}$/i) !== null;
}

export default function BaseStripeInput({
  form,
  path,
  defaultValue,
}: BaseStripeInputProps) {
  if (isHexColor(defaultValue[0][0])) console.log("multiframes");
  const [baseStripe, setBaseStripe] = React.useState(defaultValue);

  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#9B03FF");
  const [changeColorEvent, setChangeColorEvent] = useState(false);

  const [swatches, setSwatches] = useState(form.values.globals.swatches);

  useEffect(() => {
    form.setFieldValue("globals.swatches", swatches);
  }, [swatches]);

  const [cameraPosX, setCameraPosX] = useState(0);
  const [cameraPosZ, setCameraPosZ] = useState(5);

  useHotkeys([
    ["A", () => setCameraPosX(cameraPosX + 1)],
    ["D", () => setCameraPosX(cameraPosX - 1)],
    ["Q", () => cameraPosZ > 4 && setCameraPosZ(cameraPosZ - 1)],
    ["E", () => cameraPosZ < 30 && setCameraPosZ(cameraPosZ + 1)],
  ]);

  function handleClose() {
    setOpen(false);
    form.setFieldValue(path, baseStripe);
  }

  return (
    <React.Fragment>
      <Modal
        centered
        size={"xl"}
        opened={open}
        onClose={() => handleClose()}
        title="BaseStripe Creator"
      >
        <Canvas
          style={{
            margin: "auto",
            border: "1px solid lightgrey",
            borderRadius: "1rem",
            height: 80,
          }}
          onScroll={(e) => {
            console.log(e);
          }}
        >
          {/* @ts-ignore */}
          <PerspectiveCamera
            makeDefault
            position={[cameraPosX, 0, cameraPosZ]}
          />
          <ambientLight intensity={0.5} color={"#ffffff"} />
          <directionalLight color="red" position={[0, 0, 5]} />
          {defaultValue.map((defaultColor, i) => (
            <LED
              key={i}
              index={i}
              changeColor={changeColorEvent}
              position={[i * 1.2, 0, 0]}
              color={color}
              defaultColor={defaultColor}
              baseStripe={baseStripe}
              setBaseStripe={setBaseStripe}
            />
          ))}
        </Canvas>
        <BaseStripeCreatorToolbar
          path={path}
          form={form}
          baseStripe={baseStripe}
          swatches={swatches}
          setSwatches={setSwatches}
          color={color}
          setColor={setColor}
          setChangeColorEvent={setChangeColorEvent}
          setBaseStripe={setBaseStripe}
        ></BaseStripeCreatorToolbar>
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
