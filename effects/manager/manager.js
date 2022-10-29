const DataEmitter = require("../network/dataEmitter");
const MeteorRain = require("../meteor");
const BouncingBalls = require("../bouncingBalls");
const FireFlame = require("../fireFlame");
const ColorWheel = require("../colorWheel");
const FrostyPike = require("../frostyPike");
const DyingLights = require("../dyingLights");
const Snake = require("../snake");
const { hexToRgb } = require("../basics/convertRgbHex");
const setAll = require("../basics/setAll");

class Manager {
  constructor(options) {
    this.intervals = [];
    this.runningEffects = [];
    this.emitters = [];
    this.configs = [];
    this.debounce = null;
  }

  prepareBaseStipe(stripeFromUi) {
    return stripeFromUi.map((color) => color.replace("#", ""));
  }

  deepEqual(object1, object2) {
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

  isObject(object) {
    return object != null && typeof object === "object";
  }

  setDebouncedConfigs(newConfigs) {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    this.debounce = setTimeout(() => {
      this.setConfigs(newConfigs);
      this.debounce = null;
    }, 1000);
  }

  setConfigs(newConfigs) {
    if (!newConfigs) return;
    newConfigs.forEach((newConfig) => {
      const knownConfigIndex = this.configs.findIndex((config) => {
        return config.device.ip === newConfig.device.ip;
      });
      if (knownConfigIndex > -1) {
        if (!this.deepEqual(this.configs[knownConfigIndex], newConfig)) {
          this.configs[knownConfigIndex] = newConfig;
          this.setAnimation(knownConfigIndex, newConfig);
        }
      } else {
        this.configs.push(newConfig);
        this.setAnimation(knownConfigIndex, newConfig);
      }
    });
  }

  setAnimation(foundIndex, config) {
    const neopixelCount = config.device.neoPixelCount;
    const index = foundIndex === -1 ? this.runningEffects.length : foundIndex;
    clearInterval(this.intervals[index]);

    if (foundIndex === -1) {
      this.emitters.push(new DataEmitter(false, config.device.ip));
      this.runningEffects.push(null);
      this.intervals.push(setInterval(() => {}, 1000));
    }

    switch (config.task.taskCode) {
      case "meteorRain":
        const { meteorRain } = config;
        const {
          r: red,
          g: green,
          b: blue,
        } = hexToRgb(meteorRain.meteorColor.substring(1));
        this.runningEffects[index] = new MeteorRain({
          ...meteorRain,
          neopixelCount,
          red,
          green,
          blue,
        });
        break;

      case "bouncingBalls":
        const { bouncingBalls } = config;
        this.runningEffects[index] = new BouncingBalls({
          ...bouncingBalls,
          neopixelCount,
          baseStripe: this.prepareBaseStipe(bouncingBalls.baseStripe),
        });
        break;

      case "fireFlame":
        const { fireFlame } = config;
        this.runningEffects[index] = new FireFlame({
          ...fireFlame,
          neopixelCount,
        });
        break;

      case "colorWheel":
        const { colorWheel } = config;
        this.runningEffects[index] = new ColorWheel({
          ...colorWheel,
          neopixelCount,
        });
        break;

      case "frostyPike":
        const { frostyPike } = config;
        this.runningEffects[index] = new FrostyPike({
          ...frostyPike,
          neopixelCount,
          baseStripe: this.prepareBaseStipe(frostyPike.baseStripe),
        });
        break;

      case "dyingLights":
        const { dyingLights } = config;
        this.runningEffects[index] = new DyingLights({
          ...dyingLights,
          neopixelCount,
        });
        break;

      case "snake":
        const { snake } = config;
        this.runningEffects[index] = new Snake({
          ...snake,
          neopixelCount,
        });
        break;

      case "chaser":
        return;

      case "staticLight":
        const { staticLight } = config;
        this.emitters[index].emit(
          this.prepareBaseStipe(staticLight.baseStripe)
        );
        return;

      default:
        break;
    }

    const that = this;
    if (this.runningEffects[index] !== null)
      this.intervals[index] = setInterval(() => {
        that.emitters[index].emit(that.runningEffects[index].render());
      }, 100);
  }

  stopAll() {
    this.intervals.forEach((interval) => clearInterval(interval));
  }

  lightsOff() {
    this.stopAll();
    this.emitters.forEach((emitter, i) => {
      const neoPixelCount = this.configs[i].device.neoPixelCount;
      emitter.emit(setAll(0, 0, 0, neoPixelCount));
    });
  }
}

module.exports = Manager;
