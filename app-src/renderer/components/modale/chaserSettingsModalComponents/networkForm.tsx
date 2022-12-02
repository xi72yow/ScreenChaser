import {
  Select,
  ActionIcon,
  TextInput,
  Text,
  PasswordInput,
  Button,
  Divider,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconDeviceFloppy, IconRefresh, IconSend } from "@tabler/icons";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { updateConfig } from "../../database/db";

type Props = {
  configs: any;
};

export default function NetworkForm({ configs }: Props) {
  const [selectedDevice, setSelectedDevice] = useState("0");

  const form = useForm({
    initialValues: {
      name: configs[0].device.name || configs[0].device.name,
      neoPixelCount: configs[0].device.neoPixelCount,
    },
    validate: (values) => ({
      neoPixelCount:
        parseInt(values.neoPixelCount) < 1
          ? "Must be greater than 0"
          : parseInt(values.neoPixelCount) > 780
          ? "Must be less than 780"
          : null,
    }),
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        const { neoPixelCount, name } = values;
        const index = parseInt(selectedDevice);
        console.log(configs[index], index, values);
        updateConfig(index + 1, {
          device: {
            ...configs[index].device,
            name,
            neoPixelCount,
            new: false,
          },
        }).then(() => {
          showNotification({
            title: "Saved",
            message: "Saved device settings for " + configs[index].device.ip,
            color: "teal",
            icon: <IconDeviceFloppy />,
          });
        });
      })}
    >
      <Select
        label="Device"
        value={selectedDevice}
        onChange={(value) => {
          const index = parseInt(value);
          setSelectedDevice(value);
          form.setFieldValue("name", configs[index].device.name);
          form.setFieldValue(
            "neoPixelCount",
            configs[index].device.neoPixelCount
          );
        }}
        data={configs.map((value, index, array) => {
          return {
            value: index.toString(),
            label: value.device.ip,
          };
        })}
      />

      <TextInput
        placeholder="Stripe Desk"
        label="Device Name"
        {...form.getInputProps("name")}
      />
      <NumberInput
        label="NeoPixel Count"
        {...form.getInputProps("neoPixelCount")}
      />
      <Button
        type="submit"
        sx={{ float: "right", marginTop: "1.5rem", marginBottom: "0.5rem" }}
        leftIcon={<IconDeviceFloppy></IconDeviceFloppy>}
      >
        Save
      </Button>
    </form>
  );
}
