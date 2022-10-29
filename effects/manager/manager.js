const DataEmitter = require("./network/dataEmitter");
const MeteorRain = require("./meteor");
const BouncingBalls = require("./bouncingBalls");
const FireFlame = require("./fireFlame");
const ColorWheel = require("./colorWheel");
const FrostyPike = require("./frostyPike");
const DyingLights = require("./dyingLights");
const Snake = require("./snake");

class Manager {
  constructor(options) {
    const {} = options;
    this.intervals = [];
    this.runningEffects = [];
    this.emitters = [];
    this.configs = [];
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
      const areObjects = isObject(val1) && isObject(val2);
      if (
        (areObjects && !deepEqual(val1, val2)) ||
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

  setConfigs(newConfigs) {
    newConfigs.forEach((newConfig) => {
      const knownConfigIndex = this.configs.find((config) => {
        return config.device.ip === newConfig.device.ip;
      });
      if (knownConfigIndex > -1) {
        if (!this.deepEqual(this.configs[knownConfigIndex], newConfig)) {
          this.configs[knownConfigIndex] = newConfig;
        }
      } else {
        this.configs.push(newConfig);
      }
    });
  }

  setAnimation(foundIndex, config) {
    clearInterval(this.intervals[index]);
    const index = foundIndex === -1 ? this.runningEffects.length : foundIndex;

    if (foundIndex === -1) {
      this.emitters.push(new DataEmitter(false, config.device.ip));
      this.runningEffects.push(
        new FrostyPike({ delay: 10, neopixelCount: 60 })
      );
      this.intervals.push(setInterval(() => {}, 1000));
    }

    switch (config.task.taskCode) {
      case "meteor":
        this.runningEffects[index] = new MeteorRain(config.meteorRain);
        break;
      case "bouncingBalls":
        this.runningEffects[index] = new BouncingBalls(config.bouncingBalls);
        break;
      case "fireFlame":
        this.runningEffects[index] = new FireFlame(config.fireFlame);
        break;
      case "colorWheel":
        this.runningEffects[index] = new ColorWheel(config.colorWheel);
        break;
      case "frostyPike":
        this.runningEffects[index] = new FrostyPike(config.frostyPike);
        break;
      case "dyingLights":
        this.runningEffects[index] = new DyingLights(config.dyingLights);
        break;
      case "snake":
        this.runningEffects[index] = new Snake(config.snake);
        break;
      default:
        throw new Error("Unknown task code");
    }

    this.intervals[index] = setInterval(() => {
      this.emitters[index].emit(this.runningEffects[index].render());
    }, 100);
  }
}

module.exports = Manager;
