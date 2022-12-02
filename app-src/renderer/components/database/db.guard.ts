/*
 * Generated type guards for "db.ts".
 * WARNING: Do not manually change this file.
 */
import {
  MeteorRainInterface,
  BouncingBallsInterface,
  StaticLightInterface,
  FireFlameInterface,
  ColorWheelInterface,
  FrostyPikeInterface,
  DyingLightsInterface,
  GlobalsInterface,
  ChaserInterface,
  DeviceInterface,
  TaskInterface,
  SnakeInterface,
  BubblesInterface,
  AnimationInterface,
  ConfigInterface,
} from "./db";

export function isMeteorRainInterface(
  obj: unknown
): obj is MeteorRainInterface {
  const typedObj = obj as MeteorRainInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["meteorSize"] === "number" &&
    typeof typedObj["meteorTrailDecay"] === "number" &&
    typeof typedObj["meteorRandomDecay"] === "number" &&
    typeof typedObj["rainbow"] === "boolean" &&
    typeof typedObj["meteorColor"] === "string"
  );
}

export function isBouncingBallsInterface(
  obj: unknown
): obj is BouncingBallsInterface {
  const typedObj = obj as BouncingBallsInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["ballMode"] === "string" &&
    typeof typedObj["mirrored"] === "boolean" &&
    typeof typedObj["tail"] === "number" &&
    typeof typedObj["ballCount"] === "number" &&
    Array.isArray(typedObj["baseStripe"]) &&
    typedObj["baseStripe"].every((e: any) => typeof e === "string")
  );
}

export function isStaticLightInterface(
  obj: unknown
): obj is StaticLightInterface {
  const typedObj = obj as StaticLightInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    Array.isArray(typedObj["baseStripe"]) &&
    typedObj["baseStripe"].every((e: any) => typeof e === "string")
  );
}

export function isFireFlameInterface(obj: unknown): obj is FireFlameInterface {
  const typedObj = obj as FireFlameInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["cooling"] === "number" &&
    typeof typedObj["sparking"] === "number"
  );
}

export function isColorWheelInterface(
  obj: unknown
): obj is ColorWheelInterface {
  const typedObj = obj as ColorWheelInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["speed"] === "number"
  );
}

export function isFrostyPikeInterface(
  obj: unknown
): obj is FrostyPikeInterface {
  const typedObj = obj as FrostyPikeInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["delay"] === "number" &&
    Array.isArray(typedObj["baseStripe"]) &&
    typedObj["baseStripe"].every((e: any) => typeof e === "string")
  );
}

export function isDyingLightsInterface(
  obj: unknown
): obj is DyingLightsInterface {
  const typedObj = obj as DyingLightsInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["lightColor"] === "string"
  );
}

export function isGlobalsInterface(obj: unknown): obj is GlobalsInterface {
  const typedObj = obj as GlobalsInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    Array.isArray(typedObj["swatches"]) &&
    typedObj["swatches"].every((e: any) => typeof e === "string")
  );
}

export function isChaserInterface(obj: unknown): obj is ChaserInterface {
  const typedObj = obj as ChaserInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["sourceId"] === "string" &&
    typeof typedObj["name"] === "string"
  );
}

export function isDeviceInterface(obj: unknown): obj is DeviceInterface {
  const typedObj = obj as DeviceInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["ip"] === "string" &&
    typeof typedObj["name"] === "string" &&
    typeof typedObj["neoPixelCount"] === "number" &&
    typeof typedObj["new"] === "boolean"
  );
}

export function isTaskInterface(obj: unknown): obj is TaskInterface {
  const typedObj = obj as TaskInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["taskCode"] === "string"
  );
}

export function isSnakeInterface(obj: unknown): obj is SnakeInterface {
  const typedObj = obj as SnakeInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["speed"] === "number" &&
    typeof typedObj["maxSnakeSize"] === "number" &&
    typeof typedObj["appleCount"] === "number"
  );
}

export function isBubblesInterface(obj: unknown): obj is BubblesInterface {
  const typedObj = obj as BubblesInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["maxParticles"] === "number" &&
    typeof typedObj["fadeValue"] === "number" &&
    Array.isArray(typedObj["colors"]) &&
    typedObj["colors"].every((e: any) => typeof e === "string")
  );
}

export function isAnimationInterface(obj: unknown): obj is AnimationInterface {
  const typedObj = obj as AnimationInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    Array.isArray(typedObj["frames"]) &&
    typedObj["frames"].every(
      (e: any) => Array.isArray(e) && e.every((e: any) => typeof e === "string")
    ) &&
    typeof typedObj["fps"] === "number"
  );
}

export function isConfigInterface(obj: unknown): obj is ConfigInterface {
  const typedObj = obj as ConfigInterface;
  return (
    ((typedObj !== null && typeof typedObj === "object") ||
      typeof typedObj === "function") &&
    typeof typedObj["id"] === "number" &&
    (isDeviceInterface(typedObj["device"]) as boolean) &&
    (isChaserInterface(typedObj["chaser"]) as boolean) &&
    (isGlobalsInterface(typedObj["globals"]) as boolean) &&
    (isDyingLightsInterface(typedObj["dyingLights"]) as boolean) &&
    (isFrostyPikeInterface(typedObj["frostyPike"]) as boolean) &&
    (isColorWheelInterface(typedObj["colorWheel"]) as boolean) &&
    (isFireFlameInterface(typedObj["fireFlame"]) as boolean) &&
    (isBouncingBallsInterface(typedObj["bouncingBalls"]) as boolean) &&
    (isMeteorRainInterface(typedObj["meteorRain"]) as boolean) &&
    (isSnakeInterface(typedObj["snake"]) as boolean) &&
    (isBubblesInterface(typedObj["bubbles"]) as boolean) &&
    (isTaskInterface(typedObj["task"]) as boolean) &&
    (isStaticLightInterface(typedObj["staticLight"]) as boolean) &&
    (isAnimationInterface(typedObj["animation"]) as boolean)
  );
}
