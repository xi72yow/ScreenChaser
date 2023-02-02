import styled from "@emotion/styled";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  Group,
  Image as MantineImage,
  Modal,
  NumberInput,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconChevronDown } from "@tabler/icons";
import { ipcRenderer } from "electron";
import React from "react";
import { useEffect, useState } from "react";
import { ConfigInterface } from "../database/db";

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

export default function Chaser({ form, selectedDevice }: ChaserProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const theme = useMantineTheme();
  const [selected, setSelected] = useState({
    id: form.values.chaser.sourceId || "",
    name: form.values.chaser.name || "",
  });
  const [sources, setSources] = useState([]);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    form.setFieldValue("chaser.sourceId", selected?.id || "");
    form.setFieldValue("chaser.name", selected?.name || "");
    //ipcRenderer.send("CHASER:", selected);
  }, [selected]);

  function renderConfig() {
    ipcRenderer
      .invoke("GET_SOURCES", {
        height: 768,
        width: 1366,
      })
      .then(async (sources) => {
        for (let s in sources) {
          if (sources[s].id === selected.id) {
            const horizontalPixels = form.values.chaser.width;
            const verticalPixels = form.values.chaser.height;
            const { rowB, colR, rowT, colL } = form.values.chaser.setUp;
            const canvasCTX = canvasRef.current.getContext("2d");
            const dataURL = sources[s].thumbnail.toDataURL();
            const img = new Image();
            img.src = dataURL;
            img.onload = function () {
              canvasCTX.drawImage(img, 0, 0, 1366, 768);
              canvasCTX.fillStyle = "rgba(0, 0, 0, 0.5)";
              canvasCTX.fillRect(0, 0, 1366, 768);
              canvasCTX.font = "13px Arial";
              const space = 0.1;
              const canvasWidth = 1366;
              const canvasHeight = 768;
              const neoPixelCount = form.values.device.neoPixelCount;
              const startLed = form.values.chaser.startLed;

              const pixH = canvasWidth / (horizontalPixels * (space + 1));
              const pixV =
                (canvasHeight - 2 * pixH) / (verticalPixels * (space + 1));

              const pix = Math.min(pixH, pixV);
              let renderedLeds = 0;

              for (let i = 0; i < neoPixelCount; i++) {
                if (renderedLeds === startLed) {
                  canvasCTX.fillStyle = "rgba(255, 0, 0, 0.5)";
                } else {
                  canvasCTX.fillStyle = "rgba(255, 255, 255, 0.5)";
                }
                if (
                  rowB > -1 &&
                  i >= 0 &&
                  i < horizontalPixels &&
                  horizontalPixels > 0
                ) {
                  canvasCTX.fillRect(
                    i * pix * (1 + space),
                    canvasHeight - pix * (1 + space),
                    pix,
                    pix
                  );
                  renderedLeds++;
                }

                if (
                  colR > -1 &&
                  i >= horizontalPixels &&
                  i < horizontalPixels + verticalPixels &&
                  verticalPixels > 0
                ) {
                  let sideIndex = i - horizontalPixels;
                  canvasCTX.fillRect(
                    canvasWidth - pix * (1 + space),
                    canvasHeight - (sideIndex + 2) * pix * (1 + space),
                    pix,
                    pix
                  );
                  renderedLeds++;
                }

                if (
                  rowT > -1 &&
                  i >= horizontalPixels + verticalPixels &&
                  i < 2 * horizontalPixels + verticalPixels &&
                  horizontalPixels > 0
                ) {
                  let sideIndex = i - horizontalPixels - verticalPixels;
                  canvasCTX.fillRect(
                    canvasWidth - (sideIndex + 1) * pix * (1 + space),
                    0,
                    pix,
                    pix
                  );
                  renderedLeds++;
                }

                if (
                  colL > -1 &&
                  i >= 2 * horizontalPixels + verticalPixels &&
                  i < 2 * horizontalPixels + 2 * verticalPixels &&
                  verticalPixels > 0
                ) {
                  let sideIndex = i - 2 * horizontalPixels - verticalPixels;
                  canvasCTX.fillRect(
                    0,
                    (sideIndex + 1) * pix * (1 + space),
                    pix,
                    pix
                  );
                  renderedLeds++;
                }
              }
            };
          }
        }
      });
  }

  useEffect(() => {
    renderConfig();
  }, [form.values]);

  function handleError(e) {
    showNotification({
      title: "Chaser Error",
      message: e,
      color: "red",
    });
  }

  const arrayInHalf = (array) => [
    array.slice(0, Math.ceil(array.length / 2)),
    array.slice(Math.ceil(array.length / 2)),
  ];

  const items = arrayInHalf(sources).map((half) =>
    half.map((item) => {
      return (
        <Group
          key={item.id}
          onClick={() => {
            setSelected(item);
            setOpened(false);
          }}
          style={{ paddingTop: 5 }}
        >
          <Box
            sx={{
              maxWidth: "97%",
              marginLeft: 5,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                scale: "1.02",
              },
            }}
          >
            <PreviewImage
              radius="md"
              src={item.thumbnail?.toDataURL()}
              alt={item.name + "_thumbnail"}
            />
            <Text
              size="xs"
              sx={{
                textOverflow: "ellipsis",
                width: 150,
                display: "inline-block",
                overflow: "hidden",
                whiteSpace: "nowrap",
                marginTop: 0,
              }}
              transform="uppercase"
              weight={700}
              color="dimmed"
            >
              {item.name || "No name"}
            </Text>
          </Box>
        </Group>
      );
    })
  );

  return (
    <>
      <Modal
        centered
        opened={opened}
        onClose={() => setOpened(false)}
        title="Choose Video Source"
      >
        <ScrollArea style={{ height: 300 }}>
          <Grid gutter="lg" sx={{ marginRight: ".7rem" }}>
            <Grid.Col span={6}>{items[0]}</Grid.Col>
            <Grid.Col span={6}>{items[1]}</Grid.Col>
          </Grid>
        </ScrollArea>
      </Modal>
      <canvas
        onClick={() => {
          renderConfig();
        }}
        ref={canvasRef}
        width={1366}
        height={768}
        style={{ width: "100%", backgroundColor: "Highlight" }}
      ></canvas>
      <Button
        fullWidth
        leftIcon={<IconChevronDown size={18} stroke={1.5} />}
        onClick={() => {
          ipcRenderer.invoke("GET_SOURCES").then(async (sources) => {
            console.log("result", sources);
            const sourcesScreen = sources.filter((source, index, array) => {
              return source.id.includes("screen");
            });
            const canvas = document.querySelector("#canvas-desktop-thumbnail");
            //@ts-ignore
            canvas.width = 0;
            //@ts-ignore
            canvas.height = 225;
            sourcesScreen.forEach(async (source) => {
              const thumbnailSize = source.thumbnail.getSize();
              //@ts-ignore
              const lastWidth = canvas.width;

              //@ts-ignore
              canvas.width = canvas.width + thumbnailSize.width;

              async function setImage(thumbnail: any) {
                return new Promise(async (resolve, reject) => {
                  const image = new Image();
                  image.onload = () => {
                    resolve(image);
                  };
                  image.src = await thumbnail.toDataURL();
                });
              }
              canvas
                //@ts-ignore
                .getContext("2d")
                .drawImage(await setImage(source.thumbnail), lastWidth, 0);

              setSources([
                {
                  id: "",
                  name: "Whole Desktop",
                  thumbnail: canvas,
                },
                ...sources,
              ]);
              setOpened(true);
            });
          });
        }}
      >
        {selected?.name || "Choose Video Source"}
      </Button>
      <Group sx={{ paddingTop: 5 }}>
        <Checkbox
          label="Top"
          onChange={(e) => {
            form.setFieldValue("chaser.setUp.rowT", e.target.checked ? 0 : -1);
          }}
        />
        <Checkbox
          label="Right"
          onChange={(e) => {
            form.setFieldValue("chaser.setUp.colR", e.target.checked ? 0 : -1);
          }}
        />
        <Checkbox
          label="Bottom"
          onChange={(e) => {
            form.setFieldValue("chaser.setUp.rowB", e.target.checked ? 0 : -1);
          }}
        />
        <Checkbox
          label="Left"
          onChange={(e) => {
            form.setFieldValue("chaser.setUp.colL", e.target.checked ? 0 : -1);
          }}
        />
        <Checkbox
          label="Clockwise"
          onChange={(e) => {
            form.setFieldValue("chaser.clockWise", e.target.checked ? 0 : -1);
          }}
        />
      </Group>

      <NumberInput
        label="Horizontal Pixels"
        value={form.values.chaser.width}
        onChange={(value) => {
          form.setFieldValue("chaser.width", value);
        }}
      />
      <NumberInput
        label="Vertikal Pixels"
        value={form.values.chaser.height}
        onChange={(value) => {
          form.setFieldValue("chaser.height", value);
        }}
      />
      <NumberInput
        label="Start-Led"
        value={form.values.chaser.startLed}
        onChange={(value) => {
          form.setFieldValue("chaser.startLed", value);
        }}
      />

      <canvas
        id="canvas-desktop-thumbnail"
        style={{ display: "none" }}
      ></canvas>
    </>
  );
}
