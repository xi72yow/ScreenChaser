import styled from "@emotion/styled";
import { withJsonFormsControlProps } from "@jsonforms/react";
import {
  ActionIcon,
  Box,
  Grid,
  Group,
  Image as MantineImage,
  Modal,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconDeviceTv } from "@tabler/icons";
import React, { useEffect, useState } from "react";

const PreviewImage = styled(MantineImage)`
  cursor: pointer;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0);
  &:hover {
    border: 2px solid #9b03ff;
    border-radius: 8px;
  }
`;

type SourcePickerProps = {
  label: string;
  path: string;
  data: any;
  handleChange: (path: string, value: any) => void;
};

export const delimiter = "d3l1m173r";

export function createSourceString(source) {
  return `${source.name}${delimiter}${source.id}`;
}

export function parseSourceString(sourceString) {
  const [name, id] = sourceString.split(delimiter);
  if (!name || !id) {
    return { name: "", id: "" };
  }
  if (name.length > 20) {
    return { name: name.slice(0, 45) + "...", id };
  }
  return { name, id };
}

export function SourcePicker({
  data,
  path,
  label,
  handleChange,
}: SourcePickerProps) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);

  const previewImageRef = React.useRef(null);
  const theme = useMantineTheme();

  function getPreview(id) {
    global.ipcRenderer.invoke("GET_SOURCES").then(async (sources) => {
      let sourseFound = false;
      for (let s in sources) {
        if (sources[s].id === id) {
          sourseFound = true;
          previewImageRef.current.src = sources[s].thumbnail.toDataURL();
        }
      }
      if (!sourseFound) {
        previewImageRef.current.src = "";
      }
    });
  }

  useEffect(() => {
    const item = parseSourceString(data);

    if (item.id === "") return;

    getPreview(item.id);
  }, [data]);

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
            handleChange(path, createSourceString(item));
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
    <React.Fragment>
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
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 500,
          marginTop: "0.1rem",
        }}
      >
        {label}
      </Text>
      <Group
        sx={{
          paddingRight: `${theme.spacing.sm}px !important`,
          paddingLeft: `${theme.spacing.sm}px !important`,
          border: `1px solid ${
            theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
          }`,
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
          height: 42,
          borderRadius: theme.radius.sm,
          justifyContent: "space-between",
        }}
      >
        <img
          ref={previewImageRef}
          style={{
            height: 30,
            borderRadius: 5,
            marginRight: 10,
          }}
        />
        {parseSourceString(data).id === ""
          ? "Choose Video Source"
          : parseSourceString(data).name}
        <ActionIcon
          loading={loading}
          onClick={() => {
            setLoading(true);
            global.ipcRenderer.invoke("GET_SOURCES").then(async (sources) => {
              console.log("result", sources);
              const sourcesScreen = sources.filter((source, index, array) => {
                return source.id.includes("screen");
              });
              const canvas = document.querySelector(
                "#canvas-desktop-thumbnail"
              ) as HTMLCanvasElement;
              canvas.width = 0;
              canvas.height = 225;
              sourcesScreen.forEach(async (source) => {
                const thumbnailSize = source.thumbnail.getSize();

                const lastWidth = canvas.width;

                canvas.width = canvas.width + thumbnailSize.width;

                async function setImage(
                  thumbnail: any
                ): Promise<HTMLImageElement> {
                  return new Promise(async (resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                      resolve(image);
                    };
                    image.src = await thumbnail.toDataURL();
                  });
                }
                canvas
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
                setLoading(false);
                setOpened(true);
              });
            });
          }}
        >
          <IconDeviceTv size={18} stroke={1.5} />
        </ActionIcon>
      </Group>

      <canvas
        id="canvas-desktop-thumbnail"
        style={{ display: "none" }}
      ></canvas>
    </React.Fragment>
  );
}

export default withJsonFormsControlProps(SourcePicker);
