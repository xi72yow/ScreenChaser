import { Navbar, ScrollArea } from "@mantine/core";
import {
  IconGauge,
  IconFlame,
  IconBulb,
  IconDeviceTv,
  IconTool,
  IconStar,
  IconDeviceAnalytics,
  IconBooks,
  IconPlayerPlay,
  IconFrame,
} from "@tabler/icons-react";
import LinksGroup from "./navbarLinksGroup";
import useStyles from "../styles/styles";
import React from "react";
import {
  db,
  dbBool,
  TaskCodes,
  TaskTableInterface,
  TaskTypes,
} from "../database/db";
import { useLiveQuery } from "dexie-react-hooks";

type NavbarNestedProps = {
  selectedTaskId: number;
  setSelectedTaskId: (taskCode: number) => void;
};

export function getTaskTypeIcon(task: TaskTableInterface) {
  switch (task.type) {
    case TaskTypes.ui:
      if (task.taskCode === TaskCodes.dashboard) return IconDeviceAnalytics;
      if (task.taskCode === TaskCodes.library) return IconBooks;
      return IconGauge;
    case TaskTypes.effect:
      return IconFlame;
    case TaskTypes.render:
      return IconFrame;
    case TaskTypes.chaser:
      return IconDeviceTv;
    default:
      return IconTool;
  }
}

interface MenueInterfcae extends TaskTableInterface {
  initiallyOpened?: boolean;
  icon: typeof IconGauge;
  links?: {
    label: string;
    taskCode: TaskCodes;
    id: number;
    icon: typeof IconGauge;
  }[];
}

export default function NavbarNested(props: NavbarNestedProps) {
  const { selectedTaskId, setSelectedTaskId } = props;
  const { classes } = useStyles();

  const uiTasks: TaskTableInterface[] = useLiveQuery(
    async () => {
      return db.tasks.where("type").equals(TaskTypes.ui).toArray();
    },
    null,
    []
  );

  const favoriteTasks: TaskTableInterface[] = useLiveQuery(
    async () => {
      return db.tasks
        .where("favorite")
        .equals(dbBool.true)
        .and((task) => task.type !== TaskTypes.ui)
        .toArray();
    },
    null,
    []
  );

  const menue: MenueInterfcae[] = React.useMemo(() => {
    const entries: MenueInterfcae[] = uiTasks?.map((task) => {
      return {
        label: task.label,
        icon: getTaskTypeIcon(task),
        taskCode: task.taskCode,
        id: task.id,
      } as MenueInterfcae;
    });

    entries?.push({
      label: "Favorites",
      icon: IconStar,
      initiallyOpened: true,
      links: favoriteTasks?.map((task) => {
        return {
          label: task.label,
          taskCode: task.taskCode,
          icon: getTaskTypeIcon(task),
          id: task.id,
        };
      }),
    } as MenueInterfcae);

    return entries as MenueInterfcae[];
  }, [uiTasks, favoriteTasks]);

  const links = menue.map((item) => (
    <LinksGroup
      {...item}
      key={item.label}
      selectedTaskId={selectedTaskId}
      setSelectedTaskId={setSelectedTaskId}
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
