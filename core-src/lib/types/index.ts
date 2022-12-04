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
  neopixelCount: number;
}

export interface EffectInterface {
  render(): any;
  getIdentifier(): EffectsIdentifier;
}
