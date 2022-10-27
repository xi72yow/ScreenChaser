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
import React, { useEffect, useRef, useState } from "react";
import DataEmitter from "../effects_build/network/dataEmitter.js";
import setAll from "../effects_build/basics/setAll.js";
import { showNotification } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { addConfig, db, updateConfig } from "../database/db";

interface scanNetworkModalProps {
  selectedDevice: any;
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
              updateConfig(i + 1, {
                device: {
                  ...configs[i].device,
                  neoPixelCount: parseInt(e.currentTarget.value) || "",
                },
              });
            }}
          ></TextInput>
        </td>
      </tr>
    )
  );
}

export default function ScanNetworkModal({
  selectedDevice,
}: scanNetworkModalProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newDevices, setNewDevices] = useState(0);
  const initialScan = useRef(true);

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

        addConfig({ device: { ...newD } }).then((value) => {
          setNewDevices((old) => old + 1);
          showNotification({
            title: "Chaser Notification",
            message: `I found a new device: ${newD.ip}`,
          });
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
    configs.forEach(({ device }, index, array) => {
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
