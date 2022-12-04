import { Navbar, ScrollArea } from "@mantine/core";
import {
  IconGauge,
  IconFlame,
  IconBulb,
  IconDeviceTv,
  IconTool,
} from "@tabler/icons";
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
      { label: "Bubbles", taskCode: "bubbles" },
    ],
  },
  { label: "Animation", icon: IconTool, taskCode: "animation" },
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
  const { setTaskCode, taskCode } = props;
  const { classes } = useStyles();
  const links = menue.map((item) => (
    <LinksGroup
      {...item}
      key={item.label}
      choosenTaskCode={taskCode}
      setTaskCode={setTaskCode}
    />
  ));

  return (
    <Navbar width={{ sm: 250 }} p="md" className={classes.navbar}>
      <Navbar.Section grow className={classes.links} component={ScrollArea}>
        <div className={classes.linksInner}>{links}</div>
      </Navbar.Section>
    </Navbar>
  );
}
