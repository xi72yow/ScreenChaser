import {
  ActionIcon,
  Button,
  Indicator,
  Loader,
  Modal,
  Table,
  TextInput,
} from "@mantine/core";
import { IconRefresh, IconFocus2, IconAccessPoint } from "@tabler/icons";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import DataEmitter from "../effects_build/network/dataEmitter.js";
import setAll from "../effects_build/basics/setAll.js";
import { showNotification } from "@mantine/notifications";

interface scanNetworkModalProps {
  form: any;
  setDevices: Dispatch<SetStateAction<any[]>>;
  devices: any[];
}

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

export default function ScanNetworkModal({
  form,
  setDevices,
  devices,
}: scanNetworkModalProps) {
  console.log("🚀 ~ file: scanNetworkModal.tsx ~ line 28 ~ devices", devices);

  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newDevices, setNewDevices] = useState(0);

  function scanNetwork() {
    setScanning(true);
    const DataEmitterForIP = new DataEmitter(false);
    DataEmitterForIP.init().then((value) => {
      const detectedDevices = DataEmitterForIP.getSlaves();
      console.log(
        "🚀 ~ file: scanNetworkModal.tsx ~ line 30 ~ DataEmitterForIP.init ~ detectedDevices",
        detectedDevices
      );
      checkForNewDevices(devices, detectedDevices);
      setScanning(false);
    });
  }

  function checkForNewDevices(old, newDevices) {
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
        setDevices((old) => [...old, newD]);
        setNewDevices((old) => old + 1);
        showNotification({
          title: "Chaser Notification",
          message: `I found a new device: ${newD.ip}`,
        });
      } else {
        showNotification({
          title: "Chaser Notification",
          message: `No new devices found`,
        });
      }
    });
  }

  function sendIdentifyColor() {
    devices.forEach((device, index, array) => {
      console.log("🚀 ~ file: scanNetworkModal.tsx ~ line 70 ~ device", device);
      if (device.new) {
        const DataEmitterForIP = new DataEmitter(false, device.ip);
        const rgb = IdentifyColors[index].color;
        DataEmitterForIP.emit(
          setAll(rgb.r, rgb.g, rgb.b, device.neoPixelCount || 60)
        );
      }
    });
  }

  useEffect(() => {
    scanNetwork();
  }, []);

  const rows = devices.map(
    (device, i) =>
      device.ip && (
        <tr key={device.ip + devices.length} style={{ height: "3rem" }}>
          <td>{device.new ? <Indicator>{device.ip}</Indicator> : device.ip}</td>
          <td>
            <TextInput
              width={"75px"}
              type="string"
              value={devices[i].name}
              onChange={(e) => {
                setDevices((old) => {
                  old[i].name = e.target.value;
                  return [...old];
                });
              }}
            ></TextInput>{" "}
          </td>
          <td>{IdentifyColors[i].name}</td>

          <td>
            <TextInput
              width={"75px"}
              type="number"
              value={devices[i].neoPixelCount}
              onChange={(e) => {
                setDevices((old) => {
                  old[i].neoPixelCount = e.target.value;
                  return [...old];
                });
              }}
            ></TextInput>
          </td>
        </tr>
      )
  );

  return (
    <React.Fragment>
      <Modal
        centered
        size={"xl"}
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Scan Network"
      >
        <Table sx={{ marginBottom: "1.5rem" }}>
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
        <Button
          sx={{ float: "right" }}
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
        <Button
          sx={{ float: "right", marginRight: "0.5rem" }}
          leftIcon={<IconFocus2></IconFocus2>}
          onClick={() => {
            sendIdentifyColor();
          }}
        >
          Send Identify Color
        </Button>
      </Modal>
      <Indicator
        dot={scanning}
        label={newDevices}
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
