import { random } from "./basics/random.js";
import setAll from "./basics/setAll.js";
import setPixel from "./basics/setPixel.js";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb.js";
import { hexToRgb } from "./basics/convertRgbHex.js";

class MeteorRain {
  stripe: string[];
  red: number;
  green: number;
  blue: number;
  meteorSize: number;
  meteorTrailDecay: number;
  meteorRandomDecay: number;
  count: number;
  neopixelCount: number;
  rainbow: boolean;
  constructor(options: {
    red: number;
    green: number;
    blue: number;
    meteorSize: number;
    meteorTrailDecay: number;
    meteorRandomDecay: number;
    neopixelCount: number;
    rainbow?: boolean;
  }) {
    const {
      red,
      green,
      blue,
      meteorSize,
      meteorTrailDecay,
      meteorRandomDecay,
      neopixelCount,
      rainbow = false,
    } = options;
    this.stripe = setAll(0, 0, 0, neopixelCount);
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.meteorSize = meteorSize;
    this.meteorTrailDecay = meteorTrailDecay;
    this.meteorRandomDecay = meteorRandomDecay;
    this.count = 0;
    this.neopixelCount = neopixelCount;
    this.rainbow = rainbow;
  }

  fadeToBlack(pixel: number, stripe: string[], fadeValue: number) {
    const oldColor = stripe[pixel];
    let rgb = hexToRgb(oldColor);

    let hsv = rgbToHsv(rgb);

    hsv.v = hsv.v - fadeValue;

    hsv.h = hsv.h + 10;

    if (hsv.v < 0) {
      hsv.v = 0;
    }

    const { r, g, b } = hsvToRgb(hsv);

    return setPixel(pixel, stripe, r, g, b);
  }

  render() {
    this.count++;
    // fade brightness all LEDs one step
    for (let j = 0; j < this.neopixelCount; j++) {
      if (random(10) > 5)
        this.stripe = this.fadeToBlack(
          j,
          this.stripe,
          this.meteorTrailDecay / 1000 + this.meteorRandomDecay / 1000
        );
    }
    // draw meteor
    for (let k = 0; k < this.meteorSize; k++) {
      let rgb = hsvToRgb({ h: this.count * 15, s: 1, v: 1 });

      if (this.count - k < this.neopixelCount && this.count - k >= 0) {
        if (this.rainbow)
          this.stripe = setPixel(
            this.count - k,
            this.stripe,
            rgb.r,
            rgb.g,
            rgb.b
          );
        else
          this.stripe = setPixel(
            this.count - k,
            this.stripe,
            this.red,
            this.green,
            this.blue
          );
      }
    }

    //restart animation
    if (this.count > this.neopixelCount + this.meteorSize) {
      this.count = 0;
    }

    return this.stripe;
  }

  getIdentifier() {
    return "meteor";
  }
}

export default MeteorRain;
