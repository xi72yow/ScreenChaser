import { Button, Footer, Group } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconBulb, IconInfoCircle } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  DeviceTableInterface,
  updateElementInTable,
  TableNames,
  TaskTableInterface,
  TaskCodes,
  dbBool,
  addElementToTable,
} from "../database/db";
import useStyles from "../styles/styles";
import GlobalSettings from "./globalSettings";

type ToolbarProps = {
  data: any;
  selectedTaskId: number;
  selectedDeviceId: number;
  selectedConfigId: number;
};

export default function Toolbar({
  selectedTaskId,
  selectedDeviceId,
  selectedConfigId,
  data,
}: ToolbarProps) {
  const { classes } = useStyles();

  const currentDevice: DeviceTableInterface = useLiveQuery(
    async () => {
      return await db.devices.get(selectedDeviceId);
    },
    [selectedDeviceId],
    null
  );

  const currentTask: TaskTableInterface = useLiveQuery(
    async () => {
      return await db.tasks.get(selectedTaskId);
    },
    [selectedTaskId],
    null
  );

  return (
    <Footer
      height={70}
      className={classes.footer}
      sx={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Group
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "1rem",
        }}
      >
        <GlobalSettings></GlobalSettings>
      </Group>
      <Group
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "1rem",
        }}
      >
        <Group>
          {currentTask?.taskCode !== TaskCodes.dashboard &&
            currentTask?.taskCode !== TaskCodes.library && (
              <Button
                disabled={!currentDevice || selectedConfigId === -1}
                onClick={() => {
                  console.log("🚀 ~ file: toolbar.tsx:86 ~ data:", data);

                  updateElementInTable(TableNames.devices, selectedDeviceId, {
                    configId: selectedConfigId,
                  });

                  updateElementInTable(TableNames.configs, selectedConfigId, {
                    config: data,
                  });

                  if (currentDevice.exclude === dbBool.true)
                    showNotification({
                      title: "Saved Configuration",
                      message:
                        "Saved device settings for " +
                        currentDevice.ip +
                        ". This device is excluded from the task. To include it, see Network Tab in settings.",
                      color: "teal",
                      icon: <IconInfoCircle />,
                    });
                  else
                    showNotification({
                      title: "Changed task",
                      message:
                        "Changing Config for " +
                        currentTask.taskCode +
                        " on Device " +
                        currentDevice.ip,
                    });
                }}
                leftIcon={<IconBulb size={14} />}
              >
                Lights On and Save
              </Button>
            )}
        </Group>
      </Group>
    </Footer>
  );
}
