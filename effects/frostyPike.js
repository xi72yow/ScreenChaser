const setPixel = require("./basics/setPixel");
const random = require("./basics/random");
const setAll = require("./basics/setAll");

class FrostyPike {
  constructor(baseStripe, delay, neopixelCount) {
    this.count = 0;
    this.baseStripe = baseStripe ? baseStripe : setAll(0, 0, 0, neopixelCount);
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
