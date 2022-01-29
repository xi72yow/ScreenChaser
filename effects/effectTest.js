const MeteorRain = require("./meteor");
const DataEmitter = require("./dataEmitter");
const BouncingBalls = require("./bouncingBalls");
const FireFlame = require("./fireFlame");
const ColorWheel = require("./colorWheel");
const FrostyPike = require("./frostyPike");

const setAll = require("./basics/setAll");
const setPixel = require("./basics/setPixel");

function createExampleStripe(neopixelCount) {
  let stripe = setAll(0, 0, 0);

  for (let index = 0; index < neopixelCount; index++) {
    if (index < neopixelCount / 2) {
      setPixel(index, stripe, 255, 187, 0);
    } else setPixel(index, stripe, 175, 0, 105);
  }
  return stripe;
}

let MeteorRainEffect = new MeteorRain(155, 25, 200, 5, 20, 100, 120);
let FireFlameEffect = new FireFlame(150, 30, 120);
let DataEmitterForIP = new DataEmitter("192.168.2.113");
let BouncingBallsEffect = new BouncingBalls(255, false, 10, 3, 120);
let ColorWheelEffect = new ColorWheel(2, 120);
let FrostyPikeEffect = new FrostyPike(createExampleStripe(120), 5, 120);

setInterval(() => {
  DataEmitterForIP.emit(FrostyPikeEffect.render());
}, 100);
