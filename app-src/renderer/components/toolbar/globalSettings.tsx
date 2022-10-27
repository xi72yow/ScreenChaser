import {
  Group,
  ActionIcon,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSun, IconMoonStars, IconPower } from "@tabler/icons";
import React from "react";

type Props = { setTaskCode: any };

export default function GlobalSettings({ setTaskCode }: Props) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return (
    <Group position="center" my="xl" sx={{ paddingLeft: theme.spacing.md }}>
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
      <ActionIcon
        onClick={() => {
          setTaskCode("shutdown");
          showNotification({
            title: "Chaser Notification",
            message:
              "Signal to turn off the device has been sent. Click Notification to repeat.",
            color: "red",
            icon: <IconPower size={18} />,
            onClick: () => {
              setTaskCode("dashboard");
              setTaskCode("shutdown");
            },
            sx: { cursor: "pointer" },
          });
        }}
        size="lg"
      >
        <IconPower size={18} />
      </ActionIcon>
    </Group>
  );
}