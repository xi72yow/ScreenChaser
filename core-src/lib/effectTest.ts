import MeteorRain from "./meteorRain";
import DataEmitter from "./network/dataEmitter";
import { WledHyperionEmitter } from "./network/wledEmitter";
import BouncingBalls from "./bouncingBalls";
import FireFlame from "./fireFlame";
import ColorWheel from "./colorWheel";
import FrostyPike from "./frostyPike";
import DyingLights from "./dyingLights";
import Snake from "./snake";
import SpaceShuttle from "./spaceShuttle";
import Bubbles from "./bubbles";

import setAll from "./basics/setAll";
import setPixel from "./basics/setPixel";

let count = 0;

function createExampleStripe(neoPixelCount: number) {
  const stripe = setAll(0, 0, 0, neoPixelCount);

  for (let index = 0; index < neoPixelCount; index++) {
    if (index < neoPixelCount / 2) {
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
  neoPixelCount: 113,
  maxSnakeSize: 20,
  red: 12,
  green: 255,
  blue: 0,
  appleCount: 5,
  speed: 1,
  rainbow: true,
}); */

/* const SpaceShuttleEffect = new SpaceShuttle({
  neoPixelCount: 113,
  maxSnakeSize: 20,
  red: 12,
  green: 255,
  blue: 0,
  appleCount: 5,
  speed: 1,
  rainbow: true,
}); */

const ChristmasEffect = new Bubbles({
  neoPixelCount: 114,
  maxParticles: 25,
  fadeValue: 5,
});

const MeteorRainEffect = new MeteorRain({
  meteorColor: "#ffbb00",
  meteorSize: 2,
  meteorTrailDecay: 64,
  meteorRandomDecay: 10,
  rainbow: true,
  neoPixelCount: 114,
});

const ColorWheelEffect = new ColorWheel({
  neoPixelCount: 114,
  speed: 10,
});

/* const BouncingBallsEffect = new BouncingBalls({
  ballMode: "fixed",
  mirrored: true,
  tail: 10,
  ballCount: 2,
  neoPixelCount: 114,
  baseStripe: null,
}); */

async function main() {
  const DataEmitterForIP = new DataEmitter(
    true,
    "192.168.2.113",
    (ip, pixels) => {
      console.log(ip, pixels.length);
    }
  );

  const WledHyperionEmitterForIp = new WledHyperionEmitter({
    ip: "192.168.2.165",
  });

  //await DataEmitterForIP.init();
  setInterval(() => {
    /*  count++;
    if (count % 60 === 0) {
      DataEmitterForIP.logHealth();
      DataEmitterForIP.logMaxPower();
    } */
    WledHyperionEmitterForIp.emit(ColorWheelEffect.render());
  }, 1000 / 60);
}

main();
