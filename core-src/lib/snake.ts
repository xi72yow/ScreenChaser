import random from "./basics/random";
import setAll from "./basics/setAll";
import setPixel from "./basics/setPixel";
import { hsvToRgb, rgbToHsv } from "./basics/convertHsvRgb.js";

class Snake {
  stripe: string[];
  headColor: { r: number; g: number; b: number; };
  tailColor: { r: number; g: number; b: number; };
  apples: number[];
  poisonAppleIndex: number;
  speed: number;
  maxSnakeSize: number;
  count: number;
  snakeSize: number;
  neopixelCount: number;
  directionHead: number;
  directionTail: number;
  rainbow: boolean;
  headIndex: number;
  constructor(options: {
    neopixelCount: number;
    speed: number;
    maxSnakeSize: number;
    appleCount: number;
    rainbow: boolean;
  }) {
    const {
      appleCount,
      speed,
      maxSnakeSize,
      neopixelCount,
      rainbow = false,
    } = options;
    this.stripe = setAll(0, 0, 0, neopixelCount);
    let spice = random(50) > 25;
    this.headColor = spice
      ? { r: 255, g: 187, b: 0 }
      : { r: 175, g: 0, b: 105 };
    this.tailColor = !spice
      ? { r: 255, g: 187, b: 0 }
      : { r: 175, g: 0, b: 105 };
    this.apples = [];
    this.poisonAppleIndex = random(neopixelCount);
    for (let i = 0; i < appleCount; i++) {
      this.apples.push(random(neopixelCount));
    }
    this.speed = speed;
    this.maxSnakeSize = maxSnakeSize;
    this.count = 0;
    this.snakeSize = 1;
    this.neopixelCount = neopixelCount;
    this.directionHead = 1;
    this.directionTail = 1;
    this.rainbow = rainbow;
    this.headIndex = 0;
  }

  fadeToBlack(pixel: number, stripe: string[], fadeValue: number) {
    const oldColor = stripe[pixel];
    let r = parseInt(oldColor.slice(0, 2), 16);
    let g = parseInt(oldColor.slice(2, 4), 16);
    let b = parseInt(oldColor.slice(4, 6), 16);
    r = r <= 10 ? 0 : r - fadeValue;
    g = g <= 10 ? 0 : g - fadeValue;
    b = b <= 10 ? 0 : b - fadeValue;
    return setPixel(pixel, stripe, r, g, b);
  }

  render() {
    this.count++;

    if (this.count % this.speed === 0) {
      //this.stripe = setAll(0, 0, 0, this.neopixelCount);

      //render apples
      for (let i = 0; i < this.apples.length; i++) {
        setPixel(this.apples[i], this.stripe, 255, 25, 0);
      }

      if ((this, this.snakeSize === this.maxSnakeSize)) {
        setPixel(this.poisonAppleIndex, this.stripe, 0, 50, 255);
      }

      //render snake
      for (let i = 0; i < this.snakeSize; i++) {
        //draw head
        if (i === 0) {
          this.stripe = setPixel(
            this.headIndex,
            this.stripe,
            this.headColor.r,
            this.headColor.g,
            this.headColor.b
          );
        } else
          this.stripe = setPixel(
            this.headIndex + i * this.directionHead * -1,
            this.stripe,
            this.tailColor.r,
            this.tailColor.g,
            this.tailColor.b
          );
        //delete tail
        if (i === this.snakeSize - 1) {
          let lastBlackPixel =
            this.headIndex + this.snakeSize * this.directionHead * -1;

          if (lastBlackPixel > this.neopixelCount)
            lastBlackPixel =
              this.neopixelCount - (lastBlackPixel - this.neopixelCount);

          if (lastBlackPixel < 0)
            lastBlackPixel =
              0 + this.neopixelCount - (lastBlackPixel + this.neopixelCount);

          this.stripe = setPixel(lastBlackPixel, this.stripe, 0, 0, 0);
        }
      }
      if (this.maxSnakeSize > this.snakeSize) {
        if (this.apples.includes(this.headIndex)) {
          this.snakeSize++;
          this.apples = this.apples.filter((a) => a !== this.headIndex);
          this.apples.push(random(this.neopixelCount));
        }
      } else if (this.headIndex === this.poisonAppleIndex) {
        this.snakeSize = 1;
        this.poisonAppleIndex = random(this.neopixelCount);
      }

      this.headIndex = this.directionHead + this.headIndex;
    }

    if (this.headIndex >= this.neopixelCount || this.headIndex <= 0) {
      this.directionHead = this.directionHead * -1;
    }

    return this.stripe;
  }

  getIdentifier() {
    return "snake";
  }
}

export default Snake;
