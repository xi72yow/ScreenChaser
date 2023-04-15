import Animation from "../animation";
import setAll from "../basics/setAll";
import BouncingBalls from "../bouncingBalls";
import Bubbles from "../bubbles";
import ColorWheel from "../colorWheel";
import DyingLights from "../dyingLights";
import FireFlame from "../fireFlame";
import FrostyPike from "../frostyPike";
import MeteorRain from "../meteorRain.js";
import DataEmitter, { DataEmitterInterface } from "../network/dataEmitter";
import Snake from "../snake";
import { EffectInterface, TaskCodes } from "../types";

interface ManagedChaser {
  device: any;
  config: any;
  interval: NodeJS.Timeout | undefined;
  runningEffect: EffectInterface | undefined;
  emitter: DataEmitterInterface;
}

export interface ManagerInterface {
  setChaser(param: { config: any; device: any }): void;
  lightsOff(): void;
  continueLight(): void;
  chasers: Map<number, ManagedChaser>;
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
    const chaser = this.chasers.get(device.id);

    if (chaser) {
      const configChanged = !this.deepEqual(chaser.config, config);
      const deviceChanged = !this.deepEqual(chaser.device, device);
      if (configChanged) chaser.config = config;
      if (deviceChanged) chaser.device = device;
      if (configChanged || deviceChanged) this.chasers.set(device.id, chaser);
    } else {
      this.chasers.set(device.id, {
        device,
        config,
        interval: undefined,
        runningEffect: undefined,
        emitter: new DataEmitter(false, device.ip, this.onEmit),
      });
    }
    this.startChaserTask(device.id);
  }

  startChaserTask(deviceId: number): void {
    const chaser = this.chasers.get(deviceId);
    if (chaser) {
      const { config, device, emitter, interval, runningEffect } = chaser;
      if (device.exclude) return;
      const { neoPixelCount } = device;
      clearInterval(interval);

      switch (config.taskCode) {
        case TaskCodes.meteorRain:
          const { meteorRain } = config;
          chaser.runningEffect = new MeteorRain({
            ...meteorRain,
            neoPixelCount,
          });
          break;

        case TaskCodes.bouncingBalls:
          const { bouncingBalls } = config;
          chaser.runningEffect = new BouncingBalls({
            ...bouncingBalls,
            neoPixelCount,
            baseStripe: this.prepareBaseStipe(bouncingBalls.baseStripe),
          });
          break;

        case TaskCodes.fireFlame:
          const { fireFlame } = config;
          chaser.runningEffect = new FireFlame({
            ...fireFlame,
            neoPixelCount,
          });
          break;

        case TaskCodes.colorWheel:
          const { colorWheel } = config;
          chaser.runningEffect = new ColorWheel({
            ...colorWheel,
            neoPixelCount,
          });
          break;

        case TaskCodes.frostyPike:
          const { frostyPike } = config;
          chaser.runningEffect = new FrostyPike({
            ...frostyPike,
            neoPixelCount,
            baseStripe: this.prepareBaseStipe(frostyPike.baseStripe),
          });
          break;

        case TaskCodes.dyingLights:
          const { dyingLights } = config;
          chaser.runningEffect = new DyingLights({
            ...dyingLights,
            neoPixelCount,
          });
          break;

        case TaskCodes.snake:
          const { snake } = config;
          chaser.runningEffect = new Snake({
            ...snake,
            neoPixelCount,
          });
          break;

        case TaskCodes.bubbles:
          const { bubbles } = config;
          chaser.runningEffect = new Bubbles({
            ...bubbles,
            neoPixelCount,
          });
          break;

        case TaskCodes.animation:
          const { animation } = config;
          chaser.runningEffect = new Animation({
            ...animation,
            neoPixelCount,
          });
          break;

        case TaskCodes.videoChaser:
          chaser.runningEffect = undefined;
          return;

        case TaskCodes.staticLight:
          const { staticLight } = config;
          chaser.runningEffect = undefined;
          emitter.emit(this.prepareBaseStipe(staticLight.baseStripe));
          return;

        default:
          break;
      }

      chaser.interval = setInterval(() => {
        emitter.emit(runningEffect?.render());
      }, this.calculateFrameTime());
    }
  }

  sendChasingStripe(deviceId: number, stripe: string[]): void {
    const chaser = this.chasers.get(deviceId);
    if (chaser) {
      const { emitter, config } = chaser;
      if (config.taskCode !== TaskCodes.videoChaser) return;
      emitter.emit(stripe);
    }
  }

  lightsOff(): void {
    this.chasers.forEach((chaser) => {
      const { emitter, interval, device } = chaser;
      const { neoPixelCount } = device;
      clearInterval(interval);
      emitter.emit(setAll(0, 0, 0, neoPixelCount));
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
