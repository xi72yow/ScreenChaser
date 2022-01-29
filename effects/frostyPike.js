const setPixel = require("./basics/setPixel");
const random = require("./basics/random");

class FrostyPike {
  constructor(baseStripe, delay, neopixelCount) {
    this.count = 0;
    this.baseStripe = baseStripe;
    this.stripe = baseStripe;
    this.neopixelCount = neopixelCount;
    this.delay = delay;
    this.delayCount = 0;
  }

  render() {
    this.stripe = [...this.baseStripe];
    let pixel = random(this.neopixelCount);
    if (this.delayCount % this.delay === 0) {
      this.stripe = setPixel(pixel, this.stripe, 255, 255, 255);
      return this.stripe;
    }
    this.delayCount++;
    return this.baseStripe;
  }
}

module.exports = FrostyPike;
