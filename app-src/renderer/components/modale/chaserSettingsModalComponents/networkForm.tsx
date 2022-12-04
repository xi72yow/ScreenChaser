import {
  Button,
  NumberInput,
  Select,
  Switch,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconDeviceFloppy, IconX } from "@tabler/icons";
import { useState } from "react";
import { updateConfig } from "../../database/db";

type Props = {
  configs: any;
};

export default function NetworkForm({ configs }: Props) {
  const [selectedDevice, setSelectedDevice] = useState("0");
  const theme = useMantineTheme();

  const form = useForm({
    initialValues: {
      name: configs[0].device.name || configs[0].device.name,
      neoPixelCount: configs[0].device.neoPixelCount,
      exclude: configs[0].device.exclude,
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
        const { neoPixelCount, name, exclude } = values;
        const index = parseInt(selectedDevice);
        console.log(configs[index], index, values);
        updateConfig(index + 1, {
          device: {
            ...configs[index].device,
            name,
            neoPixelCount,
            new: false,
            exclude,
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
          form.setFieldValue("exclude", configs[index].device.exclude);
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
        type="number"
      />
      <Switch
        checked={!form.values.exclude}
        onChange={(elem) => {
          form.setFieldValue("exclude", !elem.target.checked);
        }}
        color="teal"
        size="md"
        label="Control this Chaser?"
        thumbIcon={
          !form.values.exclude ? (
            <IconCheck
              size={12}
              color={theme.colors.teal[theme.fn.primaryShade()]}
              stroke={3}
            />
          ) : (
            <IconX
              size={12}
              color={theme.colors.red[theme.fn.primaryShade()]}
              stroke={3}
            />
          )
        }
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
