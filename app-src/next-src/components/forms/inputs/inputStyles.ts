import { createStyles } from "@mantine/core";

export const useStyles = createStyles((theme) => ({
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
