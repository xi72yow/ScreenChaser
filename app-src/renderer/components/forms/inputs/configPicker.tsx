import {
    ActionIcon,
    Button,
    Group,
    Modal,
    Text,
    TextInput,
    useMantineTheme
} from "@mantine/core";
import { IconSettingsAutomation, IconTrash } from "@tabler/icons";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useState } from "react";
import {
    TableNames,
    TaskTableInterface,
    addElementToTable,
    db,
} from "../../database/db";

type Props = {
  selectedDeviceId: number;
  selectedTaskId: number;
  data: any;
  setData: (data: any) => void;
  selectedConfigId: number;
  setSelectedConfigId: (id: number) => void;
};

export default function ConfigPicker({
  selectedDeviceId,
  selectedTaskId,
  data,
  setData,
  selectedConfigId,
  setSelectedConfigId,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const configs = useLiveQuery(
    async () => {
      return await db.configs
        .filter(({ name: databasName }) => databasName.includes(name))
        .toArray();
    },
    [name],
    []
  );

  const currentTask: TaskTableInterface = useLiveQuery(
    async () => {
      return await db.tasks.get(selectedTaskId);
    },
    [selectedTaskId],
    null
  );

  const currentConfig = useLiveQuery(
    async () => {
      return await db.configs.get(selectedConfigId);
    },
    [selectedConfigId],
    null
  );

  useEffect(() => {
    if (currentConfig) {
      console.log(
        "🚀 ~ file: configPicker.tsx:67 ~ useEffect ~ currentConfig:",
        currentConfig
      );
      setData((prev) => {
        return { ...prev, ...currentConfig.config };
      });
    }
  }, [currentConfig]);

  const theme = useMantineTheme();

  return (
    <React.Fragment>
      <Modal
        centered
        opened={opened}
        onClose={() => setOpened(false)}
        title={"Choose a Configuration"}
      >
        <TextInput
          label="Configuration-Name"
          placeholder="Enter a name for the configuration"
          required
          rightSection={
            <ActionIcon
              onClick={() => {
                setName("");
              }}
            >
              <IconTrash size={18} stroke={1.5} />
            </ActionIcon>
          }
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        ></TextInput>
        {configs.length === 0 && (
          <Text
            sx={{
              fontSize: theme.fontSizes.sm,
              fontWeight: 500,
              margin: "0.5rem 0",
              alignContent: "center",
              textAlign: "center",
            }}
          >
            No Configurations found
          </Text>
        )}

        {configs.map(({ name: configName, id }) => (
          <Group
            key={id + "-configPickerModal"}
            sx={{
              padding: `6px ${theme.spacing.sm}px !important`,
              margin: "0.5rem 0",
              border: `1px solid ${
                theme.colorScheme === "dark"
                  ? "transparent"
                  : theme.colors.gray[3]
              }`,
              ":hover": {
                borderColor: theme.colors.blue[5],
              },
              cursor: "pointer",
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[5]
                  : theme.white,
              height: 42,
              borderRadius: theme.radius.sm,
              justifyContent: "space-between",
            }}
            onClick={() => {
              setSelectedConfigId(id);
              setOpened(false);
              setName(configName);
            }}
          >
            {configName}
            <IconSettingsAutomation size={18} stroke={1.5} />
          </Group>
        ))}

        <Button
          onClick={() => {
            addElementToTable(TableNames.configs, {
              name: name,
              deviceId: selectedDeviceId,
              taskId: selectedTaskId,
              taskCode: currentTask.taskCode,
              config: { ...data },
            }).then((value) => {
              console.log("🚀 ~ file: configPicker.tsx:129 ~ value:", value);
              setSelectedConfigId(value);
              setOpened(false);
            });
          }}
          fullWidth
        >
          create new
        </Button>
      </Modal>
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 500,
          margin: "0.1rem",
        }}
      >
        Configuration
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
        {name === "" ? "Choose a Configuration" : name}
        <ActionIcon
          loading={loading}
          onClick={() => {
            setOpened(true);
          }}
        >
          <IconSettingsAutomation size={18} stroke={1.5} />
        </ActionIcon>
      </Group>
    </React.Fragment>
  );
}
