import Animation from "../animation";
import setAll from "../basics/setAll";
import BouncingBalls from "../bouncingBalls";
import Bubbles from "../bubbles";
import ColorWheel from "../colorWheel";
import DyingLights from "../dyingLights";
import FireFlame from "../fireFlame";
import FrostyPike from "../frostyPike";
import MeteorRain from "../meteorRain";
import DataEmitter, { DataEmitterInterface } from "../network/wledEmitter";
import Snake from "../snake";
import { EffectInterface, TaskCodes } from "../types";

interface ManagedChaser {
  device: any;
  config: any;
  interval: NodeJS.Timeout | undefined;
  runningEffect: EffectInterface | undefined;
  emitter: DataEmitterInterface;
  debounce: NodeJS.Timeout | null;
}

export interface ManagerInterface {
  setChaser(param: { config: any; device: any }): void;
  lightsOff(): void;
  continueLight(): void;
  chasers: Map<number, ManagedChaser>;
  videoChaserExists(): boolean;
}

export default class TaskManager implements ManagerInterface {
  framerate: number;
  onEmit: ((ip: string, pixelArray: string | any[]) => void) | undefined;
  chasers: Map<number, ManagedChaser>;

  constructor(onEmit?: (ip: string, pixelArray: string | any[]) => void) {
    this.onEmit = onEmit;
    this.chasers = new Map();
    this.framerate = 9.8;
  }

  setChaser(param: { config: any; device: any }): void {
    const { config, device } = param;
    let chaser = this.chasers.get(device.id);

    if (chaser)
      if (
        this.deepEqual(chaser.config, config) &&
        this.deepEqual(chaser.device, device)
      )
        return;

    if (chaser) {
      if (chaser.device.ip !== device.ip)
        chaser.emitter = new DataEmitter({
          ip: device.ip,
          onEmit: this.onEmit,
          type: device.type,
        });
      chaser.config = config;
      chaser.device = device;
    } else {
      this.chasers.set(device.id, {
        device,
        config,
        interval: undefined,
        runningEffect: undefined,
        emitter: new DataEmitter({
          ip: device.ip,
          onEmit: this.onEmit,
          type: device.type,
        }),
        debounce: null,
      });
    }

    chaser = this.chasers.get(device.id);

    if (!chaser) return;

    if (chaser.debounce) {
      clearTimeout(chaser.debounce);
    }

    chaser.debounce = setTimeout(() => {
      this.startChaserTask(device.id);
      if (chaser) chaser.debounce = null;
    }, 1000);
  }

  startChaserTask(deviceId: number): void {
    const chaser = this.chasers.get(deviceId);

    if (chaser) {
      let { config, device, emitter, interval } = chaser;

      if (device.exclude === "true") return;
      const { neoPixelCount } = device;
      clearInterval(interval);

      const { config: effectConfig } = config;

      switch (config.taskCode) {
        case TaskCodes.meteorRain:
          chaser.runningEffect = new MeteorRain({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.bouncingBalls:
          chaser.runningEffect = new BouncingBalls({
            ...effectConfig,
            neoPixelCount,
            //baseStripe: this.prepareBaseStipe(effectConfig.baseStripe),
          });
          break;

        case TaskCodes.fireFlame:
          chaser.runningEffect = new FireFlame({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.colorWheel:
          chaser.runningEffect = new ColorWheel({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.frostyPike:
          chaser.runningEffect = new FrostyPike({
            ...effectConfig,
            neoPixelCount,
            baseStripe: this.prepareBaseStipe(effectConfig.baseStripe[0]),
          });
          break;

        case TaskCodes.dyingLights:
          chaser.runningEffect = new DyingLights({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.snake:
          chaser.runningEffect = new Snake({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.bubbles:
          chaser.runningEffect = new Bubbles({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.animation:
          chaser.runningEffect = new Animation({
            ...effectConfig,
            neoPixelCount,
          });
          break;

        case TaskCodes.videoChaser:
          chaser.runningEffect = undefined;
          return;

        case TaskCodes.staticLight:
          chaser.runningEffect = undefined;
          emitter.emit(this.prepareBaseStipe(effectConfig.baseStripe[0]));
          return;

        default:
          break;
      }

      if (chaser.runningEffect)
        chaser.interval = setInterval(() => {
          chaser.emitter.emit(chaser.runningEffect?.render());
        }, this.calculateFrameTime());
    }
  }

  videoChaserExists(): boolean {
    return Array.from(this.chasers.values()).some(
      (chaser) => chaser.config.taskCode === TaskCodes.videoChaser
    );
  }

  sendChasingStripe(deviceId: number, stripe: string[]): void {
    const chaser = this.chasers.get(deviceId);
    if (chaser) {
      const { emitter, config, runningEffect } = chaser;
      if (runningEffect) return;
      if (config.taskCode !== TaskCodes.videoChaser) return;
      emitter.emit(stripe);
    }
  }

  sendStaticStripe(deviceId: number, stripe: string[]): void {
    const chaser = this.chasers.get(deviceId);
    if (chaser) {
      const { emitter } = chaser;
      emitter.emit(stripe);
    }
  }

  lightsOff(): void {
    this.chasers.forEach((chaser) => {
      const { emitter, interval, device } = chaser;
      const { neoPixelCount } = device;
      clearInterval(interval);
      emitter.emit(setAll(0, 0, 0, neoPixelCount));
      // make sure that the light is off
      setTimeout(() => {
        emitter.emit(setAll(0, 0, 0, neoPixelCount));
      }, 1000);
    });
  }

  continueLight(): void {
    this.chasers.forEach((chaser) => {
      const { emitter, interval, runningEffect } = chaser;
      clearInterval(interval);
      if (!runningEffect) return;
      chaser.interval = setInterval(() => {
        emitter.emit(runningEffect.render());
      }, this.calculateFrameTime());
    });
  }

  calculateFrameTime() {
    return 1000 / this.framerate;
  }

  prepareBaseStipe(stripeFromUi: string[]) {
    return stripeFromUi.map((color) => color.replace("#", ""));
  }

  deepEqual(object1: any, object2: any) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (const key of keys1) {
      const val1 = object1[key];
      const val2 = object2[key];
      const areObjects = this.isObject(val1) && this.isObject(val2);
      if (
        (areObjects && !this.deepEqual(val1, val2)) ||
        (!areObjects && val1 !== val2)
      ) {
        return false;
      }
    }
    return true;
  }

  isObject(object: any) {
    return object != null && typeof object === "object";
  }
}
