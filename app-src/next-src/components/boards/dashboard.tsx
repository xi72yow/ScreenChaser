import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  createStyles,
} from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconSettings,
} from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { TableNames, db, deleteElementFromTable } from "../database/db";
import ActionIcon from "../forms/helpers/actionIcon";
import { useConfirm } from "../hooks/confirm";

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

  const confirm = useConfirm();

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
      <Group position="right">
        <Button
          onClick={() => {
            confirm
              .showConfirmation(
                "Are you sure you want to delete the current Frame?",
                true
              )
              .then((confirmed) => {
                if (!confirmed) return;
                deleteElementFromTable(TableNames.devices, deviceId);
                setOpened(false);
              });
          }}
          color="red"
        >
          Delete Device
        </Button>
      </Group>
    </Modal>
  );
}

function DeviceCard({ dashBoardData, device }) {
  const { classes } = useStyles();

  const [opened, setOpened] = useState(false);
  const [modalDeviceId, setModalDeviceId] = useState<number>(0);
  const [cardWidth, setCardWidth] = useState<number>(0);

  const cardRef = useRef(null);

  const [deviceData, setDeviceData] = useState<{
    details: any;
    title: string;
    task: string;
  }>({ details: { power: null }, title: "", task: "" });

  useEffect(() => {
    function handleResize() {
      setCardWidth(cardRef.current.offsetWidth);
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setDeviceData({
      ...dashBoardData.find((data) => data.deviceId === device.id),
    });
  }, [dashBoardData]);

  return (
    <>
      <QuickConfigModal
        deviceId={modalDeviceId}
        opened={opened}
        setOpened={setOpened}
      />
      <Paper
        withBorder
        p="md"
        radius="md"
        key={device.id + "dash"}
        ref={cardRef}
      >
        <Group position="apart" mb={5}>
          <Stack spacing={0}>
            <Text color="dimmed" className={classes.title}>
              {device.name || device.ip}
            </Text>
            {deviceData.details && (
              <Text size="xs" color="dimmed">
                <Badge
                  color={deviceData.task ? "grape" : "lime"}
                  radius={"sm"}
                  size="xs"
                >
                  {deviceData.task || "nothing to do"}
                </Badge>
              </Text>
            )}
          </Stack>

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
          <RingProgress
            size={cardWidth / 2 - 20}
            thickness={cardWidth / 25}
            sections={[
              {
                value: Math.abs(
                  (deviceData?.details?.power?.value /
                    deviceData?.details?.power?.maxPower) *
                    100 || 0
                ),
                color: "green",
              },
            ]}
            label={
              <Tooltip label="Actual Power Consumption">
                <Text color="" weight={700} align="center" size="xl">
                  {Math.round(deviceData?.details?.power?.value) || 0} W
                </Text>
              </Tooltip>
            }
          />

          <RingProgress
            size={cardWidth / 2 - 20}
            thickness={cardWidth / 25}
            sections={[
              {
                value: 0,
                color: "blue",
              },
            ]}
            label={
              <Tooltip label="Actual Packet Loss">
                <Text color="" weight={700} align="center" size="xl">
                  {0} %
                </Text>
              </Tooltip>
            }
          />
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
    global.ipcRenderer.invoke("GET_STATS").then((dashboardData) => {
      setDashboardData(dashboardData);
      interval.start();
    });
    return interval.stop;
  }, []);

  const devices = useLiveQuery(() => db.devices.toArray(), []);

  return (
    <SimpleGrid
      cols={4}
      spacing="xl"
      breakpoints={[
        { minWidth: "sm", cols: 1 },
        { minWidth: "md", cols: 2 },
        { minWidth: 1200, cols: 3 },
      ]}
    >
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
