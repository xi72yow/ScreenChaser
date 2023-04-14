import { withJsonFormsControlProps } from "@jsonforms/react";
import { Select as MantineSelect, createStyles } from "@mantine/core";
import React from "react";

const useStyles = createStyles((theme) => ({
  input: {
    textAlign: "center",
    border: `1px solid ${
      theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
    height: 42,
    padding: `6px ${theme.spacing.xs}px !important`,
  },
}));

interface SelectProps {
  label: string;
  data: any;
  path: string;
  handleChange(path: string, value: any): void;
  schema: any;
}

export function Select({
  label,
  path,
  data,
  handleChange,
  schema,
}: SelectProps) {
  const { classes } = useStyles();

  return (
    <div>
      <MantineSelect
        classNames={{ input: classes.input }}
        data={schema.enum}
        label={label}
        value={data}
        onChange={(value) => {
          handleChange(path, value);
        }}
      />
    </div>
  );
}

export default withJsonFormsControlProps(Select);
