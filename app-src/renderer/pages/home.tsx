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
import { db, initilalValues, updateConfig } from "../components/database/db";
import Toolbar from "../components/toolbar/toolbar";
import { hexToRgb } from "../components/effects_build/basics/convertRgbHex";
import DataEmitter from "../components/effects_build/network/dataEmitter";

import MeteorRain from "../components/effects_build/meteor";
import BouncingBalls from "../components/effects_build/bouncingBalls";
import FireFlame from "../components/effects_build/fireFlame";
import ColorWheel from "../components/effects_build/colorWheel";
import FrostyPike from "../components/effects_build/frostyPike";
import DyingLights from "../components/effects_build/dyingLights";
import Snake from "../components/effects_build/snake";
import StaticLightForm from "../components/forms/staticLightForm";
import setAll from "../components/effects_build/basics/setAll";

function prepareBaseStipe(stripeFromUi) {
  return stripeFromUi.map((color) => color.replace("#", ""));
}

function App() {
  const [selectedDevice, setSelectedDevice] = React.useState<any>(0);
  const [taskCode, setTaskCode] = React.useState("dashboard");
  const DataEmittersRef = useRef<any>([]);
  const IntervalsRef = useRef<any>([]);
  const EffectsRef = useRef<any>([]);
  const [dashBoardData, setDashBoardData] = useState(null);

  const [lightsOff, setLightsOff] = useState(false);

  const configs = useLiveQuery(async () => {
    return await db.configs.toArray();
  });

  const interval = useInterval(
    () =>
      setDashBoardData((dashBoardDataLast) => {
        return DataEmittersRef.current.map((dataEmitter, index, array) => {
          const data = dataEmitter.getHealth();

          return {
            title: dataEmitter.getIp(),
            task: EffectsRef.current[index]
              ? EffectsRef.current[index].constructor.name
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

  /*   useEffect(() => {
    console.log(form.values);
  }, [form]); */

  useEffect(() => {
    if (taskCode === "dashboard") {
      interval.start();
    } else {
      interval.stop();
    }

    if (taskCode === "shutdown") {
      IntervalsRef.current.forEach((interval) => clearInterval(interval));
      configs.forEach((config, index) => {
        DataEmittersRef.current[index].emit(
          setAll(0, 0, 0, config.device.neoPixelCount)
        );
      });
    }
  }, [taskCode]);

  useEffect(() => {
    if (configs) {
      IntervalsRef.current.forEach((interval) => clearInterval(interval));
      configs.forEach((config, index) => {
        DataEmittersRef.current[index].emit(
          setAll(0, 0, 0, config.device.neoPixelCount)
        );
      });
    }
  }, [lightsOff]);

  useEffect(() => {
    IntervalsRef.current.forEach((interval) => clearInterval(interval));

    if (configs) {
      form.reset();
      form.setValues({ ...configs[selectedDevice] });

      configs.forEach((config, i) => {
        if (
          config.device.ip !== DataEmittersRef.current[i]?.getIp() ||
          !DataEmittersRef.current[i]
        )
          DataEmittersRef.current[i] = new DataEmitter(false, config.device.ip);

        const neopixelCount = config.device.neoPixelCount;

        switch (config.task.taskCode) {
          case "meteorRain":
            const { meteorRain } = config;
            const {
              r: red,
              g: green,
              b: blue,
            } = hexToRgb(meteorRain.meteorColor.substring(1));
            EffectsRef.current[i] = new MeteorRain({
              ...meteorRain,
              neopixelCount,
              red,
              green,
              blue,
            });
            break;

          case "bouncingBalls":
            const { bouncingBalls } = config;
            EffectsRef.current[i] = new BouncingBalls({
              ...bouncingBalls,
              neopixelCount,
              baseStripe: prepareBaseStipe(bouncingBalls.baseStripe),
            });
            break;

          case "fireFlame":
            const { fireFlame } = config;
            EffectsRef.current[i] = new FireFlame({
              ...fireFlame,
              neopixelCount,
            });
            break;

          case "colorWheel":
            const { colorWheel } = config;
            EffectsRef.current[i] = new ColorWheel({
              ...colorWheel,
              neopixelCount,
            });
            break;

          case "frostyPike":
            const { frostyPike } = config;
            EffectsRef.current[i] = new FrostyPike({
              ...frostyPike,
              neopixelCount,
              baseStripe: prepareBaseStipe(frostyPike.baseStripe),
            });
            break;

          case "dyingLights":
            const { dyingLights } = config;
            EffectsRef.current[i] = new DyingLights({
              ...dyingLights,
              neopixelCount,
            });
            break;

          case "snake":
            const { snake } = config;
            EffectsRef.current[i] = new Snake({
              ...snake,
              neopixelCount,
            });
            break;

          case "chaser":
            clearInterval(IntervalsRef.current[i]);
            return;

          case "staticLight":
            const { staticLight } = config;
            clearInterval(IntervalsRef.current[i]);
            DataEmittersRef.current[i].emit(
              prepareBaseStipe(staticLight.baseStripe)
            );
            return;

          default:
            break;
        }

        IntervalsRef.current[i] = setInterval(() => {
          if (EffectsRef.current[i]) {
            DataEmittersRef.current[i].emit(EffectsRef.current[i].render());
          }
        }, 110);
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
