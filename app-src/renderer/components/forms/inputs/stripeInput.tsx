import { Group, useMantineTheme, Text } from "@mantine/core";
import React from "react";
import { useHorizontalScroll } from "../helpers/horizontalScroll";
import StripeCreator from "./baseStripe/stripeCreator";
import StripeCreatorPreview from "./baseStripe/stripeCreatorPreview";

type Props = {
  form: any;
  path: string;
  defaultValue: any;
  singleFrame?: boolean;
  label: string;
};

export default function StripeInput({
  form,
  path,
  defaultValue,
  singleFrame,
  label,
}: Props) {
  const theme = useMantineTheme();
  const scrollRef = useHorizontalScroll();
  return (
    <React.Fragment>
      <Text
        sx={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 500,
          marginTop: "0.5rem",
        }}
      >
        {label}
      </Text>
      <Group
        sx={{
          paddingRight: `${theme.spacing.sm}px !important`,
          paddingLeft: `${theme.spacing.sm}px !important`,
          border: `1px solid ${
            theme.colorScheme === "dark" ? "transparent" : theme.colors.gray[3]
          }`,
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.white,
          height: 40,
          borderRadius: theme.radius.sm,
          justifyContent: "space-between",
        }}
      >
        <Group ref={scrollRef} sx={{ overflowX: "auto", maxWidth: "90%" }}>
          <StripeCreatorPreview
            frames={defaultValue}
            form={form}
          ></StripeCreatorPreview>
        </Group>
        <StripeCreator
          form={form}
          path={path}
          defaultValue={defaultValue}
          singleFrame={singleFrame}
        ></StripeCreator>
      </Group>
    </React.Fragment>
  );
}
