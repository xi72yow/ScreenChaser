import {
  Select,
  ActionIcon,
  TextInput,
  PasswordInput,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconRefresh, IconSend } from "@tabler/icons";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";

type Props = {};

export default function DeviceForm({}: Props) {
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
  return (
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
        sx={{ float: "right", marginTop: "1.5rem", marginBottom: "0.5rem" }}
        leftIcon={<IconSend></IconSend>}
      >
        Send Credentials
      </Button>
    </form>
  );
}
