import React, { useEffect, useRef, useState } from "react";
import {
  AppShell,
  Button,
  ColorScheme,
  ColorSchemeProvider,
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
import { useHotkeys, useLocalStorage } from "@mantine/hooks";

import { useLiveQuery } from "dexie-react-hooks";
import { db, initilalValues, updateConfig } from "../components/database/db";
import Toolbar from "../components/toolbar/toolbar";
import DataEmitter from "../components/effects_build/network/dataEmitter";

function App() {
  const [selectedDevice, setSelectedDevice] = React.useState<any>(0);
  const [taskCode, setTaskCode] = React.useState("dashboard");

  const DataEmitterRef = useRef<any>([]);

  const configs = useLiveQuery(async () => {
    return await db.configs.toArray();
  });

  const form = useForm({ initialValues: { ...initilalValues } });

  useEffect(() => {
    console.log(form.values);
  }, [form]);

  useEffect(() => {
    if (configs) {
      form.reset();
      form.setValues({ ...configs[selectedDevice] });
      configs.forEach((config, i) => {
        if (
          config.device.ip !== DataEmitterRef.current[i]?.getIp() ||
          !DataEmitterRef.current[i]
        )
          DataEmitterRef.current[i] = new DataEmitter(false, config.device.ip);
        console.log(DataEmitterRef.current);
      });
    }
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
          configs={configs}
          taskCode={taskCode}
          selectedDevice={selectedDevice}
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
            return (
              <Dashboard
                data={[
                  { title: "Power:", value: "3W", diff: 50, icon: "bolt" },
                  {
                    title: "Package Loss:",
                    value: "1%",
                    diff: -50,
                    icon: "package",
                  },
                ]}
              ></Dashboard>
            );
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
              <Chaser key={selectedDevice + "chaser"} form={form}></Chaser>
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
          colors: {
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
          },
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
