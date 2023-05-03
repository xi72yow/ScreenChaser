//defaut reusable values
type EffectsIdentifier =
  | "meteorRain"
  | "bouncingBalls"
  | "fireFlame"
  | "colorWheel"
  | "frostyPike"
  | "dyingLights"
  | "snake"
  | "bubbles"
  | "animation"
  | "chaser"
  | "staticLight"
  | "spaceShuttle";

export interface CoreChaserEffectInterface {
  neoPixelCount: number;
}

export interface EffectInterface {
  render(): any;
  getIdentifier(): EffectsIdentifier;
}

export enum TaskCodes {
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

export enum ChaserTypes {
  WLED = "WLED",
  ScreenChaser = "ScreenChaser",
  Scanner = "Scanner",
}

//export all effects types
export type { SpaceShuttleInterface } from "../spaceShuttle";
export type { ColorWheelInterface } from "../colorWheel";
export type { FrostyPikeInterface } from "../frostyPike";
export type { DyingLightsInterface } from "../dyingLights";
export type { SnakeInterface } from "../snake";
export type { BubblesInterface } from "../bubbles";
export type { AnimationInterface } from "../animation";
export type { MeteorRainInterface } from "../meteorRain";
export type { BouncingBallsInterface } from "../bouncingBalls";
export type { FireFlameInterface } from "../fireFlame";

// export complex core utils types
export type { ManagerInterface } from "../manager/taskManager";
export type { DataEmitterInterface } from "../network/wledEmitter";
