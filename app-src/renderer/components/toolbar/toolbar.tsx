import { Button, Footer, Group } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconBulb } from "@tabler/icons";
import { ConfigInterface, updateConfig } from "../database/db";
import useStyles from "../styles/styles";
import GlobalSettings from "./globalSettings";

type ToolbarProps = {
  taskCode: string;
  selectedDevice: number;
  setLightsOff: any;
  configs: Array<ConfigInterface>;
  form: UseFormReturnType<ConfigInterface>;
  lightsOff: boolean;
};

export default function Toolbar({
  form,
  taskCode,
  selectedDevice,
  configs,
  setLightsOff,
  lightsOff,
}: ToolbarProps) {
  const { classes } = useStyles();

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
        <GlobalSettings
          lightsOff={lightsOff}
          setLightsOff={setLightsOff}
        ></GlobalSettings>
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
          {taskCode !== "dashboard" && (
            <Button
              onClick={() => {
                const currentFormConfig = form.values[taskCode];
                updateConfig(selectedDevice + 1, {
                  task: { taskCode },
                  [taskCode]: currentFormConfig,
                });

                showNotification({
                  title: "Changed task",
                  message:
                    "Changing Config for " +
                    taskCode +
                    " on Device " +
                    configs[selectedDevice].device.ip,
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
