import { random } from "./basics/random";
import setAll from "./basics/setAll";
import setPixel from "./basics/setPixel";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb";
import { hexToRgb } from "./basics/convertRgbHex";
import { CoreChaserEffectInterface, EffectInterface } from "./types/index";

export interface MeteorRainInterface {
  meteorSize: number;
  meteorTrailDecay: number;
  meteorRandomDecay: number;
  rainbow: boolean;
  meteorColor: string;
}

export interface MeteorRainEffectInterface
  extends CoreChaserEffectInterface,
    MeteorRainInterface {}

class MeteorRain implements EffectInterface {
  stripe: string[];
  red: number;
  green: number;
  blue: number;
  meteorSize: number;
  meteorTrailDecay: number;
  meteorRandomDecay: number;
  count: number;
  neoPixelCount: number;
  rainbow: boolean;
  constructor(options: MeteorRainEffectInterface) {
    const {
      meteorColor,
      meteorSize,
      meteorTrailDecay,
      meteorRandomDecay,
      neoPixelCount,
      rainbow = false,
    } = options;
    this.stripe = setAll(0, 0, 0, neoPixelCount);
    let rgb = hexToRgb(meteorColor);
    this.red = rgb.r;
    this.green = rgb.g;
    this.blue = rgb.b;
    this.meteorSize = meteorSize;
    this.meteorTrailDecay = meteorTrailDecay;
    this.meteorRandomDecay = meteorRandomDecay;
    this.count = 0;
    this.neoPixelCount = neoPixelCount;
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
    for (let j = 0; j < this.neoPixelCount; j++) {
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

      if (this.count - k < this.neoPixelCount && this.count - k >= 0) {
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
    if (this.count > this.neoPixelCount + this.meteorSize) {
      this.count = 0;
    }

    return this.stripe;
  }

  getIdentifier(): "meteorRain" {
    return "meteorRain";
  }
}

export default MeteorRain;
