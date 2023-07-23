import {
  Badge,
  Button,
  Code,
  Group,
  Header,
  Menu,
  Modal,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronDown, IconCpu, IconPlus } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Dispatch, SetStateAction, useState } from "react";
import package_json from "../../../package.json";
import {
  DeviceTableInterface,
  TableNames,
  addElementToTable,
  db,
  dbBool,
} from "../database/db";
import ScanNetworkModal from "../modale/chaserSettingsModal";
import Logo from "../styles/Logo.js";
import { error } from "console";
import { useForm } from "@mantine/form";
import { ChaserTypes } from "screenchaser-core/dist/types";

interface HeaderAppProps {
  setSelectedDeviceId: Dispatch<SetStateAction<Number>>;
  selectedDeviceId: any;
}

function NewDeviceModal({ open, setOpen }) {
  const form = useForm({
    initialValues: {
      ip: "",
    },

    validate: {
      ip: (value) => {
        if (value.length === 0) {
          return "IP Address is required";
        }
        if (!value.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
          return "IP Address is not valid";
        }

        return null;
      },
    },
  });
  return (
    <Modal
      opened={open}
      onClose={() => {
        setOpen(false);
      }}
      title="Add new device"
      size="md"
    >
      <form
        onSubmit={form.onSubmit((values) => {
          addElementToTable(TableNames.devices, {
            ip: values.ip,
            name: "",
            neoPixelCount: 60,
            new: dbBool.true,
            type: ChaserTypes.WLED,
            exclude: dbBool.false,
          });
          setOpen(false);
          form.reset();
        })}
      >
        <TextInput
          withAsterisk
          placeholder="192.178.168.100"
          label="Device IP Address"
          {...form.getInputProps("ip")}
        />

        <Group position="right" mt="md">
          <Button variant="light" type="submit">
            Add
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

export default function HeaderApp({
  setSelectedDeviceId,
  selectedDeviceId,
}: HeaderAppProps) {
  const theme = useMantineTheme();

  const [open, setOpen] = useState(false);

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
      <NewDeviceModal open={open} setOpen={setOpen}></NewDeviceModal>
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
            <Menu.Dropdown>
              {items}
              <Menu.Item
                key={"addNewDeviceManual"}
                onClick={() => {
                  setOpen(true);
                  //setSelectedDeviceId(-1);
                }}
                icon={
                  <IconPlus
                    size={16}
                    color={theme.colors.blue[6]}
                    stroke={1.5}
                  />
                }
                rightSection={
                  <Group position="center">
                    <Text
                      size="xs"
                      transform="uppercase"
                      weight={700}
                      color="dimmed"
                      ml={8}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {"Add new device"}
                    </Text>
                  </Group>
                }
              ></Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <ScanNetworkModal></ScanNetworkModal>
        </Group>
      </Group>
    </Header>
  );
}
