import React, { useRef, useState } from "react";
import {
  createStyles,
  NumberInput,
  NumberInputHandlers,
  ActionIcon,
  Text,
} from "@mantine/core";
import { IconPlus, IconMinus } from "@tabler/icons";

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

interface QuantityInputProps {
  min?: number;
  max?: number;
  label?: string;
  defaultValue?: number;
  form: any;
  path: string;
  sx?: any;
}

export default function QuantityInput({
  min = 0,
  max = 255,
  label = "",
  defaultValue = 1,
  form,
  path,
  sx,
}: QuantityInputProps) {
  const { classes } = useStyles();
  const [value, setValue] = useState<number | undefined>(defaultValue);

  React.useEffect(() => {
    form.setFieldValue(path, defaultValue);
  }, []);

  React.useEffect(() => {
    form.setFieldValue(path, value);
  }, [value]);

  return (
    <React.Fragment>
      <Text sx={{ fontWeight: 400 }}>{label}</Text>

      <div className={classes.wrapper}>
        <ActionIcon<"button">
          size={28}
          variant="transparent"
          onClick={() => setValue((value) => value - 1)}
          disabled={value === min}
          className={classes.control}
          onMouseDown={(event) => event.preventDefault()}
        >
          <IconMinus size={16} stroke={1.5} />
        </ActionIcon>

        <NumberInput
          variant="unstyled"
          min={min}
          max={max}
          sx={sx}
          value={value}
          onChange={(value) => {
            setValue(value);
          }}
          classNames={{ input: classes.input }}
        />

        <ActionIcon<"button">
          size={28}
          variant="transparent"
          onClick={() => setValue((value) => value + 1)}
          disabled={value === max}
          className={classes.control}
          onMouseDown={(event) => event.preventDefault()}
        >
          <IconPlus size={16} stroke={1.5} />
        </ActionIcon>
      </div>
    </React.Fragment>
  );
}
