import React, { useEffect, useState } from "react";
import { ipcRenderer } from "electron";
import {
  useMantineTheme,
  Text,
  Button,
  Group,
  Image,
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

import { updateConfig } from "../database/db";

const PreviewImage = styled(Image)`
  cursor: pointer;
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
    form.setFieldValue("chaser.id", selected?.id || "");
    form.setFieldValue("chaser.name", selected?.name || "");
    console.log("message", selected);
    //ipcRenderer.send("CHASER:", selected);
  }, [selected]);

  useEffect(() => {
    if (selected?.id !== "") {
      setVideoSource(selected.id);
    }
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
            minWidth: 1280,
          },
        },
      });
      handleStream(stream);
    } catch (e) {
      showNotification({
        title: "Chaser Error",
        message: JSON.stringify(e),
        color: "red",
      });
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
      message: JSON.stringify(e),
      color: "red",
    });
  }

  const items = sources.map((item) => {
    return (
      <Col
        span={6}
        key={item.id}
        onClick={() => {
          setSelected(item);
          setOpened(false);
          setVideoSource(item.id);
        }}
      >
        <Group
          sx={{
            display: "flex",
          }}
        >
          <PreviewImage
            radius="md"
            src={item.thumbnail.toDataURL()}
            width={"100%"}
            alt={item.name + "_thumbnail"}
          />
          <Text
            size="xs"
            sx={{
              textOverflow: "ellipsis",
              width: 200,
              display: "inline-block",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
            transform="uppercase"
            weight={700}
            color="dimmed"
          >
            {item.name || "No name"}
          </Text>
        </Group>
      </Col>
    );
  });

  return (
    <>
      <Modal
        centered
        opened={opened}
        onClose={() => setOpened(false)}
        title="Choose Video Source"
      >
        <ScrollArea style={{ height: 300 }}>
          <Grid sx={{ marginRight: "1rem" }}>{items}</Grid>
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
          ipcRenderer.invoke("GET_SOURCES").then((sources) => {
            console.log("result", sources);
            setSources(sources);
            setOpened(true);
          });
        }}
      >
        {selected?.name || "Choose Video Source"}
      </Button>
    </>
  );
}
