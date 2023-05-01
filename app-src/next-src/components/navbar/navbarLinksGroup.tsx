import {
  Box,
  Collapse,
  createStyles,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight, TablerIcon } from "@tabler/icons";
import { TaskCodes } from "../database/db";

const useStyles = createStyles((theme) => ({
  control: {
    fontWeight: 500,
    display: "block",
    width: "100%",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
    fontSize: theme.fontSizes.sm,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
    },
  },

  link: {
    fontWeight: 500,
    display: "block",
    textDecoration: "none",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    paddingLeft: 31,
    marginLeft: 30,
    fontSize: theme.fontSizes.sm,
    cursor: "pointer",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    borderLeft: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
    },
  },
  active: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[7]
        : theme.colors.gray[0],
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
  },

  chevron: {
    transition: "transform 200ms ease",
  },
}));

interface LinksGroupProps {
  icon: TablerIcon;
  label: string;
  initiallyOpened?: boolean;
  links?: {
    label: string;
    taskCode: TaskCodes;
    id: number;
    icon: TablerIcon;
  }[];
  selectedTaskId: number;
  setSelectedTaskId: (taskCode: number) => void;
  id: number;
}

export default function LinksGroup({
  icon: Icon,
  label,
  initiallyOpened,
  id,
  links,
  setSelectedTaskId,
  selectedTaskId,
}: LinksGroupProps) {
  const { classes, theme } = useStyles();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useLocalStorage<boolean>({
    key: label + "-links-group-opened",
    defaultValue: initiallyOpened,
  });
  const ChevronIcon = theme.dir === "ltr" ? IconChevronRight : IconChevronLeft;
  const items = (hasLinks ? links : []).map(({ label, id, icon: LinkIcon }) => (
    <Box
      key={label}
      onClick={(event) => {
        setSelectedTaskId(id);
        event.preventDefault();
      }}
      className={
        classes.link + " " + (selectedTaskId === id ? classes.active : "")
      }
    >
      <Box
        style={{
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
        }}
      >
        <ThemeIcon color={"gray"} size={24}>
          <LinkIcon size={12} />
        </ThemeIcon>
        <Text ml={12}>{label}</Text>
      </Box>
    </Box>
  ));

  return (
    <>
      <UnstyledButton
        onClick={() => {
          setOpened((o) => !o);
          if (!hasLinks) {
            setSelectedTaskId(id);
          }
        }}
        className={
          classes.control + " " + (selectedTaskId === id ? classes.active : "")
        }
      >
        <Group position="apart" spacing={0}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size={18} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <ChevronIcon
              className={classes.chevron}
              size={14}
              stroke={1.5}
              style={{
                transform: opened
                  ? `rotate(${theme.dir === "rtl" ? -90 : 90}deg)`
                  : "none",
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}
