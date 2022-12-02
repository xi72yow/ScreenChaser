import {
  ActionIcon,
  Box,
  Button,
  Group,
  Indicator,
  Loader,
  Modal,
  Text,
  NativeSelect,
  NumberInput,
  PasswordInput,
  Popover,
  SegmentedControl,
  Select,
  Table,
  TextInput,
  Divider,
  useMantineTheme,
  Transition,
  ColorSwatch,
  Tooltip,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import {
  IconRefresh,
  IconFocus2,
  IconAccessPoint,
  IconSend,
  IconEditCircle,
} from "@tabler/icons";
import React, { useEffect, useRef, useState } from "react";
import { DataEmitter } from "screenchaser-core";
import { setAll } from "screenchaser-core";
import { showNotification } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { addConfig, db, updateConfig } from "../database/db";
import { ipcRenderer } from "electron";
import { useForm } from "@mantine/form";
import { setTimeout } from "timers";
import NetworkForm from "./chaserSettingsModalComponents/networkForm";
import DeviceForm from "./chaserSettingsModalComponents/deviceForm";
import OverviewTable from "./chaserSettingsModalComponents/overviewTable";

interface scanNetworkModalProps {}

export default function ScanNetworkModal({}: scanNetworkModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const initialScan = useRef(true);
  const [scanning, setScanning] = useState(false);

  const configs = useLiveQuery(async () => {
    return await db.configs.toArray();
  }, []);

  function scanNetwork() {
    setScanning(true);
    const DataEmitterForIP = new DataEmitter(false);
    DataEmitterForIP.init()
      .then((value) => {
        const detectedDevices = DataEmitterForIP.getSlaves();
        checkForNewDevices(
          configs.map((conf) => conf.device),
          detectedDevices
        );
        setScanning(false);
      })
      .catch((err) => {
        console.log(err);
        showNotification({
          title: "Chaser Error",
          message: "Error while scanning network: " + err,
          color: "red",
        });
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

  useEffect(() => {
    if (configs && initialScan.current) {
      scanNetwork();
      initialScan.current = false;
    }
  }, [configs]);

  if (configs === undefined) {
    return <div>Loading...</div>;
  }

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
            { value: "network", label: "Network" },
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
          {selectedTab === "network" && (
            <NetworkForm configs={configs}></NetworkForm>
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
