import { withJsonFormsControlProps } from "@jsonforms/react";
import { ActionIcon, ColorInput, createStyles } from "@mantine/core";
import { IconWand } from "@tabler/icons";
import { randomColor } from "screenchaser-core/dist/helpers";

type Props = {
  path: string;
  label?: string;
  data;
  handleChange(path: string, value: any): void;
};

const useStyles = createStyles((theme) => ({
  input: {
    textAlign: "center",
    border: `1px solid ${
      theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
    }`,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
    height: 42,
    flex: 1,
    padding: `6px ${theme.spacing.xs}px !important`,
  },
}));

export function Color({ path, label, data, handleChange }: Props) {
  const { classes } = useStyles();

  return (
    <div>
      <ColorInput
        placeholder="Pick color"
        label={label ? label : "Color"}
        onChange={(value) => {
          handleChange(path, value);
        }}
        classNames={{ input: classes.input }}
        value={data}
        rightSection={
          <ActionIcon
            onClick={() => {
              handleChange(path, randomColor());
            }}
          >
            <IconWand size={16} />
          </ActionIcon>
        }
      />
    </div>
  );
}

export default withJsonFormsControlProps(Color);
