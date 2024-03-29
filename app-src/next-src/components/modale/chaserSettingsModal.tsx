import {
  ActionIcon,
  Box,
  Indicator,
  Modal,
  SegmentedControl,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconAccessPoint } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { TableNames, addElementToTable, db, dbBool } from "../database/db";
import DeviceForm from "./chaserSettingsModalComponents/deviceForm";
import OverviewTable from "./chaserSettingsModalComponents/overviewTable";

interface scanNetworkModalProps {}

export default function ScanNetworkModal({}: scanNetworkModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [scanning, setScanning] = useState(false);

  const configs = useLiveQuery(
    async () => {
      return await db.configs.toArray();
    },
    null,
    []
  );

  const devices = useLiveQuery(
    async () => {
      return await db.devices.toArray();
    },
    null,
    undefined
  );

  const newDevicesCount = useLiveQuery(
    async () => {
      return await db.devices.where("new").equals(dbBool.true).count();
    },
    null,
    0
  );

  function scanNetwork() {
    setScanning(true);
    global.ipcRenderer
      .invoke("SCAN_NETWORK")
      .then((detectedDevices) => {
        if (typeof detectedDevices !== "object") {
          showNotification({
            title: "Chaser Notification",
            message: `Error while scanning network: ${detectedDevices}`,
          });
          setScanning(false);
          return;
        }
        checkForNewDevices(devices, detectedDevices);
        setScanning(false);
      })
      .catch((err) => {
        showNotification({
          color: "red",
          title: "Chaser Notification",
          message: `Error while scanning network: ${err}`,
        });
        setScanning(false);
      });
  }

  function checkForNewDevices(old, newDevices): void {
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
        newD.new = dbBool.true;
        newD.exclude = dbBool.false;
        delete newD.port;
        newD.name = "";
        newD.neoPixelCount = 60;
        newConfigs.push({ device: { ...newD } });

        addElementToTable(TableNames.devices, { ...newD }).then((value) => {
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

  /* const firstUpdate = useRef(true);

  useEffect(() => {
    if (devices) return;
    if (firstUpdate.current) {
      scanNetwork();
      firstUpdate.current = false;
    }
  }, [devices]); */

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
            { value: "overview", label: "Overview" },
            { value: "credentials", label: "Hardware" },
          ]}
        />
        <Box sx={{ marginTop: "1rem" }}>
          {selectedTab === "overview" && (
            <OverviewTable
              configs={configs}
              scanning={scanning}
              scanNetwork={scanNetwork}
              setScanning={setScanning}
            />
          )}
          {selectedTab === "credentials" && <DeviceForm></DeviceForm>}
        </Box>
      </Modal>
      <Indicator
        dot={scanning}
        label={newDevicesCount}
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
