import setAll from "./basics/setAll";
import setPixel from "./basics/setPixel";
import { CoreChaserEffectInterface, EffectInterface } from "./types";

export interface ColorWheelInterface {
  speed: number;
}

export interface ColorWheelEffectInterface
  extends CoreChaserEffectInterface,
    ColorWheelInterface {}

class ColorWheel implements EffectInterface {
  count: number;
  stripe: string[];
  speed: number;
  neoPixelCount: number;
  /**
   *
   * @param {number} speed animation speed
   * @param {number} neoPixelCount number of neopixels
   */
  constructor(options: ColorWheelEffectInterface) {
    const { speed, neoPixelCount } = options;
    this.count = 0;
    this.stripe = setAll(0, 0, 0, neoPixelCount);
    this.speed = speed;
    this.neoPixelCount = neoPixelCount;
  }

  Wheel(WheelPos: number) {
    WheelPos = 255 - WheelPos;
    if (WheelPos < 85) {
      return { r: 255 - WheelPos * 3, g: 0, b: WheelPos * 3 };
    }
    if (WheelPos < 170) {
      WheelPos -= 85;
      return { r: 0, g: WheelPos * 3, b: 255 - WheelPos * 3 };
    }
    WheelPos -= 170;
    return { r: WheelPos * 3, g: 255 - WheelPos * 3, b: 0 };
  }

  render() {
    this.count++;
    this.count = this.speed + this.count;
    if (this.count < 256 * 5) {
      for (let i = 0; i < this.neoPixelCount; i++) {
        let color = this.Wheel(
          ((i * 256) / this.neoPixelCount + this.count) & 255
        );
        this.stripe = setPixel(i, this.stripe, color.r, color.g, color.b);
      }
      return this.stripe;
    }
    this.count = 0;
    return this.stripe;
  }

  getIdentifier(): "colorWheel" {
    return "colorWheel";
  }
}

export default ColorWheel;
