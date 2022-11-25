import {
  useMantineTheme,
  Group,
  ColorSwatch,
  Popover,
  ActionIcon,
  ColorPicker,
  Grid,
  Button,
  Text,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSquareX, IconEdit } from "@tabler/icons";
import React, { useState } from "react";

type Props = {
  label: string;
  defaultValue?: Array<string>;
  form?: any;
  path?: string;
};

const bubbleColors = ["#24D024", "#EA0D0D"];

export default function Swatches({ label, form, defaultValue, path }: Props) {
  const theme = useMantineTheme();
  /*   const [checked, setChecked] = useState([]);*/
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
                /*     if (!opened)
              setChecked((c) => {
                c[index] = !c[index];
                return [...c];
              }); */
                setColor(color);
                setOpened((open) => true);
              }}
              sx={{ color: "#fff", cursor: "pointer" }}
              color={color}
            >
              {/*  {checked[index] ? <CheckIcon width={10} /> : ""} */}
            </ColorSwatch>
          ))}
        </Group>
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
    </React.Fragment>
  );
}
