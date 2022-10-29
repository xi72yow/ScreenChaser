import {
  Group,
  ActionIcon,
  useMantineColorScheme,
  useMantineTheme,
  Tooltip,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconSun,
  IconMoonStars,
  IconPower,
  IconPlayerPlay,
  IconHelp,
} from "@tabler/icons";
import React, { useState } from "react";
import HelpModal from "../modale/helpModal";

type Props = { setLightsOff: any; lightsOff: boolean };

export default function GlobalSettings({ setLightsOff, lightsOff }: Props) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const [open, setOpen] = useState(false);

  return (
    <Group position="center" my="xl" sx={{ paddingLeft: theme.spacing.md }}>
      <HelpModal open={open} setOpen={setOpen}></HelpModal>
      <Tooltip label="Help">
        <ActionIcon
          onClick={() => {
            setOpen(true);
          }}
          size="lg"
          sx={(theme) => ({
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
            color:
              theme.colorScheme === "dark"
                ? theme.colors.gray[3]
                : theme.colors.gray[9],
          })}
        >
          <IconHelp size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Toggle Dark Mode">
        <ActionIcon
          onClick={() => toggleColorScheme()}
          size="lg"
          sx={(theme) => ({
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
            color:
              theme.colorScheme === "dark"
                ? theme.colors.yellow[4]
                : theme.colors.blue[6],
          })}
        >
          {colorScheme === "dark" ? (
            <IconSun size={18} />
          ) : (
            <IconMoonStars size={18} />
          )}
        </ActionIcon>
      </Tooltip>
      <Tooltip label={lightsOff ? "Lights On" : "Lights Off"}>
        <ActionIcon
          onClick={() => {
            setLightsOff((bool) => {
              return !bool;
            });
            if (lightsOff)
              showNotification({
                title: "Chaser Notification",
                message: "The Chasers continues to work.",
                color: "green",
                icon: <IconPlayerPlay size={18} />,
                sx: { cursor: "pointer" },
              });
            else
              showNotification({
                title: "Chaser Notification",
                message: "Signal to turn off the device has been sent. ",
                color: "red",
                icon: <IconPower size={18} />,
                sx: { cursor: "pointer" },
              });
          }}
          size="lg"
          sx={(theme) => ({
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
            color: lightsOff ? theme.colors.green[5] : theme.colors.red[5],
          })}
        >
          {lightsOff ? <IconPlayerPlay size={18} /> : <IconPower size={18} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
