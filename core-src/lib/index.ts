//export all effects with types
export { default as SpaceShuttle, SpaceShuttleInterface } from "./spaceShuttle";
export { default as ColorWheel, ColorWheelInterface } from "./colorWheel";
export { default as FrostyPike, FrostyPikeInterface } from "./frostyPike";
export { default as DyingLights, DyingLightsInterface } from "./dyingLights";
export { default as Snake, SnakeInterface } from "./snake";
export { default as Bubbles, BubblesInterface } from "./bubbles";
export {
  default as BouncingBalls,
  BouncingBallsInterface,
} from "./bouncingBalls";
export { default as FireFlame, FireFlameInterface } from "./fireFlame";

// export complex core utils with types
export { default as Manager, ManagerInterface } from "./manager/manager.js";
export {
  default as DataEmitter,
  DataEmitterInterface,
} from "./network/dataEmitter.js";

// export some functions
export { reScale } from "./basics/reScale";
export { default as setAll } from "./basics/setAll";
export { rgbToHex } from "./basics/convertRgbHex";
export { random, randomColor } from "./basics/random";
