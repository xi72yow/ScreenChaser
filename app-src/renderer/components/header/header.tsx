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
import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { Dispatch, SetStateAction, useEffect } from "react";
import package_json from "../../../package.json";
import {
  ConfigsTableInterface,
  db,
  DeviceTableInterface,
} from "../database/db";
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

  const items = devices.map(({ ip, name, neoPixelCount }, i) => {
    return (
      ip && (
        <Menu.Item
          key={ip}
          onClick={() => {
            setSelectedDeviceId(i);
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
      )
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
                  {`${
                    devices.find((device) => device.id === selectedDeviceId)
                      ?.name
                      ? devices.find((device) => device.id === selectedDeviceId)
                          ?.name
                      : "New"
                  }` || "Choose Device"}
                </Text>
                <Text>
                  {`@${
                    devices.find((device) => device.id === selectedDeviceId)?.ip
                  }` || ""}
                </Text>
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
