import {
  ActionIcon,
  Button,
  ColorPicker,
  ColorSwatch,
  Grid,
  Group,
  Popover,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconEdit, IconSquareX, IconWand } from "@tabler/icons";
import React, { useState } from "react";
import { random, randomColor } from "screenchaser-core";
import { ConfigInterface } from "../../database/db";

type Props = {
  label: string;
  defaultValue?: Array<string>;
  form: UseFormReturnType<ConfigInterface>;
  path?: string;
};

export default function Swatches({ label, form, defaultValue, path }: Props) {
  const theme = useMantineTheme();
  const [swatches, setSwatches] = useState(defaultValue);
  const [opened, setOpened] = useState(false);
  const [color, setColor] = useState("#9B03FF");
  React.useEffect(() => {
    if (form) {
      form.setFieldValue(path, defaultValue);
    }
  }, []);

  React.useEffect(() => {
    if (form) {
      form.setFieldValue(path, swatches);
    }
  }, [swatches]);

  const onClick = (event) => {
    if (typeof event.target?.className !== "string") return;
    if (event.target?.className?.toLowerCase().includes("appshell")) {
      setOpened(false);
      window.removeEventListener("click", onClick);
    }
  };

  return (
    <React.Fragment>
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 400,
          marginTop: "0.5rem",
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
          height: 40,
          borderRadius: theme.radius.sm,
          justifyContent: "space-between",
        }}
      >
        <Group>
          {swatches.map((color, index) => (
            <ColorSwatch
              key={index}
              onClick={() => {
                setColor(color);
                setOpened((open) => true);
              }}
              sx={{ color: "#fff", cursor: "pointer" }}
              color={color}
            ></ColorSwatch>
          ))}
        </Group>
        <Group>
          <ActionIcon
            onClick={() => {
              const randomColors = [];
              randomColors.push(randomColor());
              for (let i = 0; i < random(4); i++) {
                randomColors.push(randomColor());
              }
              setSwatches(randomColors);
            }}
          >
            <IconWand size={18} stroke={1.5} />
          </ActionIcon>
          <Popover
            opened={opened}
            /* onChange={setOpened} */
            width={300}
            position="bottom-end"
            withArrow
            shadow="md"
          >
            <Popover.Target>
              <ActionIcon
                onClick={() => {
                  setOpened((open) => !open);
                  window.addEventListener("click", onClick);
                }}
              >
                {opened ? (
                  <IconSquareX size={18} stroke={1.5} />
                ) : (
                  <IconEdit size={18} stroke={1.5} />
                )}
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <ColorPicker value={color} onChange={setColor} fullWidth />
              <Grid mt={3}>
                <Grid.Col span={6}>
                  <Button
                    onClick={() => {
                      const swatchesCopy = [...swatches];
                      if (swatchesCopy.indexOf(color) > -1) {
                        swatchesCopy.splice(swatchesCopy.indexOf(color), 1);
                        setSwatches(swatchesCopy);
                      }
                    }}
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Button
                    onClick={() => {
                      if (swatches.length >= 7) {
                        showNotification({
                          title: "Config Error",
                          message:
                            "You have reached the maximum amount of colors",
                        });
                        return;
                      }
                      if (swatches.includes(color)) {
                        return;
                      }
                      setSwatches((swatches: string[]) => [...swatches, color]);
                    }}
                    fullWidth
                  >
                    Add
                  </Button>
                </Grid.Col>
              </Grid>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Group>
    </React.Fragment>
  );
}
