import { JsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import { ActionIcon, createStyles, Text, useMantineTheme } from "@mantine/core";
import { IconCheck, IconMinus, IconX } from "@tabler/icons";
import React, { useState } from "react";

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `6px ${theme.spacing.xs}px`,
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

  control: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    border: `1px solid ${
      theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
    }`,

    "&:disabled": {
      borderColor:
        theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3],
      opacity: 0.8,
      backgroundColor: "transparent",
    },
  },

  input: {
    textAlign: "center",
    paddingRight: `${theme.spacing.sm}px !important`,
    paddingLeft: `${theme.spacing.sm}px !important`,
    height: 28,
    flex: 1,
  },
}));

type Props = {
  path: string;
  label?: string;
  data: any;
  handleChange(path: string, value: any): void;
};

export function Boolean({ label, data, handleChange, path }: Props) {
  const theme = useMantineTheme();
  const { classes } = useStyles();

  return (
    <React.Fragment>
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 400,
          marginTop: "0.1rem",
        }}
      >
        {label}
      </Text>

      <div className={classes.wrapper}>
        <ActionIcon<"button">
          size={28}
          variant="transparent"
          onClick={() => handleChange(path, !data)}
          className={classes.control}
          onMouseDown={(event) => event.preventDefault()}
        >
          {data ? (
            <IconCheck size={16} stroke={1.5} />
          ) : (
            <IconX size={16} stroke={1.5} />
          )}
        </ActionIcon>
        <Text classNames={{ input: classes.input }}>
          {data ? "Enabled" : "Disabled"}
        </Text>
      </div>
    </React.Fragment>
  );
}

export default withJsonFormsControlProps(Boolean);
