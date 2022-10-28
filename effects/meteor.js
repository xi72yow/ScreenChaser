const random = require("./basics/random");
const setAll = require("./basics/setAll");
const setPixel = require("./basics/setPixel");
const { hsvToRgb, rgbToHsv } = require("./basics/convertHsvRgb");
const { hexToRgb } = require("./basics/convertRgbHex");

class MeteorRain {
  constructor(options) {
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

  fadeToBlack(pixel, stripe, fadeValue) {
    const oldColor = stripe[pixel];
    let { r, g, b } = hexToRgb(oldColor);

    r = r - fadeValue <= fadeValue ? 0 : r - fadeValue;
    g = r - fadeValue <= fadeValue ? 0 : g - fadeValue;
    b = r - fadeValue <= fadeValue ? 0 : b - fadeValue;
    return setPixel(pixel, stripe, r, g, b);
  }

  render() {
    this.count++;
    // fade brightness all LEDs one step
    for (let j = 0; j < this.neopixelCount; j++) {
      if (!this.meteorRandomDecay || random(10) > 5) {
        this.stripe = this.fadeToBlack(j, this.stripe, this.meteorTrailDecay);
      }
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

    //reset animation
    if (this.count > this.neopixelCount * 2) {
      this.stripe = setAll(0, 0, 0, this.neopixelCount);
      this.count = 0;
    }

    return this.stripe;
  }

  getIdentifier() {
    return "meteor";
  }
}

module.exports = MeteorRain;
