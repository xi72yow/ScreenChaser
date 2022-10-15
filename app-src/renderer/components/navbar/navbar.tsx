import { Navbar, Group, Code, ScrollArea, createStyles } from "@mantine/core";
import { IconGauge, IconFlame, IconBulb, IconDeviceTv } from "@tabler/icons";
import Credits from "./credits";
import LinksGroup from "./navbarLinksGroup";
import useStyles from "../styles/styles";
import React from "react";

const menue = [
  { label: "Dashboard", icon: IconGauge, taskCode: "dashboard" },
  {
    label: "Effects",
    icon: IconFlame,
    initiallyOpened: true,
    links: [
      {
        label: "Meteor Rain",
        taskCode: "meteorRain",
      },
      { label: "Bouncing Balls", taskCode: "bouncingBalls" },
      { label: "Fire Flame", taskCode: "fireFlame" },
      { label: "Color Wheel", taskCode: "colorWheel" },
      { label: "Frosty Pike", taskCode: "frostyPike" },
      { label: "Snake", taskCode: "snake" },
      { label: "Dying Lights", taskCode: "dyingLights" },
    ],
  },
  {
    label: "Static Light",
    icon: IconBulb,
    taskCode: "staticLight",
  },
  {
    label: "Chaser",
    icon: IconDeviceTv,
    taskCode: "chaser",
  },
];

export default function NavbarNested(props) {
  const { setTaskCode, taskCode, form } = props;
  const { classes } = useStyles();
  const links = menue.map((item) => (
    <LinksGroup
      {...item}
      key={item.label}
      form={form}
      choosenTaskCode={taskCode}
      setTaskCode={setTaskCode}
    />
  ));

  return (
    <Navbar width={{ sm: 300 }} p="md" className={classes.navbar}>
      <Navbar.Section grow className={classes.links} component={ScrollArea}>
        <div className={classes.linksInner}>{links}</div>
      </Navbar.Section>

      <Navbar.Section className={classes.footer}>
        <Credits
          image="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=255&q=80"
          name="xi72yow"
          email="admin@xi72yow.de"
        />
      </Navbar.Section>
    </Navbar>
  );
}
