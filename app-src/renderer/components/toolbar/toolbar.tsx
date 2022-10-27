import { ActionIcon, Button, createStyles, Footer, Group } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconBulb } from "@tabler/icons";
import React from "react";
import { ConfigInterface, db } from "../database/db";
import useStyles from "../styles/styles";
import GlobalSettings from "./globalSettings";

type ToolbarProps = {
  taskCode: string;
  selectedDevice: number;
  configs: Array<ConfigInterface>;
};

export default function Toolbar({ taskCode }: ToolbarProps) {
  const { classes } = useStyles();

  return (
    <Footer
      height={70}
      className={classes.footer}
      sx={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Group
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "1rem",
        }}
      >
        <GlobalSettings></GlobalSettings>
      </Group>
      <Group
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "1rem",
        }}
      >
        <Group>
          {taskCode !== "dashboard" && taskCode !== "chaser" && (
            <Button
              onClick={() => {
                showNotification({
                  title: "Default notification",
                  message: "Hey there, your code is awesome! 🤥",
                });
              }}
              leftIcon={<IconBulb size={14} />}
            >
              Lights On
            </Button>
          )}
        </Group>
      </Group>
    </Footer>
  );
}
