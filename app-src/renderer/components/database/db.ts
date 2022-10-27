import Dexie, { Table } from "dexie";

export const initilalValues = {
  meteorRain: {
    meteorSize: 10,
    meteorTrailDecay: 64,
    meteorRandomDecay: 7,
    rainbow: false,
    meteorColor: "#9B03FF",
  },
  bouncingBalls: {
    ballMode: "random",
    mirrored: false,
    tail: false,
    ballCount: 3,
    baseStripe: [],
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
    baseStripe: [],
  },
  dyingLights: {
    lightColor: "#9B03FF",
  },
  snake: {
    speed: 1,
    maxSnakeSize: 10,
    appleCount: 3,
  },
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
  staticLight: { baseStripe: [] },
  device: { name: "", ip: "", neoPixelCount: 42, new: false },
  task: { taskCode: "dashboard" },
};

export interface MeteorRainInterface {
  meteorSize: number;
  meteorTrailDecay: number;
  meteorRandomDecay: number;
  rainbow: boolean;
  meteorColor: string;
}

export interface BouncingBallsInterface {
  ballMode: string;
  mirrored: boolean;
  tail: boolean;
  ballCount: number;
  baseStripe: string[];
}

export interface StaticLightInterface {
  baseStripe: string[];
}

export interface FireFlameInterface {
  cooling: number;
  sparking: number;
}

export interface ColorWheelInterface {
  speed: number;
}

export interface FrostyPikeInterface {
  delay: number;
  baseStripe: string[];
}

export interface DyingLightsInterface {
  lightColor: string;
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

export interface SnakeInterface {
  speed: number;
  maxSnakeSize: number;
  appleCount: number;
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
  task: TaskInterface;
  staticLight: StaticLightInterface;
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
