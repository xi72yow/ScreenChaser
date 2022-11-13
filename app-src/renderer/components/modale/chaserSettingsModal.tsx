import {
  ActionIcon,
  Box,
  Button,
  Group,
  Indicator,
  Loader,
  Modal,
  NativeSelect,
  PasswordInput,
  SegmentedControl,
  Select,
  Table,
  TextInput,
} from "@mantine/core";
import {
  IconRefresh,
  IconFocus2,
  IconAccessPoint,
  IconSend,
} from "@tabler/icons";
import React, { useEffect, useRef, useState } from "react";
import DataEmitter from "../effects_build/network/dataEmitter.js";
import setAll from "../effects_build/basics/setAll.js";
import { showNotification } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { addConfig, db, updateConfig } from "../database/db";
import { ipcRenderer } from "electron";
import { useForm } from "@mantine/form";

interface scanNetworkModalProps {}

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

function DeviceRow({ device, configs, i }) {
  return (
    device.ip && (
      <tr style={{ height: "3rem" }}>
        <td>{device.new ? <Indicator>{device.ip}</Indicator> : device.ip}</td>
        <td>
          <TextInput
            width={"75px"}
            type="string"
            value={configs[i].device.name}
            onChange={(e) => {
              updateConfig(i + 1, {
                device: {
                  ...configs[i].device,
                  name: e.currentTarget.value,
                  new: false,
                },
              });
            }}
          ></TextInput>{" "}
        </td>
        <td>{IdentifyColors[i].name}</td>

        <td>
          <TextInput
            width={"75px"}
            type="number"
            value={configs[i].device.neoPixelCount}
            onChange={(e) => {
              const neoPixelCount = parseInt(e.currentTarget.value) || "";

              if (neoPixelCount < 0 || neoPixelCount > 780) {
                showNotification({
                  title: "Chaser Notification",
                  message: "NeoPixelCount count must be between 0 and 780",
                  color: "red",
                });
                return;
              }
              updateConfig(i + 1, {
                device: {
                  ...configs[i].device,
                  neoPixelCount,
                },
              });
            }}
          ></TextInput>
        </td>
      </tr>
    )
  );
}

