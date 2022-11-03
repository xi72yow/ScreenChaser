import setPixel from "./basics/setPixel.js";
import random from "./basics/random.js";
import setAll from "./basics/setAll.js";

class SpaceShuttle {
  constructor(options) {
    const { baseStripe, delay, neopixelCount } = options;
    this.count = 0;
    this.spaseShuttleLength = 10;
    this.thrust = 3;
    this.baseStripe = baseStripe;
    this.stripe = setAll(0, 0, 0, neopixelCount);
  }

  render() {
    this.count++;
    return this.stripe;
  }
}

export default SpaceShuttle;
