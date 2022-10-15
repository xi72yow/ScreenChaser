import {
  Code,
  Group,
  Header,
  Menu,
  Button,
  useMantineTheme,
  Text,
  ActionIcon,
} from "@mantine/core";
import {
  IconChevronDown,
  IconCpu,
  IconCpu2,
  IconDeviceFloppy,
} from "@tabler/icons";
import { useLocalStorage } from "@mantine/hooks";

import React, { useState } from "react";
import QuantityInput from "../forms/inputs/number";
import Logo from "../styles/Logo.js";
import { showNotification } from "@mantine/notifications";

export default function HeaderApp(props) {
  const { data, setSelectedDevice, form } = props;
  const theme = useMantineTheme();
  const [selected, setSelected] = useState(data[0]);
  const [configs, setConfigs] = useLocalStorage({
    key: "ScreenChaserConfigs",
  });

  React.useEffect(() => {
    form.setFieldValue("device", { ...form.values.device, ...selected });
  }, [selected]);

  const items = data.map((item) => {
    return (
      <Menu.Item
        key={item.ip}
        onClick={() => {
          setSelected(item);
          setSelectedDevice(item);
        }}
        icon={<IconCpu size={16} color={theme.colors.blue[6]} stroke={1.5} />}
        rightSection={
          <Text size="xs" transform="uppercase" weight={700} color="dimmed">
            {item.name || "No name"}
          </Text>
        }
      >
        {item.ip}
      </Menu.Item>
    );
  });
  return (
    <Header
      height={80}
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
        }}
      >
        <Group position="apart" sx={{ width: 300, paddingRight: "1rem" }}>
          <Logo width={180} />
          <Code sx={{ fontWeight: 700 }}>v1.0.0</Code>
        </Group>
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
          <Menu transition="pop-top-right" position="top-end" width={220}>
            <Menu.Target>
              <Button
                sx={{ height: 40 }}
                rightIcon={<IconChevronDown size={18} stroke={1.5} />}
                pr={12}
              >
                {selected?.name || selected?.ip || "Choose Device"}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>{items}</Menu.Dropdown>
          </Menu>
          <QuantityInput
            sx={{ width: 69 }}
            max={999}
            form={form}
            path="device.neopixelCount"
            defaultValue={
              selected?.neopixelCount || form.values.device?.neopixelCount || 60
            }
          ></QuantityInput>
          <ActionIcon
            onClick={() => {
              setConfigs({ ...form.values });
              showNotification({
                title: "Configs saved",
                message: `The configs were saved successfully for ${selected.ip}`,
              });
            }}
            variant="filled"
            sx={{ height: 40, width: 40 }}
          >
            <IconDeviceFloppy size={18} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Group>
    </Header>
  );
}
