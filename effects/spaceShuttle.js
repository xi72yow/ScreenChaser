import setPixel from "./basics/setPixel.js";
import random from "./basics/random.js";
import setAll from "./basics/setAll.js";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb.js";

class SpaceShuttle {
  constructor(options) {
    const { baseStripe, delay, neopixelCount } = options;
    this.neopixelCount = neopixelCount;
    this.count = 0;
    this.spaseShuttleLength = 3;
    this.shuttlePos = 60;
    this.thrust = 15;
    this.baseStripe = baseStripe;
    this.shuttleColor = { r: 255, g: 255, b: 255 };
    this.stripe = setAll(0, 0, 0, neopixelCount);
    this.direction = 1;
  }

  fadeToBlack(count) {
    let hsv = rgbToHsv(this.shuttleColor);
    const fadeValue = (hsv.v - hsv.v * 0.3) / this.thrust;
    hsv.v = hsv.v - fadeValue * count - random(50) / 100;
    if (hsv.v < 0) {
      hsv.v = 0;
    }
    return hsvToRgb(hsv);
  }

  renderThrust(index) {
    for (let i = 0; i < this.thrust; i++) {
      const { r, g, b } = this.fadeToBlack(i);
      this.stripe = setPixel(
        index - this.spaseShuttleLength - i,
        this.stripe,
        r,
        g,
        b
      );
    }
  }

  renderShuttle(index) {
    for (let i = 0; i < this.spaseShuttleLength; i++) {
      this.stripe = setPixel(
        index - i,
        this.stripe,
        this.shuttleColor.r,
        this.shuttleColor.g,
        this.shuttleColor.b
      );
    }
  }

  renderSpaceShuttle(index) {
    this.renderShuttle(index);
    this.renderThrust(index);
  }

  render() {
    this.stripe = setAll(0, 0, 0, this.neopixelCount);
    this.count++;
    this.renderSpaceShuttle(this.shuttlePos);

    this.shuttlePos = this.shuttlePos + this.direction;

    if (this.shuttlePos > this.neopixelCount) {
      this.direction = -1;
      this.thrust = 10;
    }
    if (this.shuttlePos < this.spaseShuttleLength + this.thrust) {
      this.direction = 1;
      this.thrust = 15;
    }

    return this.stripe;
  }
}

export default SpaceShuttle;
