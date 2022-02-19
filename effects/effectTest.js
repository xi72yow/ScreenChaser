const MeteorRain = require("./meteor");
const DataEmitter = require("./dataEmitter");
const BouncingBalls = require("./bouncingBalls");
const FireFlame = require("./fireFlame");
const ColorWheel = require("./colorWheel");
const FrostyPike = require("./frostyPike");

const setAll = require("./basics/setAll");
const setPixel = require("./basics/setPixel");

function createExampleStripe(neopixelCount) {
  const stripe = setAll(0, 0, 0);

  for (let index = 0; index < neopixelCount; index++) {
    if (index < neopixelCount / 2) {
      setPixel(index, stripe, 255, 187, 0);
    } else setPixel(index, stripe, 175, 0, 105);
  }
  return stripe;
}

const MeteorRainEffect = new MeteorRain(155, 25, 200, 5, 20, 100, 120);
const FireFlameEffect = new FireFlame(150, 30, 120);
const BouncingBallsEffect = new BouncingBalls(
  255,
  false,
  10,
  3,
  120,
  createExampleStripe(120)
);
const ColorWheelEffect = new ColorWheel(2, 120);
const FrostyPikeEffect = new FrostyPike(createExampleStripe(120), 5, 120);

async function main() {
  const DataEmitterForIP = new DataEmitter();
  await DataEmitterForIP.init();
  setInterval(() => {
    DataEmitterForIP.emit(FrostyPikeEffect.render());
  }, 100);
}

main();
