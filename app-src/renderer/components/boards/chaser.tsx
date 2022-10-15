import React, { useState } from "react";
import electron, { ipcRenderer } from "electron";
import {
  useMantineTheme,
  Text,
  Menu,
  Button,
  Group,
  Image,
} from "@mantine/core";
import { IconChevronDown, IconCpu } from "@tabler/icons";

export default function Chaser() {
  const theme = useMantineTheme();
  const [selected, setSelected] = useState(null);
  const [sources, setSources] = useState([]);
  const [opened, setOpened] = useState(false);

  async function setVideoSource(sourceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          //@ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
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
    console.log(e);
  }

  const items = sources.map((item) => {
    return (
      <Menu.Item
        key={item.id}
        onClick={() => {
          setSelected(item);
          setOpened(false);
          setVideoSource(item.id);
        }}
        icon={<IconCpu size={16} color={theme.colors.blue[6]} stroke={1.5} />}
      >
        <Group sx={{ display: "flex" }}>
          <Image
            radius="md"
            src={item.thumbnail.toDataURL()}
            width={37}
            height={23}
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
      </Menu.Item>
    );
  });

  return (
    <React.Fragment>
      <Menu
        opened={opened}
        transition="pop-top-right"
        position="top-start"
        width={400}
      >
        <Menu.Target>
          <Button
            leftIcon={<IconChevronDown size={18} stroke={1.5} />}
            onClick={() => {
              ipcRenderer.invoke("GET_SOURCES").then((sources) => {
                console.log("result", sources);
                setSources(sources);
                setOpened(true);
              });
            }}
            sx={{ maxWidth: 300 }}
          >
            {selected?.name || "Choose Video Source"}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>{items}</Menu.Dropdown>
      </Menu>
      <Button
        leftIcon={<IconChevronDown size={18} stroke={1.5} />}
        onClick={() => {
          console.log("message");
        }}
        sx={{ maxWidth: 300 }}
      >
        {selected?.name || "Choose Video Source"}
      </Button>
      <video style={{ width: 320, height: 180, float: "right" }}></video>
    </React.Fragment>
  );
}
