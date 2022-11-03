import { Box, Button, Image } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { showNotification } from "@mantine/notifications";
import { useElementSize } from "@mantine/hooks";

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

type Props = {
  selected: { id: string; name: string };
  setSources: any;
  setOpened: any;
};

export default function VideoChaser({
  selected,
  setOpened,
  setSources,
}: Props) {
  const { ref: refSize, width, height } = useElementSize();

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
    console.log("🚀 ~ file: video.tsx ~ line 77 ~ handleError ~ e", e);
    showNotification({
      title: "Chaser Error",
      message: e.message,
      color: "red",
    });
  }

  useEffect(() => {
    if (selected && selected.id !== "default") setVideoSource(selected.id);
    console.log(
      "🚀 ~ file: video.tsx ~ line 87 ~ useEffect ~ selected",
      selected
    );
  }, [selected]);

  return (
    <>
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
