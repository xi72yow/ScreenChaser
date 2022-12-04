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
import { EffectInterface } from "../types";

interface ManagedChaser {
  config: any;
  interval: NodeJS.Timeout | undefined;
  runningEffect: EffectInterface | undefined;
  emitter: DataEmitterInterface;
}

export interface ManagerInterface {
  setDebouncedConfigs: (configs: any[]) => void;
  setConfigs: (configs: any[]) => void;
  lightsOff(): void;
  chasers: ManagedChaser[];
}

class Manager implements ManagerInterface {
  chasers: ManagedChaser[];
  debounce: NodeJS.Timeout | null;
  framerate: number;

  constructor() {
    this.chasers = [];
    this.debounce = null;
    this.framerate = 9.8;
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

  setDebouncedConfigs(newConfigs: any[]) {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    this.debounce = setTimeout(() => {
      this.setConfigs(newConfigs);
      this.debounce = null;
    }, 1000);
  }

  setConfigs(newConfigs: any[]) {
    if (!newConfigs) return;
    newConfigs.forEach((newConfig: any) => {
      const knownConfigIndex = this.chasers.findIndex((config) => {
        return config.config.device.ip === newConfig.device.ip;
      });
      if (knownConfigIndex > -1) {
        if (!this.deepEqual(this.chasers[knownConfigIndex].config, newConfig)) {
          this.chasers[knownConfigIndex].config = newConfig;
          this.setAnimation(knownConfigIndex, newConfig);
        }
      } else {
        this.chasers.push({
          config: { ...newConfig },
          interval: undefined,
          runningEffect: undefined,
          emitter: new DataEmitter(false, newConfig.device.ip),
        });
        this.setAnimation(this.chasers.length - 1, newConfig);
      }
    });
  }

  setAnimation(foundIndex: number, config: any) {
    const neopixelCount = config.device.neoPixelCount;
    const index = foundIndex === -1 ? this.chasers.length : foundIndex;
    clearInterval(this.chasers[index].interval);

    switch (config.task.taskCode) {
      case "meteorRain":
        const { meteorRain } = config;
        this.chasers[index].runningEffect = new MeteorRain({
          ...meteorRain,
          neopixelCount,
        });
        break;

      case "bouncingBalls":
        const { bouncingBalls } = config;
        this.chasers[index].runningEffect = new BouncingBalls({
          ...bouncingBalls,
          neopixelCount,
          baseStripe: this.prepareBaseStipe(bouncingBalls.baseStripe),
        });
        break;

      case "fireFlame":
        const { fireFlame } = config;
        this.chasers[index].runningEffect = new FireFlame({
          ...fireFlame,
          neopixelCount,
        });
        break;

      case "colorWheel":
        const { colorWheel } = config;
        this.chasers[index].runningEffect = new ColorWheel({
          ...colorWheel,
          neopixelCount,
        });
        break;

      case "frostyPike":
        const { frostyPike } = config;
        this.chasers[index].runningEffect = new FrostyPike({
          ...frostyPike,
          neopixelCount,
          baseStripe: this.prepareBaseStipe(frostyPike.baseStripe),
        });
        break;

      case "dyingLights":
        const { dyingLights } = config;
        this.chasers[index].runningEffect = new DyingLights({
          ...dyingLights,
          neopixelCount,
        });
        break;

      case "snake":
        const { snake } = config;
        this.chasers[index].runningEffect = new Snake({
          ...snake,
          neopixelCount,
        });
        break;

      case "bubbles":
        const { bubbles } = config;
        this.chasers[index].runningEffect = new Bubbles({
          ...bubbles,
          neopixelCount,
        });
        break;

      case "animation":
        const { animation } = config;
        this.chasers[index].runningEffect = new Animation({
          ...animation,
          neopixelCount,
        });
        break;

      case "chaser":
        this.chasers[index].runningEffect = undefined;
        return;

      case "staticLight":
        const { staticLight } = config;
        this.chasers[index].runningEffect = undefined;
        this.chasers[index].emitter.emit(
          this.prepareBaseStipe(staticLight.baseStripe)
        );
        return;

      default:
        break;
    }

    this.start(index);
  }

  startAll() {
    this.chasers.forEach((effect, index) => {
      this.start(index);
    });
  }

  sendChasingStripe(stripe: string | any[], ip: string) {
    this.chasers.findIndex((managedChaser, index, array) => {
      if (managedChaser.config.device.ip === ip) {
        if (managedChaser.config.task.taskCode === "chaser")
          managedChaser.emitter.emit(stripe);
      }
    });
  }

  start(index: number) {
    const that = this;
    if (this.chasers[index].runningEffect) {
      this.chasers[index].interval = setInterval(() => {
        that.chasers[index].emitter.emit(
          that.chasers[index].runningEffect?.render()
        );
      }, this.calculateMillis());
    } else if (this.chasers[index].config.task.taskCode === "staticLight") {
      const { staticLight } = this.chasers[index].config;
      this.chasers[index].emitter.emit(
        this.prepareBaseStipe(staticLight.baseStripe)
      );
    }
  }

  calculateMillis() {
    return 1000 / this.framerate;
  }

  stopAll() {
    this.chasers.forEach((managedChaser) =>
      clearInterval(managedChaser.interval)
    );
  }

  lightsOff() {
    this.stopAll();
    this.chasers.forEach((managedChaser) => {
      const neoPixelCount = managedChaser.config.device.neoPixelCount;
      managedChaser.emitter.emit(setAll(0, 0, 0, neoPixelCount));
    });
  }
}

export default Manager;
