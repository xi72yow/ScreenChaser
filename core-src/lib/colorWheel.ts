import setAll from "./basics/setAll";
import setPixel from "./basics/setPixel";

class ColorWheel {
  count: number;
  stripe: string[];
  speed: number;
  neopixelCount: number;
  /**
   *
   * @param {number} speed animation speed
   * @param {number} neopixelCount number of neopixels
   */
  constructor(options: { speed: number; neopixelCount: number }) {
    const { speed, neopixelCount } = options;
    this.count = 0;
    this.stripe = setAll(0, 0, 0, neopixelCount);
    this.speed = speed;
    this.neopixelCount = neopixelCount;
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
      for (let i = 0; i < this.neopixelCount; i++) {
        let color = this.Wheel(
          ((i * 256) / this.neopixelCount + this.count) & 255
        );
        this.stripe = setPixel(i, this.stripe, color.r, color.g, color.b);
      }
      return this.stripe;
    }
    this.count = 0;
    return this.stripe;
  }

  getIdentifier() {
    return "colorWheel";
  }
}

export default ColorWheel;
