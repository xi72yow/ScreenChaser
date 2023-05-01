import {
  Badge,
  Button,
  Code,
  Group,
  Header,
  Menu,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronDown, IconCpu } from "@tabler/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Dispatch, SetStateAction } from "react";
import package_json from "../../../package.json";
import { DeviceTableInterface, db } from "../database/db";
import ScanNetworkModal from "../modale/chaserSettingsModal";
import Logo from "../styles/Logo.js";

interface HeaderAppProps {
  setSelectedDeviceId: Dispatch<SetStateAction<Number>>;
  selectedDeviceId: any;
}

export default function HeaderApp({
  setSelectedDeviceId,
  selectedDeviceId,
}: HeaderAppProps) {
  const theme = useMantineTheme();

  const devices: DeviceTableInterface[] = useLiveQuery(
    async () => {
      return db.devices.toArray();
    },
    null,
    []
  );

  const currentDevice = useLiveQuery(
    async () => {
      return db.devices.where("id").equals(selectedDeviceId).first();
    },
    [selectedDeviceId],
    null
  );

  const items = devices.map(({ ip, name, neoPixelCount, id }) => {
    return (
      <Menu.Item
        key={ip}
        onClick={() => {
          setSelectedDeviceId(id);
        }}
        icon={<IconCpu size={16} color={theme.colors.blue[6]} stroke={1.5} />}
        rightSection={
          <Text
            size="xs"
            transform="uppercase"
            weight={700}
            color="dimmed"
            ml={8}
            sx={{
              whiteSpace: "nowrap",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name || "No name"}
          </Text>
        }
      >
        <Group position="left">
          <Text size="sm" weight={900}>
            {ip}
          </Text>
          <Badge
            color={"blue"}
            variant={theme.colorScheme === "dark" ? "light" : "outline"}
          >
            {neoPixelCount}
          </Badge>
        </Group>
      </Menu.Item>
    );
  });

  return (
    <Header
      height={80}
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
        }}
      >
        <Group
          position="apart"
          sx={{ width: 300, paddingRight: "1rem", paddingLeft: "0.5rem" }}
        >
          <Logo
            width={200}
            fill={
              theme.colorScheme === "dark"
                ? theme.colors.gray[2]
                : theme.colors.dark[7]
            }
          />
          <Code sx={{ fontWeight: 700 }}>v{package_json.version}</Code>
        </Group>
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
          <Menu transition="pop-top-right" position="top-end">
            <Menu.Target>
              <Button
                sx={{ height: 40 }}
                rightIcon={<IconChevronDown size={18} stroke={1.5} />}
                pr={12}
              >
                <Text
                  sx={{
                    whiteSpace: "nowrap",
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {`${currentDevice?.name ? currentDevice?.name : "New"}` ||
                    "Choose Device"}
                </Text>
                <Text>{`@${currentDevice?.ip}` || ""}</Text>
              </Button>
            </Menu.Target>
            <Menu.Dropdown>{items}</Menu.Dropdown>
          </Menu>
          <ScanNetworkModal></ScanNetworkModal>
        </Group>
      </Group>
    </Header>
  );
}
