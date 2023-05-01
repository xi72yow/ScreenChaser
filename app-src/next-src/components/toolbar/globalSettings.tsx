import {
  ActionIcon,
  Group,
  Menu,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconFileDownload,
  IconFileUpload,
  IconHelp,
  IconMoonStars,
  IconPlayerPlay,
  IconPower,
  IconSettings,
  IconSun,
  IconTrash,
} from "@tabler/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, deleteAllDatabases } from "../database/db";
import { isConfigInterface } from "../database/db.guard";
import { useConfirm } from "../hooks/confirm";
import HelpModal from "../modale/helpModal";

type Props = {};

export default function GlobalSettings({}: Props) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const [open, setOpen] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);

  const confirm = useConfirm();

  return (
    <Group position="center" my="xl" sx={{ paddingLeft: theme.spacing.md }}>
      <HelpModal open={open} setOpen={setOpen}></HelpModal>
      <Tooltip label={lightsOff ? "Lights On" : "Lights Off"}>
        <ActionIcon
          onClick={() => {
            setLightsOff((bool) => {
              return !bool;
            });

            showNotification({
              title: "Chaser Notification",
              message: lightsOff
                ? "The Chasers continues to work."
                : "Signal to turn off the device has been sent. ",
              color: lightsOff ? "green" : "red",
              icon: lightsOff ? (
                <IconPlayerPlay size={18} />
              ) : (
                <IconPower size={18} />
              ),
              sx: { cursor: "pointer" },
            });
            global.ipcRenderer.send(`LIGHTS:${lightsOff ? "ON" : "OFF"}`);
          }}
          size="lg"
          sx={(theme) => ({
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
            color: lightsOff ? theme.colors.green[5] : theme.colors.red[5],
          })}
        >
          {lightsOff ? <IconPlayerPlay size={18} /> : <IconPower size={18} />}
        </ActionIcon>
      </Tooltip>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Tooltip label="Settings">
            <ActionIcon
              size="lg"
              sx={(theme) => ({
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[0],
                color:
                  theme.colorScheme === "dark"
                    ? theme.colors.gray[3]
                    : theme.colors.gray[9],
              })}
            >
              <IconSettings size={18} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown
          ml={8}
          sx={{
            backgroundColor:
              colorScheme === "dark"
                ? theme.colors.dark[5]
                : theme.colors.gray[2],
          }}
        >
          <Menu.Label>Application</Menu.Label>
          <Menu.Item
            icon={
              colorScheme === "dark" ? (
                <IconSun size={18} />
              ) : (
                <IconMoonStars size={18} />
              )
            }
            color={
              theme.colorScheme === "dark"
                ? theme.colors.yellow[4]
                : theme.colors.blue[6]
            }
            onClick={() => toggleColorScheme()}
          >
            Toggle Theme
          </Menu.Item>
          <Menu.Item
            icon={<IconHelp size={18} />}
            onClick={() => {
              setOpen(true);
            }}
          >
            FAQ
          </Menu.Item>
          {/* <Menu.Divider />
          <Menu.Label>Configuration</Menu.Label>
          <Menu.Item
            icon={<IconFileDownload size={18} />}
            onClick={() => {
              ipcRenderer.invoke("APP:SAVE_CONFIG", configs).then((res) => {
                showNotification({
                  title: "Chaser Notification",
                  message: "Saving Configuration has been " + res + ".",
                });
              });
            }}
          >
            Save
          </Menu.Item>
          <Menu.Item
            icon={<IconFileUpload size={18} />}
            onClick={() => {
              ipcRenderer.invoke("APP:LOAD_CONFIG", configs).then((res) => {
                let corruptConfig = false;
                if (!Array.isArray(res)) {
                  showNotification({
                    title: "Chaser Error",
                    message:
                      "Loading Configuration has been failed. The file is corrupted.",
                    color: "red",
                  });
                  return;
                }

                res.forEach((value) => {
                  console.log(isConfigInterface(value));
                  if (!isConfigInterface(value)) {
                    corruptConfig = true;
                    showNotification({
                      title: "Chaser Error",
                      message: `Loading Configuration has been failed. Configuration of ${value?.device?.ip} is corrupt.`,
                      color: "yallow",
                    });
                  }
                });

                if (!corruptConfig) {
                  confirm
                    .showConfirmation(
                      "Are you sure you want to load this configuration? This will overwrite your current configuration.",
                      true
                    )
                    .then((ans) => {
                      if (ans) {
                        db.configs.clear();
                        db.configs.bulkAdd(res);
                        showNotification({
                          title: "Chaser Notification",
                          message: "Configuration has been loaded.",
                        });
                      }
                    });
                }
              });
            }}
          >
            Load
          </Menu.Item> */}
          <Menu.Divider />
          <Menu.Label>Danger zone</Menu.Label>
          <Menu.Item
            color="red"
            icon={<IconTrash size={18} />}
            onClick={() => {
              confirm
                .showConfirmation(
                  "Are you sure you want to delete all configurations?",
                  true
                )
                .then(async (res) => {
                  if (res) {
                    await deleteAllDatabases();
                    location.reload();
                  }
                });
            }}
          >
            Delete Configurations
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
