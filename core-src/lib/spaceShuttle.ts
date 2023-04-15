import setPixel from "./basics/setPixel";
import { random } from "./basics/random";
import setAll from "./basics/setAll";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb";
import { CoreChaserEffectInterface, EffectInterface } from "./types";

export interface SpaceShuttleInterface {
  baseStripe: string[];
  delay: number;
}

export interface SpaceShuttleEffectInterface
  extends CoreChaserEffectInterface,
    SpaceShuttleInterface {}

class SpaceShuttle implements EffectInterface {
  neoPixelCount: number;
  count: number;
  spaseShuttleLength: number;
  shuttlePos: number;
  thrust: number;
  baseStripe: string[];
  shuttleColor: { r: number; g: number; b: number };
  stripe: string[];
  direction: number;
  constructor(options: SpaceShuttleEffectInterface) {
    const { baseStripe, delay, neoPixelCount } = options;
    this.neoPixelCount = neoPixelCount;
    this.count = 0;
    this.spaseShuttleLength = 3;
    this.shuttlePos = 60;
    this.thrust = 15;
    this.baseStripe = baseStripe;
    this.shuttleColor = { r: 255, g: 255, b: 255 };
    this.stripe = setAll(0, 0, 0, neoPixelCount);
    this.direction = 1;
  }

  fadeToBlack(count: number) {
    let hsv = rgbToHsv(this.shuttleColor);
    const fadeValue = (hsv.v - hsv.v * 0.3) / this.thrust;
    hsv.v = hsv.v - fadeValue * count - random(50) / 100;
    if (hsv.v < 0) {
      hsv.v = 0;
    }
    return hsvToRgb(hsv);
  }

  renderThrust(index: number) {
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

  renderShuttle(index: number) {
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

  renderSpaceShuttle(index: number) {
    this.renderShuttle(index);
    this.renderThrust(index);
  }

  render() {
    this.stripe = setAll(0, 0, 0, this.neoPixelCount);
    this.count++;
    this.renderSpaceShuttle(this.shuttlePos);

    this.shuttlePos = this.shuttlePos + this.direction;

    if (this.shuttlePos > this.neoPixelCount) {
      this.direction = -1;
      this.thrust = 10;
    }
    if (this.shuttlePos < this.spaseShuttleLength + this.thrust) {
      this.direction = 1;
      this.thrust = 15;
    }

    return this.stripe;
  }

  getIdentifier(): "spaceShuttle" {
    return "spaceShuttle";
  }
}

export default SpaceShuttle;
