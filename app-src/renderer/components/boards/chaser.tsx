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
  Tabs,
  SegmentedControl,
} from "@mantine/core";
import { IconChevronDown, IconCpu } from "@tabler/icons";
import styled from "@emotion/styled";
import { useElementSize } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import VideoChaser from "./video";
import AudioChaser from "./audio";

const PreviewImage = styled(Image)`
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0);
  &:hover {
    border: 2px solid #9b03ff;
    border-radius: 8px;
  }
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
  const [selectedTab, setSelectedTab] = useState(
    form.values.chaser.sourceId !== "default" ? "video" : "audio"
  );

  useEffect(() => {
    form.setFieldValue("chaser.sourceId", selected?.id || "");
    form.setFieldValue("chaser.name", selected?.name || "");
    console.log("message", selected);
    //ipcRenderer.send("CHASER:", selected);
  }, [selected]);

  const items = sources.map((item) => {
    return (
      <Col
        span={6}
        key={item.id}
        onClick={() => {
          setSelected(item);
          setOpened(false);
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
      <SegmentedControl
        fullWidth
        defaultValue={
          form.values.chaser.sourceId !== "default" ? "video" : "audio"
        }
        onChange={(value) => {
          console.log(
            "🚀 ~ file: chaser.tsx ~ line 131 ~ Chaser ~ value",
            value
          );
          if (value === "audio")
            setSelected({ id: "default", name: "Desktop Audio" });
          else
            setSelected({
              id: "",
              name: "Desktop Video",
            });
          setSelectedTab(value);
        }}
        data={[
          { value: "video", label: "Video" },
          { value: "audio", label: "Audio" },
        ]}
      />
      <Box sx={{ padding: "1rem" }}>
        {selectedTab === "video" && (
          <VideoChaser
            selected={selected}
            setSources={setSources}
            setOpened={setOpened}
          ></VideoChaser>
        )}
        {selectedTab === "audio" && <AudioChaser></AudioChaser>}
      </Box>
    </>
  );
}
