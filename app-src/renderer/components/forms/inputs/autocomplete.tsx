import {
  AutocompleteItem,
  Group,
  Loader,
  Autocomplete as MantineAutocomplete,
  MantineColor,
  SelectItemProps,
  Text,
  createStyles,
} from "@mantine/core";
import React, { forwardRef } from "react";

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
    height: 42,
    flex: 1,
    padding: `6px ${theme.spacing.xs}px !important`,
  },
}));

interface ItemProps extends SelectItemProps {
  color: MantineColor;
  description: string;
}

const AutoCompleteItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ description, value, ...others }: ItemProps, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap>
        <div>
          <Text>{value}</Text>
          <Text size="xs" color="dimmed">
            {description}
          </Text>
        </div>
      </Group>
    </div>
  )
);

type Props = {
  data: {
    name: string;
    description?: string;
  }[];
};

export default function Autocomplete({ data }: Props) {
  const formattedData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      value: item.name,
    }));
  }, [data]);

  const { classes } = useStyles();

  return (
    <MantineAutocomplete
      classNames={{ input: classes.input }}
      label="Choose a config"
      placeholder="Pick one"
      itemComponent={AutoCompleteItem}
      defaultValue="new Configuration"
      spellCheck={false}
      height={42}
      data={
        [
          { value: "new Configuration", description: "Create a new Config" },
          ...formattedData,
        ] as unknown as AutocompleteItem[]
      }
      filter={(value, item) =>
        item.value.toLowerCase().includes(value.toLowerCase().trim()) ||
        item.description.toLowerCase().includes(value.toLowerCase().trim())
      }
      rightSection={<Loader size="xs" />}
    />
  );
}
