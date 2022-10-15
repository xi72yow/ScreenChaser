import React, { useEffect } from "react";
import { AppShell, Button, Text } from "@mantine/core";
import NavbarNested from "../components/navbar/navbar";
import HeaderApp from "../components/header/header";
import MeteorRainForm from "../components/forms/meteorRainForm";
import { IconDatabase } from "@tabler/icons";
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
  const [selectedDevice, setSelectedDevice] = React.useState(null);
  const [taskCode, setTaskCode] = React.useState("dashboard");
  const [configs, setConfigs] = useLocalStorage({
    key: "ScreenChaserConfigs",
    defaultValue: {
      meteorRain: {},
      bouncingBalls: {},
      fireFlame: {},
      colorWheel: {},
      frostyPike: {},
      dyingLights: {},
      snake: {},
      device: {},
    },
    getInitialValueInEffect: true,
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
      ...configs,
    },
  });

  React.useEffect(() => {
    form.setValues(structuredClone(configs));
  }, [configs]);

  React.useEffect(() => {
    //log states
    console.log("selectedDevice", selectedDevice);
    console.log("taskCode", taskCode);
  }, [taskCode, selectedDevice]);

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
          form={form}
          data={[{ ip: "192.125.12.132" }, { ip: "123.111.123.1" }]}
          setSelectedDevice={setSelectedDevice}
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
            return <MeteorRainForm form={form}></MeteorRainForm>;
          case "bouncingBalls":
            return <BouncingBallsForm form={form}></BouncingBallsForm>;
          case "fireFlame":
            return <FireFlameForm form={form}></FireFlameForm>;
          case "colorWheel":
            return <ColorWheelForm form={form}></ColorWheelForm>;
          case "frostyPike":
            return <FrostyPikeForm form={form}></FrostyPikeForm>;
          case "dyingLights":
            return <DyingLightsForm form={form}></DyingLightsForm>;
          case "snake":
            return <SnakeForm form={form}></SnakeForm>;
          case "chaser":
            return <Chaser></Chaser>;
          default:
            return <h1>work in progress</h1>;
        }
      })()}
      {taskCode !== "dashboard" && taskCode !== "chaser" && (
        <Button
          sx={{ float: "right", marginTop: "20px" }}
          onClick={() => {
            console.log(form.values);
            openModal();
            showNotification({
              title: "Default notification",
              message: "Hey there, your code is awesome! 🤥",
            });
          }}
          leftIcon={<IconDatabase size={14} />}
        >
          Lights On
        </Button>
      )}
    </AppShell>
  );
}

function Next() {
  return (
    <MantineProvider withNormalizeCSS withGlobalStyles>
      <NotificationsProvider>
        <ModalsProvider>
          <App />
        </ModalsProvider>
      </NotificationsProvider>
    </MantineProvider>
  );
}

export default Next;
