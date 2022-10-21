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

interface scanNetworkModalProps {
  form: any;
  setDevices: Dispatch<SetStateAction<any[]>>;
  devices: any[];
}

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
        console.log(
          "🚀 ~ file: scanNetworkModal.tsx ~ line 50 ~ old.findIndex ~ old.ip",
          old.ip,
          newD.ip
        );

        return old.ip === newD.ip;
      });
      if (
        old.findIndex((old, index, array) => {
          console.log(
            "🚀 ~ file: scanNetworkModal.tsx ~ line 50 ~ old.findIndex ~ old.ip",
            old.ip,
            newD.ip
          );

          return old.ip === newD.ip;
        }) === -1
      ) {
        newD.new = true;
        setDevices((old) => [...old, newD]);
        setNewDevices((old) => old + 1);
      }
    });
  }

  useEffect(() => {
    scanNetwork();
  }, []);

  const rows = devices.map((device, i) => (
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
      <td>red</td>

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
  ));

  return (
    <React.Fragment>
      <Modal
        centered
        size={"lg"}
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
