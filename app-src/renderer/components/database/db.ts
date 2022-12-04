import Dexie, { Table } from "dexie";
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
  chaser: { sourceId: "", name: "" },
  staticLight: { baseStripe },
  animation: { frames: frames, fps: 3 },
  device: { name: "", ip: "", neoPixelCount: 42, new: false },
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
}

export interface DeviceInterface {
  ip: string;
  name: string;
  neoPixelCount: number;
  new: boolean;
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

export async function addConfig(param) {
  try {
    // Add the new config to the DB
    const id = await db.configs.add({ ...initilalValues, ...param });
  } catch (error) {
    // Oops! We got an error!
    console.error(error);
  }
}

export async function updateConfig(id, config) {
  try {
    // Update the config in the DB
    await db.configs.update(id, config);
  } catch (error) {
    // Oops! We got an error!
    console.error(error);
  }
}

export async function deleteConfig(id) {
  try {
    // Delete the config from the DB
    await db.configs.delete(id);
  } catch (error) {
    // Oops! We got an error!
    console.error(error);
  }
}

export async function getConfig(id) {
  try {
    // Get the config from the DB
    return await db.configs.where("id").equals(1);
  } catch (error) {
    // Oops! We got an error!
    console.error(error);
  }
}

export class ScreenChaserDB extends Dexie {
  configs!: Table<ConfigInterface>;

  constructor() {
    super("ScreenChaserDatabase");
    this.version(1).stores({
      configs: "++id", // Primary key and indexed props
    });
  }
}

export const db = new ScreenChaserDB();
