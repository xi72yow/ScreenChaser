import { random } from "./basics/random.js";
import setAll from "./basics/setAll.js";
import setPixel from "./basics/setPixel.js";
import millis from "./basics/millis.js";
import { hexToRgb } from "./basics/convertRgbHex.js";
import { rgbToHsv, hsvToRgb } from "./basics/convertHsvRgb.js";

class BauncingBalls {
  myColors: { r: number; g: number; b: number }[];
  ballMode: string;
  mirrored: boolean;
  tail: number;
  speed: number;
  ballCount: number;
  stripe: string[];
  baseStripe: string[];
  gravity: number;
  startHeight: number;
  impactVelocityStart: number;
  height: any[];
  ballColors: any[];
  impactVelocity: any[];
  timeSinceLastBounce: any[];
  clockTimeSinceLastBounce: any[];
  dampening: any[];
  position: any[];
  neopixelCount: number;
  StartHeight: any;
  constructor(options: {
    ballMode: "random" | "rainbow" | "color";
    mirrored: boolean;
    tail: number;
    ballCount: number;
    neopixelCount: number;
    baseStripe: string[];
  }) {
    const { ballMode, mirrored, tail, ballCount, neopixelCount, baseStripe } =
      options;
    this.myColors = [
      { r: 255, g: 187, b: 0 },
      { r: 175, g: 0, b: 105 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 255, g: 0, b: 255 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
    ];
    this.ballMode = ballMode;
    this.mirrored = mirrored;
    this.tail = tail;
    this.speed = 3; //slows down the animation
    this.ballCount = ballCount;
    this.stripe = baseStripe ? baseStripe : setAll(0, 0, 0, neopixelCount);
    this.baseStripe = baseStripe ? baseStripe : setAll(0, 0, 0, neopixelCount);
    this.gravity = -9.81;
    this.startHeight = 1;
    this.impactVelocityStart = Math.sqrt(-2 * this.gravity * this.startHeight);
    this.height = new Array(ballCount);
    this.ballColors = new Array(ballCount);
    this.impactVelocity = new Array(ballCount);
    this.timeSinceLastBounce = new Array(ballCount);
    this.clockTimeSinceLastBounce = new Array(ballCount);
    this.dampening = new Array(ballCount);
    this.position = new Array(ballCount);
    this.neopixelCount = neopixelCount;

    for (let i = 0; i < ballCount; i++) {
      this.clockTimeSinceLastBounce[i] = millis();
      this.height[i] = this.StartHeight;
      this.position[i] = 0;
      this.impactVelocity[i] = this.impactVelocityStart;
      this.timeSinceLastBounce[i] = 0;
      switch (this.ballMode) {
        case "fixed":
          this.ballColors[i] = this.myColors[i];
          break;

        default:
          this.ballColors[i] = {
            r: random(255),
            g: random(255),
            b: random(255),
          };
          break;
      }
      this.dampening[i] = 0.9 - i / ballCount ** 2;
    }
  }

  render() {
    for (let i = 0; i < this.ballCount; i++) {
      this.timeSinceLastBounce[i] =
        (millis() - this.clockTimeSinceLastBounce[i]) / this.speed;
      this.height[i] =
        0.5 * this.gravity * (this.timeSinceLastBounce[i] / 1000) ** 2.0 +
        (this.impactVelocity[i] * this.timeSinceLastBounce[i]) / 1000;

      if (this.height[i] < 0) {
        this.height[i] = 0;
        this.impactVelocity[i] = this.dampening[i] * this.impactVelocity[i];
        this.clockTimeSinceLastBounce[i] = millis();

        if (this.impactVelocity[i] < 0.01) {
          this.impactVelocity[i] = this.impactVelocityStart;
        }
      }
      this.position[i] = Math.round(
        (this.height[i] * (this.neopixelCount - 1)) / this.startHeight
      );
    }

    if (this.tail > 0) {
      for (let i = 0; i < this.neopixelCount; i++) {
        this.stripe = this.fadeToBlack(
          i,
          this.stripe,
          0.05 + random(this.tail) / 100
        );
      }
    } else this.stripe = [...this.baseStripe];

    for (let i = 0; i < this.ballCount; i++) {
      this.stripe = setPixel(
        this.position[i],
        this.stripe,
        this.ballColors[i].r,
        this.ballColors[i].b,
        this.ballColors[i].g
      );
      if (this.mirrored) {
        this.stripe = setPixel(
          this.neopixelCount - this.position[i],
          this.stripe,
          this.ballColors[i].r,
          this.ballColors[i].b,
          this.ballColors[i].g
        );
      }
    }

    return this.stripe;
  }

  fadeToBlack(pixel: number, stripe: string[], fadeValue: number) {
    const oldColor = stripe[pixel];
    let rgb = hexToRgb(oldColor);

    let hsv = rgbToHsv(rgb);

    hsv.v = hsv.v - fadeValue;

    if (hsv.v < 0) {
      hsv.v = 0;
    }

    const { r, g, b } = hsvToRgb(hsv);

    return setPixel(pixel, stripe, r, g, b);
  }

  getStripe() {
    return this.stripe;
  }

  getIdentifier() {
    return "bouncingBalls";
  }
}

export default BauncingBalls;
