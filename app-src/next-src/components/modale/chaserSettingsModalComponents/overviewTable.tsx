import {
  Button,
  ColorSwatch,
  Group,
  Loader,
  Table,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconFocus2, IconRefresh } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { setAll } from "screenchaser-core/dist/helpers";
import {
  DeviceTableInterface,
  TableNames,
  db,
  dbBool,
  updateElementInTable,
} from "../../database/db";

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

function DeviceRow({ device, theme, counter }: any) {
  const [name, setName] = useState(device.name);
  const [debouncedName] = useDebouncedValue(name, 200, { leading: true });

  useEffect(() => {
    updateElementInTable(TableNames.devices, device.id, {
      name: name,
      new: debouncedName.length !== 0 ? dbBool.false : dbBool.true,
    });
  }, [debouncedName]);

  const [neoPixelCount, setNeoPixelCount] = useState<number>(
    device.neoPixelCount
  );
  const [debouncedNeoPixelCount] = useDebouncedValue(neoPixelCount, 200, {
    leading: true,
  });

  useEffect(() => {
    if (debouncedNeoPixelCount === 0) {
      showNotification({
        title: "Error",
        message: "NeoPixel count must be a number",
        color: "red",
      });
      return;
    }
    updateElementInTable(TableNames.devices, device.id, {
      neoPixelCount: neoPixelCount,
    });
  }, [debouncedNeoPixelCount]);

  return (
    device.ip && (
      <tr style={{ height: "3rem" }}>
        <td>{device.ip}</td>
        <td>
          <TextInput
            sx={{
              input: {
                border: "none",
                borderBottom: "1px solid #ccc",
                margin: "0",
                paddingLeft: "1rem",
                width: "100%",
                height: "100%",
                textAlign: "left",
                "&:focus": {
                  outline: "none",
                  borderBottom: "1px solid #000",
                },
              },
            }}
            placeholder="Your Device Name"
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
          />
        </td>
        <td>{IdentifyColors[counter].name}</td>

        <td>
          <TextInput
            sx={{
              input: {
                border: "none",
                borderBottom: "1px solid #ccc",
                margin: "0",
                paddingLeft: "1rem",
                width: "100%",
                height: "100%",
                textAlign: "left",
                "&:focus": {
                  outline: "none",
                  borderBottom: "1px solid #000",
                },
              },
            }}
            type="number"
            placeholder="LED Count"
            value={neoPixelCount}
            onChange={(e) => {
              if (e.currentTarget.value.length > 3) {
                showNotification({
                  title: "Chaser Notification",
                  message: `LED Count can't be more than 3 digits`,
                });
                return;
              }
              setNeoPixelCount(parseInt(e.currentTarget.value));
            }}
          />
        </td>
        <td>
          <Group position="center" sx={{ width: "42px" }}>
            <Tooltip
              label={
                device.new === dbBool.true
                  ? "new"
                  : device.exclude === dbBool.true
                  ? "excluded"
                  : "ok"
              }
            >
              <ColorSwatch
                component="div"
                color={
                  device.new === dbBool.true
                    ? theme.colors.grape[6]
                    : device.exclude === dbBool.true
                    ? theme.colors.gray[6]
                    : theme.colors.green[6]
                }
                sx={{ color: "#fff", cursor: "pointer", opacity: 0.5 }}
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

export default function OverviewTable({ scanNetwork, scanning }: Props) {
  const theme = useMantineTheme();

  const devices: DeviceTableInterface[] = useLiveQuery(
    async () => {
      return db.devices.toArray();
    },
    null,
    []
  );

  function sendIdentifyColor() {
    devices.forEach(({ ip, neoPixelCount, id }, index, array) => {
      const rgb = IdentifyColors[index].color;
      global.ipcRenderer.send(
        "CHASER:SEND_STATIC_STRIPE",
        setAll(rgb.r, rgb.g, rgb.b, neoPixelCount),
        id
      );
    });
    showNotification({
      title: "Chaser Notification",
      message: `Sent identify colors to all Chasers`,
    });
  }

  const rows = devices.map((device, i) => {
    return (
      <DeviceRow
        key={device.ip + "-device-row"}
        device={device}
        theme={theme}
        counter={i}
      />
    );
  });
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
