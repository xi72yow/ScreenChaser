import setPixel from "./basics/setPixel";
import { random } from "./basics/random";
import setAll from "./basics/setAll";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb";
import { hexToRgb } from "./basics/convertRgbHex";
import { CoreChaserEffectInterface, EffectInterface } from "./types/index";

export interface BubblesInterface {
  maxParticles: number;
  fadeValue: number;
  colors?: Array<string>;
}

export interface BubblesEffectInterface
  extends CoreChaserEffectInterface,
    BubblesInterface {}

class Bubbles implements EffectInterface {
  colors: string[];
  colorsHsv: { h: number; s: number; v: number }[];
  count: number;
  pixStates: any[];
  maxPix: number;
  fadeValue: number;
  stripe: string[];
  neoPixelCount: number;
  constructor(options: BubblesEffectInterface) {
    const { neoPixelCount, maxParticles, fadeValue, colors } = options;

    this.colors = colors || ["#24D024", "#EA0D0D"];

    this.colorsHsv = this.colors.map((color: string) => {
      return rgbToHsv(hexToRgb(color));
    });

    this.count = 0;
    this.pixStates = Array(neoPixelCount).fill({
      value: 0,
      color: { h: 0, s: 0, v: 0 },
      state: "OFF",
    });
    this.maxPix = maxParticles || 10;
    this.fadeValue = fadeValue || 10;

    this.stripe = setAll(0, 0, 0, neoPixelCount);
    this.neoPixelCount = neoPixelCount;
  }

  fadeToBlack(pixel: number, stripe: string[], fadeValue: number) {
    const state = this.pixStates[pixel];
    let hsv = state.color;
    this.pixStates[pixel].value = state.value - fadeValue / 100;
    hsv.v = this.pixStates[pixel].value;
    if (hsv.v < 0) {
      hsv.v = 0;
      this.pixStates[pixel].state = "OFF";
      this.pixStates[pixel].value = 0;
    }
    const { r, g, b } = hsvToRgb(hsv);
    this.stripe = setPixel(pixel, stripe, r, g, b);
  }

  fadeToLight(pixel: number, stripe: string[], fadeValue: number) {
    const state = this.pixStates[pixel];
    let hsv = state.color;
    this.pixStates[pixel].value = state.value + fadeValue / 100;
    hsv.v = this.pixStates[pixel].value;
    if (hsv.v > 1) {
      hsv.v = 1;
      this.pixStates[pixel].state = "FULL";
      this.pixStates[pixel].value = 1;
    }
    const { r, g, b } = hsvToRgb(hsv);
    this.stripe = setPixel(pixel, stripe, r, g, b);
  }

  countPix() {
    return this.pixStates.filter((pix) => {
      return pix.state !== "OFF";
    }).length;
  }

  startPixel(pixel: number) {
    const state = { ...this.pixStates[pixel] };
    if (this.pixStates[pixel].state === "OFF") {
      state.color = this.colorsHsv[random(this.colorsHsv.length)];
      state.state = "FILL";
      this.pixStates[pixel] = state;
    }
  }

  render() {
    if (this.maxPix - this.countPix() > 0)
      this.startPixel(random(this.neoPixelCount));

    for (let index = 0; index < this.neoPixelCount; index++) {
      const pixState = { ...this.pixStates[index] };
      if (pixState.state === "FILL") {
        this.fadeToLight(index, this.stripe, this.fadeValue + random(10));
      }
      if (pixState.state === "FULL") {
        this.fadeToBlack(index, this.stripe, this.fadeValue + random(10));
      }
    }

    return this.stripe;
  }

  getIdentifier(): "bubbles" {
    return "bubbles";
  }
}

export default Bubbles;
