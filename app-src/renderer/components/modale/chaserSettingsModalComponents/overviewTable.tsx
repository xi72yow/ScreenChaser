import {
  Table,
  Text,
  Group,
  Button,
  Loader,
  ColorSwatch,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconFocus2, IconRefresh } from "@tabler/icons";
import React, { useState } from "react";
import { DataEmitter, setAll } from "screenchaser-core";

const IdentifyColors = {
  "0": { name: "gray", color: { r: 50, g: 50, b: 50 } },
  "1": { name: "red", color: { r: 255, g: 0, b: 0 } },
  "2": { name: "green", color: { r: 0, g: 255, b: 0 } },
  "3": { name: "blue", color: { r: 0, g: 0, b: 255 } },
  "4": { name: "yellow", color: { r: 255, g: 255, b: 0 } },
  "5": { name: "cyan", color: { r: 0, g: 255, b: 255 } },
  "6": { name: "magenta", color: { r: 255, g: 0, b: 255 } },
  "7": { name: "white", color: { r: 255, g: 255, b: 255 } },
};

function DeviceRow({ device, configs, i, theme }: any) {
  return (
    device.ip && (
      <tr style={{ height: "3rem" }}>
        <td>{device.ip}</td>
        <td>{configs[i].device.name || <Text c="dimmed">No Name</Text>}</td>
        <td>{IdentifyColors[i].name}</td>

        <td>{configs[i].device.neoPixelCount}</td>
        <td>
          <Group position="center" sx={{ width: "42px" }}>
            <Tooltip label={device.new ? "new" : "ok"}>
              <ColorSwatch
                component="div"
                opacity={0.5}
                color={
                  device.new ? theme.colors.grape[6] : theme.colors.gray[6]
                }
                sx={{ color: "#fff", cursor: "pointer" }}
              ></ColorSwatch>
            </Tooltip>
          </Group>
        </td>
      </tr>
    )
  );
}

type Props = {
  configs: any;
  scanNetwork: any;
  setScanning: any;
  scanning: boolean;
};

export default function OverviewTable({
  configs,
  scanNetwork,
  scanning,
  setScanning,
}: Props) {
  const theme = useMantineTheme();

  function sendIdentifyColor() {
    configs.forEach(({ device }, index, array) => {
      const DataEmitterForIP = new DataEmitter(false, device.ip);
      const rgb = IdentifyColors[index].color;
      DataEmitterForIP.emit(
        setAll(rgb.r, rgb.g, rgb.b, device.neoPixelCount || 60)
      );
    });
    showNotification({
      title: "Chaser Notification",
      message: `Sent identify colors to all Chasers`,
    });
  }
  const rows = configs.map(({ device }, i) => (
    <DeviceRow
      key={device.ip + configs.length}
      device={device}
      theme={theme}
      configs={configs}
      i={i}
    />
  ));
  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Chaser IP</th>
            <th>Chaser Name</th>
            <th>Identify Color</th>
            <th>Neopixel Count</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
      <Group position="right" pt={"md"}>
        <Button
          sx={{
            float: "right",
            marginRight: "0.5rem",
            marginBottom: "0.5rem",
            marginTop: "1.5rem",
          }}
          leftIcon={<IconFocus2></IconFocus2>}
          onClick={() => {
            sendIdentifyColor();
          }}
        >
          Send Identify Color
        </Button>
        <Button
          sx={{ float: "right", marginTop: "1.5rem", marginBottom: "0.5rem" }}
          leftIcon={
            scanning ? <Loader size="sm" /> : <IconRefresh></IconRefresh>
          }
          onClick={() => {
            scanNetwork();
          }}
          disabled={scanning}
        >
          Scan
        </Button>
      </Group>
    </>
  );
}
