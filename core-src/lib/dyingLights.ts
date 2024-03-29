import setAll from "./basics/setAll";
import setPixel from "./basics/setPixel";
import { random } from "./basics/random";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb";
import { hexToRgb } from "./basics/convertRgbHex";
import { CoreChaserEffectInterface, EffectInterface } from "./types";

export interface DyingLightsInterface {
  lightColor?: string;
}

export interface DyingLightsEffectInterface
  extends CoreChaserEffectInterface,
    DyingLightsInterface {}

class DyingLights implements EffectInterface {
  baseStripe: string[];
  stripe: string[];
  red: number;
  green: number;
  blue: number;
  count: number;
  neoPixelCount: number;
  constructor(options: DyingLightsEffectInterface) {
    const { neoPixelCount, lightColor = "#9B03FF" } = options;

    const { r: red, g: green, b: blue } = hexToRgb(lightColor.substring(1));

    this.baseStripe = setAll(red, green, blue, neoPixelCount);
    this.stripe = setAll(red, green, blue, neoPixelCount);
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.count = 0;
    this.neoPixelCount = neoPixelCount;
  }
  flickerRed() {
    this.stripe = [...this.baseStripe];
    const flicker = random(42);
    this.stripe = setAll(
      this.red - flicker,
      this.green,
      this.blue,
      this.neoPixelCount
    );
    return this.stripe;
  }
  flickerValue() {}
  startUvTube() {
    let hsv = rgbToHsv({ r: this.red, g: this.green, b: this.blue });
    const value = hsv.v / (this.neoPixelCount / random(4));
    for (let index = 0; index < this.neoPixelCount / 2; index++) {
      let rgb = hsvToRgb({ h: hsv.h, s: hsv.s, v: hsv.v - value * index || 0 });
      this.stripe = setPixel(index, this.stripe, rgb.r, rgb.g, rgb.b);
      this.stripe = setPixel(
        this.neoPixelCount - index,
        this.stripe,
        rgb.r,
        rgb.g,
        rgb.b
      );
    }
    return this.stripe;
  }
  render() {
    this.count++;

    if (this.count < 20 && this.count % random(4) === 0) {
      this.stripe = this.startUvTube();
    }

    if (this.count % 25 === 0) {
      this.stripe = this.flickerRed();
    }

    if (this.count % 25 === random(5)) {
      this.stripe = [...this.baseStripe];
    }

    if (this.count % 121 === 1 || this.count % 121 === 25) {
      this.stripe = setAll(0, 0, 0, this.neoPixelCount);
    }
    if (this.count % 121 === 5 || this.count % 121 === 27) {
      this.stripe = [...this.baseStripe];
    }

    return this.stripe;
  }

  getIdentifier(): "dyingLights" {
    return "dyingLights";
  }
}

export default DyingLights;
