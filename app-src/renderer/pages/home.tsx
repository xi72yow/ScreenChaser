import React, { useEffect, useRef, useState } from "react";
import {
  AppShell,
  Button,
  ColorScheme,
  ColorSchemeProvider,
  ScrollArea,
  Text,
} from "@mantine/core";
import NavbarNested from "../components/navbar/navbar";
import HeaderApp from "../components/header/header";
import MeteorRainForm from "../components/forms/meteorRainForm";
import { IconBulb, IconDatabase } from "@tabler/icons";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { showNotification } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { ModalsProvider } from "@mantine/modals";
import { openConfirmModal } from "@mantine/modals";
import BouncingBallsForm from "../components/forms/bouncingBallsForm";
import FireFlameForm from "../components/forms/fireFlameForm";
import ColorWheelForm from "../components/forms/colorWheelForm";
import FrostyPikeForm from "../components/forms/frostyPikeForm";
import DyingLightsForm from "../components/forms/dyingLightsForm";
import SnakeForm from "../components/forms/snakeForm";
import Dashboard from "../components/boards/dashboard";
import Chaser from "../components/boards/chaser";
import {
  useHotkeys,
  useInterval,
  useLocalStorage,
  useSetState,
} from "@mantine/hooks";

import { useLiveQuery } from "dexie-react-hooks";
import { db, initilalValues } from "../components/database/db";
import Toolbar from "../components/toolbar/toolbar";
import DataEmitter from "../components/effects_build/network/dataEmitter";
import StaticLightForm from "../components/forms/staticLightForm";
import Manager from "../components/effects_build/manager/manager";

function App() {
  const [selectedDevice, setSelectedDevice] = React.useState<any>(0);
  const [taskCode, setTaskCode] = React.useState("dashboard");
  const ManagerRef = useRef<any>(new Manager());
  const [dashBoardData, setDashBoardData] = useState(null);

  const [lightsOff, setLightsOff] = useState(false);

  const configs = useLiveQuery(async () => {
    return await db.configs.toArray();
  });

  const interval = useInterval(
    () =>
      setDashBoardData((dashBoardDataLast) => {
        return ManagerRef.current.emitters.map((dataEmitter, index, array) => {
          const data = dataEmitter.getHealth();
          return {
            title: dataEmitter.getIp(),
            task: ManagerRef.current.runningEffects[index]
              ? ManagerRef.current.runningEffects[index].getIdentifier()
              : null,
            details: [
              {
                title: "Power:",
                value: data.power,
                icon: "bolt",
                diff: dashBoardDataLast
                  ? (data.power / dashBoardDataLast[index].details[0]?.value) *
                      100 -
                    100
                  : 100,
              },
              {
                title: "Package Loss:",
                value: data.packageloss,
                icon: "package",
                diff: dashBoardDataLast
                  ? (data.packageloss /
                      dashBoardDataLast[index].details[1]?.value) *
                      100 -
                    100
                  : 100,
              },
            ],
          };
        });
      }),
    3000
  );

  const form = useForm({ initialValues: { ...initilalValues } });

  useEffect(() => {
    console.log(form.values);
  }, [form]);

  useEffect(() => {
    if (taskCode === "dashboard") {
      interval.start();
    } else {
      interval.stop();
    }
  }, [taskCode]);

  useEffect(() => {
    if (configs) {
      ManagerRef.current.lightsOff();
    }
  }, [lightsOff]);

  useEffect(() => {
    if (taskCode === "chaser") {
      ManagerRef.current.setConfigs(configs);
    }

    ManagerRef.current.setDebouncedConfigs(configs);

    if (configs) form.setValues(configs[selectedDevice]);
  }, [configs, selectedDevice]);

  if (!configs) {
    return <div>Loading...</div>;
  }

  return (
    <AppShell
      padding="md"
      navbar={
        <NavbarNested
          taskCode={taskCode}
          setTaskCode={setTaskCode}
        ></NavbarNested>
      }
      header={
        <HeaderApp
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
        ></HeaderApp>
      }
      footer={
        <Toolbar
          form={form}
          configs={configs}
          taskCode={taskCode}
          selectedDevice={selectedDevice}
          setLightsOff={setLightsOff}
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
        switch (taskCode) {
          case "dashboard":
            return <Dashboard data={dashBoardData}></Dashboard>;
          case "meteorRain":
            return (
              <MeteorRainForm
                form={form}
                key={selectedDevice + "meteorRain"}
              ></MeteorRainForm>
            );
          case "bouncingBalls":
            return (
              <BouncingBallsForm
                form={form}
                key={selectedDevice + "bouncingBalls"}
              ></BouncingBallsForm>
            );
          case "fireFlame":
            return (
              <FireFlameForm
                form={form}
                key={selectedDevice + "fireFlame"}
              ></FireFlameForm>
            );
          case "colorWheel":
            return (
              <ColorWheelForm
                form={form}
                key={selectedDevice + "colorWheel"}
              ></ColorWheelForm>
            );
          case "frostyPike":
            return (
              <FrostyPikeForm
                form={form}
                key={selectedDevice + "frostyPike"}
              ></FrostyPikeForm>
            );
          case "dyingLights":
            return (
              <DyingLightsForm
                form={form}
                key={selectedDevice + "dyingLights"}
              ></DyingLightsForm>
            );
          case "snake":
            return (
              <SnakeForm key={selectedDevice + "snake"} form={form}></SnakeForm>
            );
          case "chaser":
            return (
              <Chaser
                key={selectedDevice + "chaser"}
                selectedDevice={selectedDevice}
                form={form}
              ></Chaser>
            );
          case "staticLight":
            return (
              <StaticLightForm
                key={selectedDevice + "staticLight"}
                form={form}
              ></StaticLightForm>
            );

          default:
            return <h1>work in progress</h1>;
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
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{
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
            <App />
          </ModalsProvider>
        </NotificationsProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default Next;
