import React, { useEffect } from "react";
import { AppShell, Button, Text } from "@mantine/core";
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
import { useLocalStorage } from "@mantine/hooks";

function App() {
  const devicesc = [
    { ip: "192.125.12.132", name: "Tisch", neoPixelCount: 113 },
    { ip: "123.111.123.1", name: "PC", neoPixelCount: 45 },
  ];
  const [devices, setDevices] = React.useState(devicesc);
  const [selectedDevice, setSelectedDevice] = React.useState(0);
  const [taskCode, setTaskCode] = React.useState("dashboard");
  const [configs, setConfigs] = useLocalStorage({
    key: "ScreenChaserConfigs",
    defaultValue: {
      configs: [
        {
          meteorRain: {
            meteorSize: 10,
            meteorTrailDecay: 64,
            meteorRandomDecay: 7,
            rainbow: false,
            meteorColor: "#9B03FF",
          },
          bouncingBalls: {
            ballMode: "random",
            mirrored: false,
            tail: false,
            ballCount: 3,
            baseStripe: [],
          },
          fireFlame: {
            cooling: 55,
            sparking: 120,
          },
          colorWheel: {
            speed: 10,
          },
          frostyPike: {
            delay: 10,
          },
          dyingLights: {
            lightColor: "#9B03FF",
          },
          snake: {
            speed: 10,
            maxSnakeSize: 10,
            appleCount: 3,
          },
          device: { ...devices[selectedDevice] },
        },
      ],
    },
  });

  const openModal = () =>
    openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          This action is so important that you are required to confirm it with a
          modal. Please click one of these buttons to proceed.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => console.log("Confirmed"),
    });

  const form = useForm({
    initialValues: {
      ...configs.configs[0],
    },
  });

  React.useEffect(() => {
    if (configs.configs.length > 0) {
      form.setValues({ ...configs.configs[selectedDevice] });
    }
    console.log("message");
  }, [configs, selectedDevice]);

  React.useEffect(() => {
    //log states
    console.log("taskCode", taskCode);
  }, [taskCode]);

  React.useEffect(() => {
    //log states
    console.log("form", form.values);
  }, [form]);

  return (
    <AppShell
      padding="md"
      navbar={
        <NavbarNested
          taskCode={taskCode}
          setTaskCode={setTaskCode}
          form={form}
        ></NavbarNested>
      }
      header={
        <HeaderApp
          configs={configs}
          setConfigs={setConfigs}
          setSelectedDevice={setSelectedDevice}
          form={form}
          data={devices}
        ></HeaderApp>
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
                key={selectedDevice + "meteorRain"}
                form={form}
              ></MeteorRainForm>
            );
          case "bouncingBalls":
            return (
              <BouncingBallsForm
                key={selectedDevice + "bouncingBalls"}
                form={form}
              ></BouncingBallsForm>
            );
          case "fireFlame":
            return (
              <FireFlameForm
                key={selectedDevice + "fireFlame"}
                form={form}
              ></FireFlameForm>
            );
          case "colorWheel":
            return (
              <ColorWheelForm
                key={selectedDevice + "colorWheel"}
                form={form}
              ></ColorWheelForm>
            );
          case "frostyPike":
            return (
              <FrostyPikeForm
                key={selectedDevice + "frostyPike"}
                form={form}
              ></FrostyPikeForm>
            );
          case "dyingLights":
            return (
              <DyingLightsForm
                key={selectedDevice + "dyingLights"}
                form={form}
              ></DyingLightsForm>
            );
          case "snake":
            return (
              <SnakeForm key={selectedDevice + "snake"} form={form}></SnakeForm>
            );
          case "chaser":
            return <Chaser key={selectedDevice + "chaser"}></Chaser>;
          default:
            return <h1>work in progress</h1>;
        }
      })()}
      {taskCode !== "dashboard" && (
        <Button
          sx={{
            float: "right",
            marginTop: "20px",
            position: "absolute",
            bottom: "20px",
            left: "320px",
          }}
          onClick={() => {
            console.log(form.values);
            openModal();
            showNotification({
              title: "Default notification",
              message: "Hey there, your code is awesome! 🤥",
            });
          }}
          leftIcon={<IconBulb size={14} />}
        >
          Lights On
        </Button>
      )}
    </AppShell>
  );
}

function Next() {
  return (
    <MantineProvider
      theme={{
        colorScheme: "light",
        fontFamily: "Greycliff CF, sans-serif",
        colors: {
          dark: [
            "#7AD1DD",
            "#5FCCDB",
            "#44CADC",
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
      <NotificationsProvider>
        <ModalsProvider>
          <App />
        </ModalsProvider>
      </NotificationsProvider>
    </MantineProvider>
  );
}

export default Next;
