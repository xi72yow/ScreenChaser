import setPixel from "./basics/setPixel";
import { random } from "./basics/random";
import setAll from "./basics/setAll";

class FrostyPike {
  count: number;
  baseStripe: Array<string>;
  stripe: Array<string>;
  neopixelCount: number;
  delay: number;
  delayCount: number;
  constructor(options: {
    baseStripe: Array<string>;
    delay: number;
    neopixelCount: number;
  }) {
    const { baseStripe, delay, neopixelCount } = options;
    this.count = 0;
    this.baseStripe = baseStripe ? baseStripe : setAll(0, 0, 0, neopixelCount);
    this.stripe = this.baseStripe;
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

  getIdentifier() {
    return "frostyPike";
  }
}

export default FrostyPike;
