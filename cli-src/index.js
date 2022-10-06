#!/usr/bin/env node
const inquirer = require("inquirer");
const chalk = require("chalk");
const MeteorRain = require("./effects_build/meteor");
const DataEmitter = require("./effects_build/network/dataEmitter");
const BouncingBalls = require("./effects_build/bouncingBalls");
const FireFlame = require("./effects_build/fireFlame");
const ColorWheel = require("./effects_build/colorWheel");
const FrostyPike = require("./effects_build/frostyPike");
const DyingLights = require("./effects_build/dyingLights");
const fs = require("fs");

const yellow = chalk.hex("#ffbb00");
const pink = chalk.hex("#af0069");

let savedConfigs = [];
let effectConfig = {};
let xSlaves = [];
let intervals = [];
const FRAMETIME = 1000 / 10;

function askFor8BitValue(name, message, defaultNumber) {
  return inquirer.prompt([
    {
      type: "input",
      name: name,
      message: `Enter ${message} Value (0-255)`,
      default: defaultNumber,
      validate: (value) => (isNaN(parseInt(value)) ? "Not a number!" : true),
      filter: (value) => (isNaN(parseInt(value)) ? value : parseInt(value, 10)),
    },
  ]);
}

function askForBoolean(name, message, defaultBoolean) {
  return inquirer.prompt([
    {
      type: "confirm",
      name: name,
      message: message,
      default: defaultBoolean,
    },
  ]);
}

function chooseFromList(name, message, choices) {
  return inquirer.prompt([
    {
      type: "list",
      name: name,
      message: message,
      choices: choices,
    },
  ]);
}

function clearTerminal() {
  console.clear();
  console.log(pink("Screen") + yellow("Chaser") + " CLI " + "by @xi72yow");
}

