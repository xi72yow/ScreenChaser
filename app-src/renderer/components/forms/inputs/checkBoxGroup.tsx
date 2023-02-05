import { Box, Group, Text, useMantineTheme } from "@mantine/core";
import React from "react";

type Props = {
  label?: string;
  children: React.ReactNode;
};

export default function CheckBoxGroup({ label, children }: Props) {
  const theme = useMantineTheme();

  return (
    <React.Fragment>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          sx={{
            fontSize: theme.fontSizes.sm,
            fontWeight: 400,
            marginTop: "0.5rem",
          }}
        >
          {label}
        </Text>
      </Box>
      <Group p={0}>{children}</Group>
    </React.Fragment>
  );
}
