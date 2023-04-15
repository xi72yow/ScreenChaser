import {
  Alert,
  AppShell,
  Box,
  Button,
  Code,
  ColorScheme,
  ColorSchemeProvider,
  Group,
  MantineProvider,
} from "@mantine/core";
import { useHotkeys, useLocalStorage } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import {
  NotificationsProvider,
  showNotification,
} from "@mantine/notifications";
import React from "react";
import HeaderApp from "../components/header/header";
import NavbarNested from "../components/navbar/navbar";

import { IconAlertCircle } from "@tabler/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { ipcRenderer, shell } from "electron";
import { ErrorBoundary } from "react-error-boundary";
import package_json from "../../package.json";
import Library from "../components/boards/library";
import {
  DeviceTableInterface,
  TaskCodes,
  TaskTableInterface,
  db,
} from "../components/database/db";
import FormRenderer from "../components/forms/formRenderer";
import ConfirmationContextProvider from "../components/hooks/confirm";
import Toolbar from "../components/toolbar/toolbar";
import Dashboard from "../components/boards/dashboard";

function checkForUpdates() {
  fetch(
    "https://api.github.com/repos/xi72yow/ScreenChaser/releases/latest"
  ).then((response) => {
    response.json().then((data) => {
      const NEW_VERSION = data.tag_name.replace("screenchaser-app@", "");
      if (NEW_VERSION !== package_json.version) {
        showNotification({
          title: "New version available",
          message: (
            <Box>
              {`Version ${NEW_VERSION} is available. You are running version ${package_json.version}. Download `}
              <span
                onClick={() => shell.openExternal(data.html_url)}
                style={{ color: "#09ADC3", cursor: "pointer" }}
              >
                here
              </span>
              .
            </Box>
          ),
          color: "blue",
          icon: <IconAlertCircle size={16} />,
        });
      }
    });
  });
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Group position="center" sx={{ height: "90vh" }} m="lg">
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Something went wrong:"
        color="red"
      >
        Something terrible happened! Please try again and if it happens again,
        contact me.
        <Code block mt={"md"} color="gray">
          {error.message}
        </Code>
        <Group position="right" pt={"md"} pb={"xs"}>
          <Button onClick={resetErrorBoundary} variant="outline" color={"gray"}>
            Try again
          </Button>
        </Group>
      </Alert>
    </Group>
  );
}

function App() {
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<number>(1);
  const [selectedTaskId, setSelectedTaskId] = React.useState<number>(1);
  const [selectedConfigId, setSelectedConfigId] = React.useState<number>(-1);

  const [data, setData] = React.useState({});

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

  const deviceConfigs = useLiveQuery(
    async () => {
      const allDevices = await db.devices.toArray();
      const prepardedData = allDevices.map(async (device) => {
        return {
          device,
          config: await db.configs.get(device.configId).catch((e) => {
            return { taskCode: "nothing to do" };
          }),
        };
      });
      return Promise.all(prepardedData);
    },
    null,
    []
  );

  React.useEffect(() => {
    setSelectedConfigId(-1);
  }, [selectedTaskId]);

  /* React.useEffect(() => {
    checkForUpdates();
  }, []); */

  React.useEffect(() => {
    if (deviceConfigs) {
      deviceConfigs.forEach((deviceConfig) => {
        ipcRenderer.send("MANAGE_CHASER", deviceConfig);
      });
    }
  }, [deviceConfigs]);

  return (
    <AppShell
      padding="md"
      navbar={
        <NavbarNested
          selectedTaskId={selectedTaskId}
          setSelectedTaskId={setSelectedTaskId}
        ></NavbarNested>
      }
      header={
        <HeaderApp
          selectedDeviceId={selectedDeviceId}
          setSelectedDeviceId={setSelectedDeviceId}
        ></HeaderApp>
      }
      footer={
        <Toolbar
          data={data}
          selectedTaskId={selectedTaskId}
          selectedDeviceId={selectedDeviceId}
        ></Toolbar>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      {(() => {
        switch (currentTask?.taskCode) {
          case "dashboard":
            return <Dashboard></Dashboard>;

          case TaskCodes.library:
            return <Library></Library>;

          default:
            return (
              <FormRenderer
                setData={setData}
                data={data}
                selectedDeviceId={selectedDeviceId}
                selectedTaskId={selectedTaskId}
                selectedConfigId={selectedConfigId}
                setSelectedConfigId={setSelectedConfigId}
              ></FormRenderer>
            );
        }
      })()}
    </AppShell>
  );
}

function Next() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  useHotkeys([["mod+J", () => toggleColorScheme()]]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          theme={{
            globalStyles: (theme) => ({
              "*, *::before, *::after": {
                boxSizing: "border-box",
              },

              "::-webkit-scrollbar": {
                width: "0.5rem",
                height: "0.5rem",
              },
              "::-webkit-scrollbar-track": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0],
              },
              "::-webkit-scrollbar-thumb": {
                borderRadius: theme.radius.sm,
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3],
              },
              "::-webkit-scrollbar-thumb:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[2],
              },
            }),

            colorScheme,
            fontFamily: "Greycliff CF, sans-serif",
            /* colors: {
            dark: [
              "#21222c",
              "#414558",
              "#a7abbe",
              "#2AC9DE",
              "#1AC2D9",
              "#11B7CD",
              "#09ADC3",
              "#0E99AC",
              "#128797",
              "#147885",
            ],
            "bright-pink": [
              "#F0BBDD",
              "#ED9BCF",
              "#EC7CC3",
              "#ED5DB8",
              "#F13EAF",
              "#F71FA7",
              "#FF00A1",
              "#E00890",
              "#C50E82",
              "#AD1374",
            ],
          }, */
          }}
          withNormalizeCSS
          withGlobalStyles
        >
          <NotificationsProvider position="top-center">
            <ModalsProvider>
              <ConfirmationContextProvider>
                <App />
              </ConfirmationContextProvider>
            </ModalsProvider>
          </NotificationsProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </ErrorBoundary>
  );
}

export default Next;
