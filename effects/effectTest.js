const MeteorRain = require("./meteor");
const DataEmitter = require("./network/dataEmitter");
const BouncingBalls = require("./bouncingBalls");
const FireFlame = require("./fireFlame");
const ColorWheel = require("./colorWheel");
const FrostyPike = require("./frostyPike");
const DyingLights = require("./dyingLights");
const Snake = require("./snake");

const setAll = require("./basics/setAll");
const setPixel = require("./basics/setPixel");
let count = 0;
function createExampleStripe(neopixelCount) {
  const stripe = setAll(0, 0, 0);

  for (let index = 0; index < neopixelCount; index++) {
    if (index < neopixelCount / 2) {
      setPixel(index, stripe, 255, 187, 0);
    } else setPixel(index, stripe, 175, 0, 105);
  }
  return stripe;
}

/* const DyingLightEffect = new DyingLights(120);
const MeteorRainEffect = new MeteorRain(155, 25, 200, 5, 20, 100, 120, true);
const FireFlameEffect = new FireFlame(150, 30, 120);
const BouncingBallsEffect = new BouncingBalls(255, false, 10, 3, 120);
const ColorWheelEffect = new ColorWheel(2, 120);
const FrostyPikeEffect = new FrostyPike(createExampleStripe(120), 5, 120); */
/* const SnakeEffect = new Snake({
  neopixelCount: 113,
  maxSnakeSize: 20,
  red: 12,
  green: 255,
  blue: 0,
  appleCount: 5,
  speed: 1,
  rainbow: true,
}); */

const MeteorRainEffect = new MeteorRain({
  red: 155,
  green: 3,
  blue: 255,
  meteorSize: 10,
  meteorTrailDecay: 64,
  meteorRandomDecay: 10,
  rainbow: false,
  neopixelCount: 120,
});

async function main() {
  const DataEmitterForIP = new DataEmitter(true, "192.168.2.113");
  //await DataEmitterForIP.init();
  setInterval(() => {
    count++;
    if (count % 60 === 0) {
      DataEmitterForIP.logHealth();
      DataEmitterForIP.logMaxPower();
    }
    DataEmitterForIP.emit(MeteorRainEffect.render());
  }, 110);
}

main();
