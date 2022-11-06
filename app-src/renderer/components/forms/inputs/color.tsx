import React from "react";
import { ActionIcon, ColorInput, createStyles } from "@mantine/core";
import { IconRefresh } from "@tabler/icons";

type Props = { form: any; path: string; label?: string; defaultValue: string };

const useStyles = createStyles((theme) => ({
  input: {
    textAlign: "center",
    paddingRight: `${theme.spacing.sm}px !important`,
    paddingLeft: `${theme.spacing.sm}px !important`,
    border: `1px solid ${
      theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
    height: 40,
    flex: 1,
    padding: `6px ${theme.spacing.xs}px !important`,
  },
}));

const randomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export default function Color({ form, path, label, defaultValue }: Props) {
  React.useEffect(() => {
    if (form) {
      form.setFieldValue(path, defaultValue || "#9B03FF");
    }
  }, []);

  const { classes } = useStyles();

  return (
    <div>
      <ColorInput
        placeholder="Pick color"
        label={label ? label : "Color"}
        onChange={(value) => {
          form.setFieldValue(path, value);
        }}
        classNames={{ input: classes.input }}
        value={defaultValue}
        rightSection={
          <ActionIcon
            onClick={() => {
              form.setFieldValue(path, randomColor());
            }}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        }
      />
    </div>
  );
}
