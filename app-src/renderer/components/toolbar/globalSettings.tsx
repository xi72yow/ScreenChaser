import {
  Group,
  ActionIcon,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons";
import React from "react";

type Props = {};

export default function GlobalSettings({}: Props) {
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
    </Group>
  );
}
