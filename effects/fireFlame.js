import random from "./basics/random.js";
import setAll from "./basics/setAll.js";
import setPixel from "./basics/setPixel.js";

class FireFlame {
  constructor(options) {
    const { cooling, sparking, neopixelCount } = options;
    this.stripe = setAll(0, 0, 0);
    this.heat = new Array(neopixelCount).fill(0);
    this.cooling = cooling;
    this.sparking = sparking;
    this.neopixelCount = neopixelCount;
  }

  setPixelHeatColor(pixel, temperature) {
    // Scale 'heat' down from 0-255 to 0-191
    let t192 = ((temperature / 255.0) * 191) | 0;

    // calculate ramp up from
    let heatramp = t192 & 0x3f; // 0..63
    heatramp <<= 2; // scale up to 0..252

    // figure out which third of the spectrum we're in:
    if (t192 > 0x80) {
      // hottest
      this.stripe = setPixel(pixel, this.stripe, 255, 255, heatramp);
    } else if (t192 > 0x40) {
      // middle
      this.stripe = setPixel(pixel, this.stripe, 255, heatramp, 0);
    } else {
      // coolest
      this.stripe = setPixel(pixel, this.stripe, heatramp, 0, 0);
    }
  }

  render() {
    let cooldown;
    // Step 1.  Cool down every cell a little
    for (let i = 0; i < this.neopixelCount; i++) {
      cooldown = random((this.cooling * 10) / this.neopixelCount);

      if (cooldown > this.heat[i]) {
        this.heat[i] = 0;
      } else {
        this.heat[i] = this.heat[i] - cooldown;
      }
    }

    // Step 2.  Heat from each cell drifts 'up' and diffuses a little
    for (let k = this.neopixelCount - 1; k >= 2; k--) {
      this.heat[k] =
        (this.heat[k - 1] + this.heat[k - 2] + this.heat[k - 2]) / 3;
    }

    // Step 3.  Randomly ignite new 'sparks' near the bottom
    if (random(255) < this.sparking) {
      let y = random(7);
      this.heat[y] = this.heat[y] + random(95) + 160;
      //heat[y] = random(160,255);
    }

    // Step 4.  Convert heat to LED colors
    for (let j = 0; j < this.neopixelCount; j++) {
      this.setPixelHeatColor(j, this.heat[j]);
    }

    return this.stripe;
  }

  getIdentifier() {
    return "fireFlame";
  }
}

export default FireFlame;
