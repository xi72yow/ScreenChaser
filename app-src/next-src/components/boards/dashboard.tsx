import {
  Badge,
  Box,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Skeleton,
  Text,
  Tooltip,
  createStyles,
} from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBolt,
  IconInfoCircle,
  IconSettings,
} from "@tabler/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "../database/db";
import ActionIcon from "../forms/helpers/actionIcon";
import { GraphCanvas } from "./graphCanvas";

const useStyles = createStyles((theme) => ({
  root: {
    padding: theme.spacing.xl * 1.5,
  },
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    alignContent: "center",
    padding: `6px ${theme.spacing.xs}px`,
    margin: "0.5rem",
    borderRadius: theme.radius.sm,
    border: `1px solid ${
      theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,

    "&:focus-within": {
      borderColor: theme.colors[theme.primaryColor][6],
    },
    "&:hover": {
      borderColor: theme.colors[theme.primaryColor][6],
      cursor: "pointer",
    },
  },

  value: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1,
  },

  diff: {
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  },

  icon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  title: {
    fontWeight: 800,
    fontSize: 20,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 14,
    color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.black,
  },
}));

interface DashboardProps {}

function QuickConfigModal({ deviceId, opened, setOpened }) {
  const configs = useLiveQuery(() => db.configs.toArray(), []);
  const { classes } = useStyles();

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title="Quick Config"
      size="xl"
      centered
    >
      <Group position="apart">
        <Text size="sm" weight={500}>
          Select a config:
        </Text>
      </Group>
      <SimpleGrid cols={2}>
        {configs?.map((config) => (
          <Box
            key={config.id + "config_quick_modal"}
            className={classes.wrapper}
            onClick={() => {
              db.devices
                .where("id")
                .equals(deviceId)
                .modify({ configId: config.id });
              setOpened(false);
            }}
          >
            <Text size="xs" weight={600}>
              {config.name}
            </Text>
            <Badge color="teal" size="sm">
              <Text size="xs" weight={600}>
                {config.taskCode}
              </Text>
            </Badge>
          </Box>
        ))}
      </SimpleGrid>
    </Modal>
  );
}

function DeviceCard({ dashBoardData, device }) {
  const { classes } = useStyles();

  const [opened, setOpened] = useState(false);
  const [modalDeviceId, setModalDeviceId] = useState<number>(0);

  const powerColor = "#339af0";

  const [deviceData, setDeviceData] = useState<{
    details: any;
    title: string;
    task: string;
  }>({ details: { power: null }, title: "", task: "" });

  useEffect(() => {
    setDeviceData({
      ...dashBoardData.find((data) => data.deviceId === device.id),
    });
  }, [dashBoardData]);

  const DiffPowerIcon =
    deviceData.details?.power?.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

  return (
    <>
      <QuickConfigModal
        deviceId={modalDeviceId}
        opened={opened}
        setOpened={setOpened}
      />
      <Paper withBorder p="md" radius="md" key={device.id + "dash"}>
        <Group position="apart">
          <Group>
            <Text size="xs" color="dimmed" className={classes.title}>
              {device.name || device.ip}
            </Text>
            {deviceData.details && (
              <Badge color={deviceData.task ? "lime" : "grape"} size="sm">
                {deviceData.task || "nothing to do"}
              </Badge>
            )}
          </Group>
          <ActionIcon
            onClick={() => {
              setModalDeviceId(device.id);
              setOpened(true);
            }}
            tooltip="Quick Config"
          >
            <IconSettings size={22} stroke={1.5} />
          </ActionIcon>
        </Group>
        <SimpleGrid cols={2}>
          {deviceData.details ? (
            <>
              <Group>
                <Badge
                  variant="outline"
                  p={15}
                  color={powerColor}
                  leftSection={
                    <Group position="center">
                      <IconBolt></IconBolt>
                    </Group>
                  }
                >
                  <Group position="left">
                    <Text className={classes.value}>
                      {deviceData.details?.power?.value?.toFixed(2) || "0.00"}
                      {"W"}
                    </Text>
                    <Text
                      color={
                        deviceData.details?.power?.diff > 0 ? "red" : "teal"
                      }
                      size="sm"
                      weight={500}
                      className={classes.diff}
                    >
                      {
                        <span>
                          {deviceData.details?.power?.diff?.toFixed(2)}%
                        </span>
                      }
                      <DiffPowerIcon size={16} stroke={1.5} />
                    </Text>
                    <Tooltip label="current power consumption">
                      <Group position="center">
                        <IconInfoCircle size={15}></IconInfoCircle>
                      </Group>
                    </Tooltip>
                  </Group>
                </Badge>
              </Group>
              <Group>
                <GraphCanvas stat={deviceData.details.power} />
              </Group>
            </>
          ) : (
            <>
              <Group>
                <Skeleton height={25} width="80%" radius="xl" />
                <Skeleton height={25} width="80%" radius="xl" />
              </Group>
              <Group>
                <Skeleton height={110} width={300} radius="md" />
              </Group>
            </>
          )}
        </SimpleGrid>
      </Paper>
    </>
  );
}

export default function Dashboard({}: DashboardProps) {
  const [dashBoardData, setDashboardData] = useState<
    { details: any; title: string; task: string }[]
  >([]);

  const interval = useInterval(() => {
    global.ipcRenderer.invoke("GET_STATS").then((dashboardData) => {
      setDashboardData(dashboardData);
    });
  }, 3000);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  const devices = useLiveQuery(() => db.devices.toArray(), []);

  return (
    <SimpleGrid cols={2}>
      {devices?.map((device) => (
        <DeviceCard
          dashBoardData={dashBoardData}
          device={device}
          key={device.id}
        />
      ))}
    </SimpleGrid>
  );
}