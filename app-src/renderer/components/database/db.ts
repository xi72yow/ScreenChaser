import Dexie, { DbEvents, Table, Transaction } from "dexie";
import packageJson from "../../../package.json";

type chasingFlag = -1 | 0;

import {
  DyingLightsInterface,
  FrostyPikeInterface,
  ColorWheelInterface,
  FireFlameInterface,
  BouncingBallsInterface,
  SnakeInterface,
  BubblesInterface,
  AnimationInterface,
  MeteorRainInterface,
} from "screenchaser-core";

//defaut reusable values
const baseStripe = ["#000000"];
const frames = [["#000000"]];

export const initilalValues = {
  meteorRain: {
    meteorSize: 2,
    meteorTrailDecay: 64,
    meteorRandomDecay: 10,
    rainbow: false,
    meteorColor: "#9B03FF",
  },
  bouncingBalls: {
    ballMode: "random",
    mirrored: false,
    tail: 10,
    ballCount: 3,
    baseStripe,
  },
  fireFlame: {
    cooling: 120,
    sparking: 35,
  },
  colorWheel: {
    speed: 10,
  },
  frostyPike: {
    delay: 10,
    baseStripe,
  },
  dyingLights: {
    lightColor: "#9B03FF",
  },
  snake: {
    speed: 1,
    maxSnakeSize: 10,
    appleCount: 3,
  },

  bubbles: { colors: ["#24D024", "#EA0D0D"], maxParticles: 10, fadeValue: 10 },
  globals: {
    swatches: [
      "#25262b",
      "#868e96",
      "#fa5252",
      "#e64980",
      "#be4bdb",
      "#7950f2",
      "#4c6ef5",
      "#228be6",
      "#15aabf",
      "#12b886",
      "#40c057",
      "#82c91e",
      "#fab005",
      "#fd7e14",
    ],
  },
  chaser: {
    sourceId: "",
    name: "",
    setUp: {
      rowB: 0 as chasingFlag,
      colR: -1 as chasingFlag,
      rowT: -1 as chasingFlag,
      colL: -1 as chasingFlag,
    },
    clockWise: false,
    width: 114,
    height: 0,
    startLed: 0,
  },
  staticLight: { baseStripe },
  animation: { frames: frames, fps: 3 },
  device: { name: "", ip: "", neoPixelCount: 42, new: false, exclude: false },
  task: { taskCode: "dashboard" },
};

export interface StaticLightInterface {
  baseStripe: string[];
}

export interface GlobalsInterface {
  swatches: string[];
}

export interface ChaserInterface {
  sourceId: string;
  name: string;
  setUp: {
    rowB: chasingFlag;
    colR: chasingFlag;
    rowT: chasingFlag;
    colL: chasingFlag;
  };
  startLed: number;
  clockWise: boolean;
  width: number;
  height: number;
}

export interface DeviceInterface {
  ip: string;
  name: string;
  neoPixelCount: number;
  new: boolean;
  exclude: boolean;
}

export interface TaskInterface {
  taskCode: string;
}

export interface ConfigInterface {
  id?: number;
  device: DeviceInterface;
  chaser: ChaserInterface;
  globals: GlobalsInterface;
  dyingLights: DyingLightsInterface;
  frostyPike: FrostyPikeInterface;
  colorWheel: ColorWheelInterface;
  fireFlame: FireFlameInterface;
  bouncingBalls: BouncingBallsInterface;
  meteorRain: MeteorRainInterface;
  snake: SnakeInterface;
  bubbles: BubblesInterface;
  task: TaskInterface;
  staticLight: StaticLightInterface;
  animation: AnimationInterface;
}

export interface DeviceTableInterface {
  id: number;
  ip: string;
  name: string;
  neoPixelCount: number;
  new: boolean;
  exclude: boolean;
  configId: number;
}

export interface ConfigsTableInterface {
  id: number;
  deviceId: number;
  taskId: number;
  name: string;
  config:
    | AnimationInterface
    | StaticLightInterface
    | MeteorRainInterface
    | BouncingBallsInterface
    | FireFlameInterface
    | ColorWheelInterface
    | FrostyPikeInterface
    | DyingLightsInterface
    | SnakeInterface
    | BubblesInterface;
}

export enum TaskTypes {
  chaser = "chaser",
  effect = "effect",
  render = "render",
  ui = "ui",
}

export enum dbBool {
  true = "true",
  false = "false",
}

export enum TaskCodes {
  dashboard = "dashboard",
  library = "library",
  videoChaser = "videoChaser",
  animation = "animation",
  dyingLights = "dyingLights",
  frostyPike = "frostyPike",
  colorWheel = "colorWheel",
  fireFlame = "fireFlame",
  bouncingBalls = "bouncingBalls",
  meteorRain = "meteorRain",
  snake = "snake",
  bubbles = "bubbles",
  staticLight = "staticLight",
}

export interface TaskTableInterface {
  id: number;
  taskCode: TaskCodes;
  label: string;
  type: TaskTypes;
  favorite: dbBool;
  formScheme: JSON;
}

export interface UserTableInterface {
  id: number;
  swatches: string[];
}

export enum TableNames {
  devices = "devices",
  configs = "configs",
  tasks = "tasks",
  users = "users",
}

export function addElementToTable(tableIdentifier: TableNames, element: any) {
  return db[tableIdentifier].add(element);
}

export function updateElementInTable(
  tableIdentifier: TableNames,
  id: number,
  element: any
) {
  return db[tableIdentifier].update(id, element);
}

export function deleteElementFromTable(
  tableIdentifier: TableNames,
  id: number
) {
  return db[tableIdentifier].delete(id);
}

export function getElementFromTable(tableIdentifier: TableNames, id: number) {
  return db[tableIdentifier].get(id);
}

export class ScreenChaserDB extends Dexie {
  configs!: Table<ConfigsTableInterface>;
  devices!: Table<DeviceTableInterface>;
  tasks!: Table<TaskTableInterface>;
  users!: Table<UserTableInterface>;

  constructor() {
    super("ScreenChaserDatabase");
    this.version(Number(packageJson.databaseVersion)).stores({
      configs: "++id, deviceId, taskId, name, config",
      devices: "++id, ip, name, neoPixelCount, new, exclude, taskId",
      tasks: "++id, taskCode, formScheme, label, type, favorite",
      users: "++id, swatches",
    });
  }
}

export const db = new ScreenChaserDB();

db.on("populate", (tx: Transaction) => {
  tx.table("tasks").bulkAdd([
    {
      taskCode: TaskCodes.dashboard,
      label: "Dashboard",
      type: TaskTypes.ui,
      favorite: "true",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.library,
      label: "Library",
      type: TaskTypes.ui,
      favorite: "true",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.videoChaser,
      label: "Video Chaser",
      type: TaskTypes.chaser,
      favorite: "true",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.animation,
      label: "Animation",
      type: TaskTypes.render,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.staticLight,
      label: "Static Light",
      type: TaskTypes.render,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.dyingLights,
      label: "Dying Lights",
      type: TaskTypes.effect,
      favorite: "true",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.frostyPike,
      label: "Frosty Pike",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.colorWheel,
      label: "Color Wheel",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.fireFlame,
      label: "Fire Flame",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.bouncingBalls,
      label: "Bouncing Balls",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.meteorRain,
      label: "Meteor Rain",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.snake,
      label: "Snake",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
    {
      taskCode: TaskCodes.bubbles,
      label: "Bubbles",
      type: TaskTypes.effect,
      favorite: "false",
      formScheme: {},
    },
  ]);
});