export default function ScanNetworkModal({}: scanNetworkModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("network");
  const [scanning, setScanning] = useState(false);
  const initialScan = useRef(true);

  const settingsForm = useForm({
    initialValues: {
      path: "",
      password: "",
      ssid: "",
    },
    validate: (values) => ({
      path: values.path === "" ? "Choose an Serial Port" : null,
      ssid: values.ssid === "" ? "Please set your W-Lan SSID" : null,
      password:
        values.password === "" ? "Please set your W-Lan password" : null,
    }),
  });

  const [serialPorts, setSerialPorts] = useState([]);

  function refreshSerialPorts() {
    ipcRenderer.invoke("SERIAL:GET_PORTS").then((ports) => {
      const foundPorts = ports.map((port, i) => {
        return { value: port.path, label: port.path };
      });
      let newPorts = [];
      foundPorts.forEach((port, index, array) => {
        if (serialPorts.findIndex((p) => p.value === port.value) === -1) {
          newPorts.push(port);
        }
      });

      newPorts = newPorts.filter((v) => v.value.includes("USB"));

      if (newPorts.length > 0) {
        showNotification({
          title: "Chaser Notification",
          message:
            "Potencial new via USB connected Chaser found: " +
            newPorts.map((p) => p.value).join(", "),
          color: "blue",
        });
      } else
        showNotification({
          title: "Chaser Notification",
          message: "No potencial new via USB connected Chaser found.",
          color: "blue",
        });

      setSerialPorts(foundPorts);
    });
  }

  useEffect(() => {
    refreshSerialPorts();
  }, []);

  const configs = useLiveQuery(async () => {
    return await db.configs.toArray();
  }, []);

  function scanNetwork() {
    setScanning(true);
    const DataEmitterForIP = new DataEmitter(false);
    DataEmitterForIP.init().then((value) => {
      const detectedDevices = DataEmitterForIP.getSlaves();
      checkForNewDevices(
        configs.map((conf) => conf.device),
        detectedDevices
      );
      setScanning(false);
    });
  }

  function checkForNewDevices(old, newDevices) {
    let newConfigs = [];
    newDevices.forEach((newD, index, array) => {
      old.findIndex((old, index, array) => {
        return old.ip === newD.ip;
      });
      if (
        old.findIndex((old, index, array) => {
          return old.ip === newD.ip;
        }) === -1
      ) {
        newD.new = true;
        delete newD.type;
        delete newD.port;
        newD.name = "";
        newD.neoPixelCount = 60;
        newConfigs.push({ device: { ...newD } });

        addConfig({ device: { ...newD } }).then((value) => {
          showNotification({
            title: "Chaser Notification",
            message: `I found a new device: ${newD.ip}`,
          });
        });
      }
    });

    if (newConfigs.length === 0) {
      showNotification({
        title: "Chaser Notification",
        message: `No new devices found`,
      });
    }
  }

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

  useEffect(() => {
    if (configs && initialScan.current) {
      scanNetwork();
      initialScan.current = false;
    }
  }, [configs]);

  if (configs === undefined) {
    return <div>Loading...</div>;
  }

  const rows = configs.map(({ device }, i) => (
    <DeviceRow
      key={device.ip + configs.length}
      device={device}
      configs={configs}
      i={i}
    />
  ));

  return (
    <React.Fragment>
      <Modal
        centered
        size={"xl"}
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Device Configuration"
        overflow="inside"
      >
        <SegmentedControl
          fullWidth
          size="xs"
          defaultValue={selectedTab}
          onChange={(value) => {
            setSelectedTab(value);
          }}
          data={[
            { value: "network", label: "Network" },
            { value: "credentials", label: "Device" },
          ]}
        />
        <Box sx={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
          {selectedTab === "network" && (
            <div>
              <Table>
                <thead>
                  <tr>
                    <th>Chaser IP</th>
                    <th>Chaser Name</th>
                    <th>Identify Color</th>
                    <th>Neopixel Count</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </Table>
              <Group position="right" pt={"md"}>
                <Button
                  sx={{ float: "right", marginRight: "0.5rem" }}
                  leftIcon={<IconFocus2></IconFocus2>}
                  onClick={() => {
                    sendIdentifyColor();
                  }}
                >
                  Send Identify Color
                </Button>
                <Button
                  sx={{ float: "right" }}
                  leftIcon={
                    scanning ? (
                      <Loader size="sm" />
                    ) : (
                      <IconRefresh></IconRefresh>
                    )
                  }
                  onClick={() => {
                    scanNetwork();
                  }}
                  disabled={scanning}
                >
                  Scan
                </Button>
              </Group>
            </div>
          )}
          {selectedTab === "credentials" && (
            <form
              onSubmit={settingsForm.onSubmit((values) => {
                ipcRenderer.send("SERIAL:EMIT", values);
                showNotification({
                  title: "Chaser Notification",
                  message: `Sent credentials to Chaser, see blinking LED-Indicator.`,
                });
              })}
            >
              <Select
                label="Serial Port"
                description="Choose the Serial Port of your Chaser, usually /dev/ttyUSB0."
                placeholder="Pick one"
                {...settingsForm.getInputProps("path")}
                nothingFound="No options"
                searchable
                data={serialPorts}
                rightSection={
                  <ActionIcon
                    onClick={() => {
                      refreshSerialPorts();
                    }}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                }
              />

              <TextInput
                placeholder="My-WLAN"
                description="This is name of your WLAN"
                label="W-Lan SSID"
                {...settingsForm.getInputProps("ssid")}
              />
              <PasswordInput
                placeholder="Password"
                label="Your W-Lan Password"
                {...settingsForm.getInputProps("password")}
              />
              <Button
                type="submit"
                sx={{ float: "right", marginTop: "1.5rem" }}
                leftIcon={<IconSend></IconSend>}
              >
                Send Credentials
              </Button>
            </form>
          )}
        </Box>
      </Modal>
      <Indicator
        dot={scanning}
        label={configs.reduce(
          (previousValue, currentValue, currentIndex, array) => {
            return currentValue.device.new ? previousValue + 1 : previousValue;
          },
          0
        )}
        inline
        size={22}
        position="bottom-end"
        color="blue"
        withBorder
        processing={scanning}
        showZero={false}
      >
        <ActionIcon
          onClick={() => {
            setOpen(true);
          }}
          variant="filled"
          sx={{ height: 40, width: 40 }}
        >
          <IconAccessPoint size={18} stroke={1.5} />
        </ActionIcon>
      </Indicator>
    </React.Fragment>
  );
}
