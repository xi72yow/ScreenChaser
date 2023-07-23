import { ActionIcon, Group, Modal } from "@mantine/core";
import { useHotkeys, useLocalStorage } from "@mantine/hooks";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { IconPalette } from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import { reScale } from "screenchaser-core/dist/helpers";
import StripeCreatorToolbar from "./stripeCreatorToolbar";
import { useConfirm } from "../../../hooks/confirm";
import { showNotification } from "@mantine/notifications";

interface BaseStripeInputProps {
  path: string;
  data: Array<Array<string>>;
  singleFrame?: boolean;
  handleChange: (path, data: Array<Array<string>>) => void;
  currentNeoPixelCount: number;
  selectedConfigId: number;
}

function LED(props) {
  const mesh = useRef();
  const [color, setColor] = useState(props.defaultColor);

  useEffect(() => {
    props.setFrames((prev) => {
      prev[props.activeFrame - 1][props.index] = color;
      return prev;
    });
  }, [color]);

  useEffect(() => {
    setColor(props.frames[props.activeFrame - 1][props.index]);
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

export function prepareStripe(defaultValue, neoPixelCount) {
  let preparedStripe = [...defaultValue];
  const reScaledStripe = reScale(preparedStripe, neoPixelCount, false);
  if (reScaledStripe.length > 0)
    return reScale(preparedStripe, neoPixelCount, false);
  else return preparedStripe;
}

export default function StripeCreator({
  path,
  data,
  handleChange,
  singleFrame,
  currentNeoPixelCount,
  selectedConfigId,
}: BaseStripeInputProps) {
  const [activeFrame, setActiveFrame] = useState(1);
  const [frames, setFrames] = useState(data);

  const confirm = useConfirm();

  useEffect(() => {
    if (selectedConfigId > -1) {
      setFrames((prev) => {
        let frames = prev;
        if (data) frames = data;
        return frames;
      });
      setChangeColorEvent((prev) => !prev);
    }
  }, [data, currentNeoPixelCount]);

  useEffect(() => {
    setChangeColorEvent((prev) => !prev);
  }, [activeFrame]);

  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#9B03FF");
  const [changeColorEvent, setChangeColorEvent] = useState(false);

  const swatchesKey = "usr-swatches";

  const [swatches, setSwatches] = useLocalStorage({
    key: swatchesKey,
    defaultValue: ["#9B03FF", "#FF0000", "#00FF00", "#0000FF"],
  });

  const cameraPosKeyX = "cameraPosX" + path;
  const cameraPosKeyZ = "cameraPosZ" + path;

  const [cameraPosX, setCameraPosX] = useLocalStorage({
    key: cameraPosKeyX,
    defaultValue: 0,
  });

  const [cameraPosZ, setCameraPosZ] = useLocalStorage({
    key: cameraPosKeyZ,
    defaultValue: 5,
  });

  useHotkeys([
    ["A", () => setCameraPosX(cameraPosX + 1)],
    ["D", () => setCameraPosX(cameraPosX - 1)],
    ["W", () => cameraPosZ > 4 && setCameraPosZ(cameraPosZ - 1)],
    ["S", () => cameraPosZ < 30 && setCameraPosZ(cameraPosZ + 1)],
    ["Q", () => activeFrame > 1 && setActiveFrame(activeFrame - 1)],
    ["E", () => activeFrame < frames.length && setActiveFrame(activeFrame + 1)],
    /*  ["ctrl+S", () => handleSave()], */
  ]);

  function handleClose() {
    setOpen(false);
  }

  function handleSave() {
    handleChange(path, frames);
  }

  return (
    <React.Fragment>
      <Modal
        centered
        size={"xl"}
        opened={open}
        onClose={() => {
          handleSave();
          handleClose();
        }}
        title="Stripe Creator"
      >
        <Group
          position="center"
          sx={{
            border: "1px solid lightgrey",
            borderRadius: "1rem",
            height: 80,
          }}
        >
          <Canvas frameloop="demand">
            {/* @ts-ignore */}
            <PerspectiveCamera
              makeDefault
              position={[cameraPosX, 0, cameraPosZ]}
            />
            <ambientLight intensity={0.5} color={"#ffffff"} />
            <directionalLight color="red" position={[0, 0, 5]} />
            {frames[activeFrame - 1].map((defaultColor, i) => (
              <LED
                key={i + "led"}
                index={i}
                changeColor={changeColorEvent}
                position={[i * 1.2, 0, 0]}
                color={color}
                defaultColor={defaultColor}
                activeFrame={activeFrame}
                frames={frames}
                setFrames={setFrames}
              />
            ))}
          </Canvas>
        </Group>
        <StripeCreatorToolbar
          singleFrame={singleFrame}
          swatches={swatches}
          setSwatches={setSwatches}
          color={color}
          setColor={setColor}
          setChangeColorEvent={setChangeColorEvent}
          setActiveFrame={setActiveFrame}
          activeFrame={activeFrame}
          frames={frames}
          setFrames={setFrames}
        ></StripeCreatorToolbar>
      </Modal>
      <ActionIcon
        onClick={() => {
          if (data[0].length !== currentNeoPixelCount && currentNeoPixelCount)
            confirm
              .showConfirmation(
                `The current Device has ${currentNeoPixelCount} NeoPixels. The Animation is for ${
                  data[0].length
                } Pixels. Do you want to rescale the current Frame${
                  data.length > 1 ? "s" : ""
                } the Device? This Action can results in a loss of data.`,
                true
              )
              .then((ans) => {
                if (ans) {
                  setFrames((prev) =>
                    prev.map((frame, index) => {
                      return prepareStripe(frame, currentNeoPixelCount);
                    })
                  );
                  showNotification({
                    title: "Rescaling successful",
                    message: `The current Frame${
                      data.length > 1 ? "s" : ""
                    } have been rescaled to ${currentNeoPixelCount} NeoPixels.`,
                    color: "green",
                  });
                }
                setOpen(true);
              });
          else setOpen(true);
        }}
      >
        <IconPalette size={18} stroke={1.5} />
      </ActionIcon>
    </React.Fragment>
  );
}
