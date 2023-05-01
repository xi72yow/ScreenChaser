import {
  Box,
  Tooltip,
  useMantineTheme,
  ActionIcon as MantineActionIcon,
} from "@mantine/core";
import React, { MouseEventHandler } from "react";

type Props = {
  onClick?: (event) => void;
  tooltip?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

export default function ActionIcon({
  onClick,
  tooltip,
  disabled,
  children,
}: Props) {
  const theme = useMantineTheme();

  return (
    <Tooltip label={tooltip}>
      <Box
        onClick={onClick}
        sx={{
          cursor: disabled ? "not-allowed" : "pointer",
          color: disabled ? theme.colors.gray[7] : theme.colors.gray[5],
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          "&:hover": {
            color: disabled ? theme.colors.gray[7] : theme.colors.blue[5],
          },
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}
