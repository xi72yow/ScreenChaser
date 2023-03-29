import {
  Box,
  createStyles,
  Text,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { IconStar, IconStarOff } from "@tabler/icons";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import {
  TaskTableInterface,
  db,
  updateElementInTable,
  TableNames,
  dbBool,
  TaskTypes,
} from "../database/db";

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    alignContent: "center",
    padding: `6px ${theme.spacing.xs}px`,
    margin: "0.5rem",
    borderRadius: theme.radius.sm,
    border: `1px solid ${
      theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,

    "&:focus-within": {
      borderColor: theme.colors[theme.primaryColor][6],
    },
  },

  favIcon: {
    cursor: "pointer",
    "&:hover": { color: theme.colors.blue[6] },
  },
}));

type Props = {};

const library = (props: Props) => {
  const { classes } = useStyles();
  const theme = useMantineTheme();

  const tasks: TaskTableInterface[] = useLiveQuery(
    async () => {
      return (
        await db.tasks.where("type").notEqual(TaskTypes.ui).sortBy("favorite")
      ).reverse();
    },
    null,
    []
  );
  return (
    <>
      {tasks.map((task) => {
        return (
          <Box key={task.id + task.label} className={classes.wrapper}>
            <ThemeIcon
              variant="light"
              className={classes.favIcon}
              size={30}
              onClick={() => {
                const bool = task.favorite === dbBool.true;
                updateElementInTable(TableNames.tasks, task.id, {
                  favorite: bool ? dbBool.false : dbBool.true,
                });
              }}
            >
              {task.favorite === dbBool.true ? (
                <IconStar size={18} />
              ) : (
                <IconStarOff size={18} />
              )}
            </ThemeIcon>
            <Text
              sx={{
                fontSize: theme.fontSizes.md,
                fontWeight: 400,
              }}
            >
              {task.label}
            </Text>
          </Box>
        );
      })}
    </>
  );
};

export default library;