async function app() {
  clearTerminal();
  try {
    const savedConfigsTxt = await fs.promises.readFile("./.ScreenChaser.json");
    savedConfigs = JSON.parse(savedConfigsTxt);
  } catch (err) {
    console.log(err);
    console.log(
      "If this is the first time you are running this, ignore this error."
    );
    console.log("After you have saved a config, this error will go away.");
  }

  let counter = 0;
  xSlaves = savedConfigs.map((conf, index, array) => conf.deviceIp);
  while (xSlaves.length < 1) {
    const DataEmitterForIP = new DataEmitter(false);
    await DataEmitterForIP.init();
    const detectedDevices = DataEmitterForIP.getSlaves();
    xSlaves = detectedDevices.map((slave) => {
      return slave.ip;
    });
    counter++;
    if (counter > 10) {
      console.log(
        "No devices found. Please check if the device is available in network."
      );
      process.exit(0);
    }
  }

  for (let i = 0; i < savedConfigs.length; i++) {
    const config = savedConfigs[i];
    if (config.choosenLight === "static Light") {
    } else
      switch (config.effectConfig.type) {
        case "MeteorRain": {
          const MeteorRainEffect = new MeteorRain(config.effectConfig);
          const DataEmitterForIP = new DataEmitter(false, config.deviceIp);
          let count;
          setInterval(() => {
            count++;
            if (count % 60 === 0) {
              DataEmitterForIP.logHealth();
              DataEmitterForIP.logMaxPower();
            }
            DataEmitterForIP.emit(MeteorRainEffect.render());
          }, FRAMETIME);
          break;
        }

        default:
          break;
      }
    const element = savedConfigs[i];
  }

  const deviceIp = await inquirer.prompt([
    {
      type: "list",
      name: "deviceIp",
      message: "Which Chaser would you like config?",
      choices: xSlaves,
    },
  ]);

  const neopixelCount = await inquirer.prompt([
    {
      type: "input",
      name: "neopixelCount",
      message: "How many LEDs has the device?",
      default: "1",
      validate: (value) => (isNaN(parseInt(value)) ? "Not a number!" : true),
      filter: (value) => (isNaN(parseInt(value)) ? value : parseInt(value, 10)),
    },
  ]);

  const choosenLight = await inquirer.prompt([
    {
      type: "list",
      name: "choosenLight",
      message: "What do you prefer?",
      choices: ["static Light", "effect Light"],
    },
  ]);

  if (choosenLight.choosenLight === "static Light") {
    const choosenColorR = await askFor8BitValue("choosenColorR", "Red", 255);
    const choosenColorG = await askFor8BitValue("choosenColorG", "Green", 187);
    const choosenColorB = await askFor8BitValue("choosenColorB", "Blue", 0);

    choosenColor = [
      choosenColorR.choosenColorR,
      choosenColorG.choosenColorG,
      choosenColorB.choosenColorB,
    ];
    console.log(choosenColor);
  } else {
    const choosenEffect = await inquirer.prompt([
      {
        type: "list",
        name: "choosenEffect",
        message: "Which effect would you like to use?",
        choices: [
          "MeteorRain",
          "BouncingBalls",
          "FireFlame",
          "ColorWheel",
          "FrostyPike",
          "DyingLights",
        ],
      },
    ]);

    switch (choosenEffect.choosenEffect) {
      case "MeteorRain": {
        const red = await askFor8BitValue("red", "Red", 255);
        const green = await askFor8BitValue("green", "Green", 187);
        const blue = await askFor8BitValue("blue", "Blue", 0);
        const meteorSize = await askFor8BitValue(
          "meteorSize",
          "Meteor Size",
          10
        );
        const meteorTrailDecay = await askFor8BitValue(
          "meteorTrailDecay",
          "Meteor Trail Decay",
          64
        );
        const meteorRandomDecay = await askFor8BitValue(
          "meteorRandomDecay",
          "Meteor Random Decay",
          0
        );
        const rainbow = await askForBoolean(
          "rainbow",
          "Rainbow Meteor?",
          false
        );
        effectConfig = {
          type: "MeteorRain",
          red: red.red,
          green: green.green,
          blue: blue.blue,
          meteorSize: meteorSize.meteorSize,
          meteorTrailDecay: meteorTrailDecay.meteorTrailDecay,
          meteorRandomDecay: meteorRandomDecay.meteorRandomDecay,
          rainbow: rainbow.rainbow,
          neopixelCount: neopixelCount.neopixelCount,
        };
        console.log(effectConfig);
        break;
      }

      case "BouncingBalls": {
        const ballMode = await chooseFromList("ballMode", "Ball Mode", [
          "random",
          "rainbow",
          "single",
        ]);
        const mirrored = await askForBoolean("mirrored", "Mirrored?", false);
        const tail = await askForBoolean("tail", "Tail?", false);
        const BallCount = await askFor8BitValue("BallCount", "Ball Count", 1);
        const baseStripeQ = await askForBoolean(
          "baseStripeQ",
          "Base Stripe?",
          false
        );
        let baseStripe = null;
        if (baseStripeQ.baseStripeQ) {
          const baseStripeR = await askFor8BitValue("baseStripeR", "Red", 255);
          const baseStripeG = await askFor8BitValue(
            "baseStripeG",
            "Green",
            187
          );
          const baseStripeB = await askFor8BitValue("baseStripeB", "Blue", 0);
          baseStripe = Array(neopixelCount).fill([
            baseStripeR.baseStripeR,
            baseStripeG.baseStripeG,
            baseStripeB.baseStripeB,
          ]);
        }
        effectConfig = {
          type: "BouncingBalls",
          ballMode: ballMode.ballMode,
          mirrored: mirrored.mirrored,
          tail: tail.tail,
          BallCount: BallCount.BallCount,
          neopixelCount: neopixelCount.neopixelCount,
          baseStripe: baseStripe,
        };
        console.log(effectConfig);
        break;
      }

      case "FireFlame": {
        const cooling = await askFor8BitValue("cooling", "Cooling", 55);
        const sparking = await askFor8BitValue("sparking", "Sparking", 120);
        effectConfig = {
          type: "FireFlame",
          cooling: cooling.cooling,
          sparking: sparking.sparking,
          neopixelCount: neopixelCount.neopixelCount,
        };
        console.log(effectConfig);
        break;
      }

      case "ColorWheel": {
        const speed = await askFor8BitValue("speed", "Speed", 10);
        effectConfig = {
          type: "ColorWheel",
          neopixelCount: neopixelCount.neopixelCount,
          speed: speed.speed,
        };
        console.log(effectConfig);
        break;
      }

      case "FrostyPike": {
        const delay = await askFor8BitValue("delay", "Delay", 10);
        const baseStripeR = await askFor8BitValue("baseStripeR", "Red", 255);
        const baseStripeG = await askFor8BitValue("baseStripeG", "Green", 187);
        const baseStripeB = await askFor8BitValue("baseStripeB", "Blue", 0);
        const baseStripe = Array(neopixelCount).fill([
          baseStripeR.baseStripeR,
          baseStripeG.baseStripeG,
          baseStripeB.baseStripeB,
        ]);
        effectConfig = {
          type: "FrostyPike",
          baseStripe: baseStripe,
          neopixelCount: neopixelCount.neopixelCount,
          delay: delay.delay,
        };
        console.log(effectConfig);
        break;
      }

      case "DyingLights": {
        const red = await askFor8BitValue("red", "Red", 155);
        const green = await askFor8BitValue("green", "Green", 3);
        const blue = await askFor8BitValue("blue", "Blue", 255);
        effectConfig = {
          type: "DyingLights",
          red: red.red,
          green: green.green,
          blue: blue.blue,
          neopixelCount: neopixelCount.neopixelCount,
        };
        console.log(effectConfig);
        break;
      }
      default: {
        console.log("Upps this is missing.");
        process.exit(0);
      }
    }
  }

  const existingConfig = savedConfigs.find(
    (config) => config.deviceIp === deviceIp.deviceIp
  );

  const createdConfig = {
    deviceIp: deviceIp.deviceIp,
    choosenLight: choosenLight.choosenLight,
    effectConfig: effectConfig,
    neopixelCount: neopixelCount.neopixelCount,
  };

  if (existingConfig) {
    savedConfigs[savedConfigs.indexOf(existingConfig)] = createdConfig;
  } else {
    savedConfigs.push(createdConfig);
  }

  await fs.promises.writeFile(
    ".ScreenChaser.json",
    JSON.stringify(savedConfigs)
  );

  console.log("✔️ Saved config to .ScreenChaser.json");

  process.exit(1);
}

app();
