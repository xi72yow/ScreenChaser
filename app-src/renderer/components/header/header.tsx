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

import React, { Dispatch, SetStateAction, useState } from "react";
import QuantityInput from "../forms/inputs/number";
import Logo from "../styles/Logo.js";
import { showNotification } from "@mantine/notifications";
import ScanNetworkModal from "../modale/scanNetworkModal";

interface HeaderAppProps {
  form: any;
  setDevices: Dispatch<SetStateAction<any[]>>;
  devices: { ip: string; name: string; neoPixelCount: number }[];
  setConfigs: any;
  configs: any;
  setSelectedDevice: Dispatch<SetStateAction<Number>>;
}

export default function HeaderApp({
  devices,
  setDevices,
  form,
  configs,
  setConfigs,
  setSelectedDevice,
}: HeaderAppProps) {
  const theme = useMantineTheme();

  React.useEffect(() => {
    form.setFieldValue("device.ip", devices[0]?.ip || "");
    form.setFieldValue("device.name", devices[0]?.name || "");
  }, []);

  const items = devices.map((item, i) => {
    return (
      <Menu.Item
        key={item.ip}
        onClick={() => {
          setSelectedDevice(i);
          form.setFieldValue("device.ip", item?.ip || "");
          form.setFieldValue("device.name", item?.name || "");
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
                {form.values.device?.name ||
                  form.values.device?.ip ||
                  "Choose Device"}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>{items}</Menu.Dropdown>
          </Menu>
          <QuantityInput
            sx={{ width: 69 }}
            max={999}
            form={form}
            path="device.neoPixelCount"
            defaultValue={form.values.device?.neopixelCount || 60}
          ></QuantityInput>
          <ActionIcon
            onClick={() => {
              const configsEdit = structuredClone(configs);

              const index = configsEdit.configs.findIndex(
                (config, index, array) => {
                  return config.device.ip === form.values.device?.ip;
                }
              );

              if (index > -1) {
                configsEdit.configs[index] = { ...form.values };
              } else {
                configsEdit.configs.push({ ...form.values });
              }
              if (form.values.device?.ip === "") {
                showNotification({
                  title: "Configs not saved",
                  message: `The configs were not saved because the device IP is not set`,
                  typeof: "error",
                });
              } else {
                setConfigs({ ...configsEdit });
                showNotification({
                  title: "Configs saved",
                  message: `The configs were saved successfully for ${form.values.device?.ip}`,
                });
              }
            }}
            variant="filled"
            sx={{ height: 40, width: 40 }}
          >
            <IconDeviceFloppy size={18} stroke={1.5} />
          </ActionIcon>
          <ScanNetworkModal
            form={form}
            devices={devices}
            setDevices={setDevices}
          ></ScanNetworkModal>
        </Group>
      </Group>
    </Header>
  );
}
