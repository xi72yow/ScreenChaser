import {
  Box,
  Button,
  Group,
  Modal,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import {
  IconSettingsAutomation,
  IconSquare,
  IconSquareCheck,
  IconSquareX,
  IconTrash,
} from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useState } from "react";
import {
  TableNames,
  TaskTableInterface,
  addElementToTable,
  db,
} from "../../database/db";
import { showNotification } from "@mantine/notifications";
import { useStyles } from "./inputStyles";
import ActionIcon from "../helpers/actionIcon";
import { useConfirm } from "../../hooks/confirm";

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
  const [name, setName] = useState("");

  const confirm = useConfirm();

  const configs = useLiveQuery(
    async () => {
      return await db.configs
        .filter(
          ({ name: databasName, taskId }) =>
            databasName.includes(name) && selectedTaskId === taskId
        )
        .toArray();
    },
    [name, selectedTaskId],
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
    setName("");
  }, [selectedConfigId]);

  useEffect(() => {
    db.configs.get(selectedConfigId).then((config) => {
      if (config) setData({ ...config.config });
    });
  }, [currentConfig]);

  useEffect(() => {
    db.devices
      .get(selectedDeviceId)
      .then((device) => {
        if (device) {
          db.configs
            .get(device.configId)
            .then((config) => {
              if (config)
                if (config.taskId === selectedTaskId) {
                  setData({ ...config.config });
                  setSelectedConfigId(device.configId);
                } else {
                  setSelectedConfigId(-1);
                }
            })
            .catch(() => null);
        }
      })
      .catch(() => null);
  }, [selectedDeviceId, selectedTaskId]);

  const theme = useMantineTheme();

  const { classes } = useStyles();

  return (
    <React.Fragment>
      <Modal
        centered
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Choose a ${currentTask?.taskCode} Configuration`}
      >
        <TextInput
          classNames={{ input: classes.input }}
          label="Configuration-Name"
          placeholder="Enter a name for the configuration"
          required
          rightSection={
            <ActionIcon
              disabled={name === ""}
              onClick={() => {
                setName("");
              }}
            >
              <IconSquareX size={18} stroke={1.5} />
            </ActionIcon>
          }
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        ></TextInput>

        <Text
          sx={{
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            margin: "0.5rem 0",
            alignContent: "center",
            textAlign: "center",
          }}
        >
          {configs.length === 0
            ? "No Configurations found"
            : "Choose a Configuration"}
        </Text>

        {configs.map(({ name: configName, id, deviceId }) => (
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

              borderColor:
                selectedConfigId === id
                  ? theme.colors.blue[5]
                  : deviceId === selectedDeviceId
                  ? theme.colors.green[7]
                  : "transparent",
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[5]
                  : theme.white,
              height: 42,
              borderRadius: theme.radius.sm,
              justifyContent: "space-between",
            }}
          >
            <ActionIcon
              tooltip={selectedConfigId === id ? "selected" : "select"}
              disabled={selectedConfigId === id}
              onClick={() => {
                if (selectedConfigId === id) return;
                setSelectedConfigId(id);
                setOpened(false);
                setName(configName);
              }}
            >
              {selectedConfigId === id ? (
                <IconSquareCheck size={20} stroke={1.5} />
              ) : (
                <IconSquare size={20} stroke={1.5} />
              )}
            </ActionIcon>
            {configName}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ActionIcon
                tooltip="Delete Configuration"
                onClick={() => {
                  confirm
                    .showConfirmation(
                      "Are you sure you want to delete this configuration? This action cannot be undone.",
                      true
                    )
                    .then((ans) => {
                      if (ans) {
                        if (selectedConfigId === id) {
                          setSelectedConfigId(-1);
                        }
                        db.configs.delete(id);
                        showNotification({
                          message: "Configuration deleted",
                          color: "red",
                        });
                      }
                    });
                }}
              >
                <IconTrash size={20} stroke={1.5} />{" "}
              </ActionIcon>
            </Box>
          </Group>
        ))}

        <Button
          onClick={() => {
            if (name === "")
              showNotification({
                message: "Name cannot be empty",
                color: "red",
              });
            else
              addElementToTable(TableNames.configs, {
                name: name,
                deviceId: selectedDeviceId,
                taskId: selectedTaskId,
                taskCode: currentTask.taskCode,
                config: { ...data },
              }).then((id) => {
                setSelectedConfigId(id);
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
        {currentConfig?.name ? currentConfig?.name : "Choose a Configuration"}
        <ActionIcon
          tooltip="Choose a Configuration"
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
