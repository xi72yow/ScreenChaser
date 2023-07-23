import React, { useContext, useState } from "react";
import { withJsonFormsControlProps } from "@jsonforms/react";
import {
  useMantineTheme,
  Group,
  Text,
  Modal,
  JsonInput,
  NumberInput,
  SimpleGrid,
  Checkbox,
  Button,
  Divider,
  Collapse,
} from "@mantine/core";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../database/db";
import { FormContext } from "../formContext";
import {
  LedField,
  generateLedFields,
} from "screenchaser-core/dist/bias/ledFields";
import { useJsonForms } from "@jsonforms/react";
import ActionIcon from "../helpers/actionIcon";
import { IconLayoutCards } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

type Props = {
  path: string;
  data: LedField[];
  schema: any;
  label: string;
  handleChange: (path, data: LedField[]) => void;
};

export function LedFields({ data, path, handleChange, label, schema }: Props) {
  console.log("🚀 ~ file: ledFields.tsx:21 ~ LedFields ~ data:", data);
  const ctx = useJsonForms();

  const form = useForm({
    initialValues: {
      ledsX: 114,
      ledsY: 0,
      startLed: 0,
      fieldWidth: 10,
      fieldHeight: 10,
      top: false,
      bottom: true,
      left: false,
      right: false,
      clockwise: false,
    },
  });

  const wholeDataObject = ctx.core.data;

  console.log(
    "🚀 ~ file: ledFields.tsx:26 ~ LedFields ~ wholeDataObject:",
    wholeDataObject
  );

  const [opened, setOpened] = useState(false);

  const [generatorOpen, { toggle }] = useDisclosure(false);

  const [ledFields, setLedFields] = useState<string>(
    JSON.stringify(data, null, 2)
  );

  const theme = useMantineTheme();

  const { selectedDeviceId, selectedConfigId } = useContext(FormContext);

  const currentNeoPixelCount = useLiveQuery(
    async () => {
      if (!selectedDeviceId) return null;
      const device = await db.devices.get(selectedDeviceId);
      return parseInt(device?.neoPixelCount as unknown as string);
    },
    [selectedDeviceId],
    null
  );

  return (
    <React.Fragment>
      <Modal
        centered
        opened={opened}
        size={"xl"}
        onClose={() => setOpened(false)}
        title={`Edit LED Fields`}
      >
        <Button
          mb={theme.spacing.xs}
          color="gray"
          variant="outline"
          fullWidth
          size="xs"
          onClick={toggle}
        >
          Genrator
        </Button>
        <Collapse in={generatorOpen}>
          <form
            onSubmit={form.onSubmit((values) => {
              const generatedLedFields = generateLedFields(values);
              setLedFields(JSON.stringify(generatedLedFields, null, 2));
            })}
          >
            <SimpleGrid cols={3}>
              <NumberInput
                label="LEDs X"
                min={0}
                {...form.getInputProps("ledsX")}
              />
              <NumberInput
                label="LEDs Y"
                min={0}
                {...form.getInputProps("ledsY")}
              />
              <NumberInput
                label="Start LED"
                min={0}
                {...form.getInputProps("startLed")}
              />
              <NumberInput
                min={0}
                max={100}
                label="Field Width (in %)"
                {...form.getInputProps("fieldWidth")}
              />
              <NumberInput
                min={0}
                max={100}
                label="Field Height (in %)"
                {...form.getInputProps("fieldHeight")}
              />

              <Group></Group>

              <Checkbox
                label="Top Screen LEDs"
                {...form.getInputProps("top", { type: "checkbox" })}
              />
              <Checkbox
                label="Bottom Screen LEDs"
                {...form.getInputProps("bottom", { type: "checkbox" })}
              />
              <Checkbox
                label="Left Screen LEDs"
                {...form.getInputProps("left", { type: "checkbox" })}
              />
              <Checkbox
                label="Right Screen LEDs"
                {...form.getInputProps("right", { type: "checkbox" })}
              />
              <Checkbox
                label="Clockwise"
                {...form.getInputProps("clockwise", { type: "checkbox" })}
              />
              <Button variant="outline" size="xs" type="submit">
                Genrate
              </Button>
            </SimpleGrid>
          </form>
        </Collapse>

        <JsonInput
          pt={theme.spacing.md}
          spellCheck={false}
          placeholder="[]"
          label="Actual LED Fields"
          radius="md"
          maxRows={30}
          minRows={7}
          value={ledFields}
          onChange={(value) => {
            setLedFields(value);
          }}
        />

        <Group position="right" pt={theme.spacing.sm}>
          <Group>
            <Button
              onClick={() => {
                try {
                  handleChange(path, JSON.parse(ledFields));
                  setOpened(false);
                } catch (e) {
                  showNotification({
                    title: "Error",
                    message: "Invalid JSON",
                    color: "red",
                  });
                }
              }}
            >
              Take Over
            </Button>
          </Group>
        </Group>
      </Modal>
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 500,
          marginTop: "0.1rem",
        }}
      >
        {label}
      </Text>
      <Group
        sx={{
          paddingRight: `${theme.spacing.sm}px !important`,
          paddingLeft: `${theme.spacing.sm}px !important`,
          border: `1px solid ${
            theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
          }`,
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
          height: 42,
          borderRadius: theme.radius.sm,
          justifyContent: "space-between",
        }}
      >
        {data.length.toString()} LED Fields
        <ActionIcon
          tooltip="Edit LED Fields"
          onClick={() => {
            setOpened(true);
          }}
        >
          <IconLayoutCards size={20} stroke={1.5} />
        </ActionIcon>
      </Group>
    </React.Fragment>
  );
}

export default withJsonFormsControlProps(LedFields);
