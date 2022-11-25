import React, { useEffect, useState } from "react";
import { ipcRenderer } from "electron";
import {
  useMantineTheme,
  Text,
  Button,
  Group,
  Image as MantineImage,
  Box,
  Modal,
  Col,
  Grid,
  ScrollArea,
} from "@mantine/core";
import { IconChevronDown, IconCpu } from "@tabler/icons";
import styled from "@emotion/styled";
import { useElementSize } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

const PreviewImage = styled(MantineImage)`
  cursor: pointer;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0);
  &:hover {
    border: 2px solid #9b03ff;
    border-radius: 8px;
  }
`;

const Holder = styled.div<{ width: number }>`
  background: #222;
  width: ${({ width }) => (width ? `${width * 0.25}px` : "100%")};
  height: 50px;
`;

//@ts-ignore
const Stand = styled.div<{ width: number }>`
  background: #333;
  border-top-left-radius: 0.5em;
  border-top-right-radius: 0.5em;
  width: ${({ width }) => (width ? `${width * 0.5}px` : "100%")};
  height: 20px;
`;

interface ChaserProps {
  form: any;
  selectedDevice: any;
}

export default function Chaser({ form, selectedDevice }: ChaserProps) {
  const { ref: refSize, width, height } = useElementSize();
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

  useEffect(() => {
    setVideoSource(selected.id);
  }, []);

  async function setVideoSource(sourceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          //@ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            maxWidth: 400,
          },
        },
      });
      handleStream(stream);
    } catch (e) {
      handleError(e);
    }
  }

  function handleStream(stream) {
    const video = document.querySelector("video");
    video.srcObject = stream;
    video.onloadedmetadata = (e) => video.play();
  }

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
            setVideoSource(item.id);
          }}
          style={{ paddingTop: 5 }}
        >
          <Box sx={{ maxWidth: "98%" }}>
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
      <Box ref={refSize}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1em",
          }}
        >
          <Box>
            <div
              style={{
                width: width * 0.7 + "px",
                height: ((width * 0.7) / 16) * 9 + "px",
                border: "solid 18px #333",
                borderRadius: ".5em",
                backgroundColor: "#000",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <video
                id="chaser_video"
                style={{
                  height: ((width * 0.7) / 16) * 9 - 30 + "px",
                  float: "right",
                }}
              ></video>
            </div>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Holder width={width * 0.7}></Holder>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Stand width={width * 0.7}></Stand>
            </Box>
          </Box>
        </Box>
      </Box>
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
      <canvas
        id="canvas-desktop-thumbnail"
        style={{ display: "none" }}
      ></canvas>
    </>
  );
}
