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
