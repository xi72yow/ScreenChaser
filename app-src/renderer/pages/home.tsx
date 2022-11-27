import React, { useEffect, useRef, useState } from "react";
import { AppShell, ColorScheme, ColorSchemeProvider } from "@mantine/core";
import NavbarNested from "../components/navbar/navbar";
import HeaderApp from "../components/header/header";
import MeteorRainForm from "../components/forms/meteorRainForm";
import { IconBulb, IconDatabase } from "@tabler/icons";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { ModalsProvider } from "@mantine/modals";
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
import StaticLightForm from "../components/forms/staticLightForm";
import { ipcRenderer } from "electron";
import { setTimeout } from "timers";
import ConfirmationContextProvider from "../components/hooks/confirm";
import colors from "../components/styles/colors";
import BubblesForm from "../components/forms/bubblesForm";
import AnimationForm from "../components/forms/animationForm";

function App() {
  const [selectedDevice, setSelectedDevice] = React.useState<any>(0);
  const [taskCode, setTaskCode] = React.useState("dashboard");
  const chaserRunning = useRef(false);

  const [lightsOff, setLightsOff] = useState(false);

  const configs = useLiveQuery(
    async () => {
      return await db.configs.toArray();
    },
    null,
    []
  );

  const form = useForm({ initialValues: { ...initilalValues } });

  useEffect(() => {
    console.log(form.values);
  }, [form]);

  useEffect(() => {
    if (configs) {
      if (lightsOff) {
        if (chaserRunning.current) {
          ipcRenderer.send("CHASER:OFF");
          chaserRunning.current = false;
          setTimeout(() => {
            ipcRenderer.send("LIGHTS_OFF");
          }, 1000);
        } else ipcRenderer.send("LIGHTS_OFF");
      } else {
        ipcRenderer.send("LIGHTS_ON");
        if (!chaserRunning.current) {
          if (
            configs.filter((config) => config.task.taskCode === "chaser")
              .length > 0
          ) {
            ipcRenderer.send("CHASER:ON");
            chaserRunning.current = true;
          }
        }
      }
    }
  }, [lightsOff]);

  useEffect(() => {
    if (
      configs.filter((config) => config.task.taskCode === "chaser").length > 0
    ) {
      if (!chaserRunning.current) {
        ipcRenderer.send("CHASER:ON");
        chaserRunning.current = true;
      }
    } else {
      ipcRenderer.send("CHASER:OFF");
      chaserRunning.current = false;
    }

    if (taskCode === "chaser") {
      ipcRenderer.send("CHANGE_CONFIG", configs);
    }
    ipcRenderer.send("CHANGE_CONFIG_DEBOUNCED", configs);

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
          lightsOff={lightsOff}
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
            return <Dashboard></Dashboard>;
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
          case "bubbles":
            return (
              <BubblesForm
                key={selectedDevice + "bubbles"}
                form={form}
              ></BubblesForm>
            );
          case "staticLight":
            return (
              <StaticLightForm
                key={selectedDevice + "staticLight"}
                form={form}
              ></StaticLightForm>
            );
          case "animation":
            return (
              <AnimationForm
                key={selectedDevice + "staticLight"}
                form={form}
              ></AnimationForm>
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
  );
}

export default Next;
