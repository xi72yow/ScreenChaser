import React from "react";
import {
  Container,
  Title,
  Accordion,
  createStyles,
  Modal,
  Kbd,
} from "@mantine/core";

const useStyles = createStyles((theme) => ({
  wrapper: {
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.xl * 2,
  },

  title: {
    marginBottom: theme.spacing.xl * 1.5,
  },

  item: {
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,

    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
  },
}));

type HelpModalProps = {
  open: boolean;
  setOpen: any;
};

export default function HelpModal({ open, setOpen }: HelpModalProps) {
  const { classes } = useStyles();
  return (
    <Modal
      centered
      size={"xl"}
      opened={open}
      onClose={() => {
        setOpen(false);
      }}
      overflow="inside"
      title="Frequently Asked Questions"
    >
      <Container size="sm" className={classes.wrapper}>
        <Accordion variant="separated">
          <Accordion.Item className={classes.item} value="ui-scale">
            <Accordion.Control>
              How can I scale the User Interface?
            </Accordion.Control>
            <Accordion.Panel>
              The user interface can be scaled by holding <Kbd>ctrl</Kbd> and
              scrolling the mouse wheel.{" "}
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item className={classes.item} value="stripe-creator">
            <Accordion.Control>How the Stripe Creator works?</Accordion.Control>
            <Accordion.Panel>
              To move the viewport of the Stripe Creator use the <Kbd>A</Kbd>{" "}
              and <Kbd>D</Kbd> keys. To zoom in and out use <Kbd>W</Kbd> and{" "}
              <Kbd>S</Kbd>. Tipp: Hold <Kbd>ctrl</Kbd> and hover over the LED to
              set colors faster.{" "}
              {/* To save your work simply hit <Kbd>ctrl</Kbd> +{" "}
              <Kbd>S</Kbd>. */}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Container>
    </Modal>
  );
}
