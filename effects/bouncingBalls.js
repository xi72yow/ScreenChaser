const random = require("./basics/random");
const setAll = require("./basics/setAll");
const setPixel = require("./basics/setPixel");
const millis = require("./basics/millis");

class BauncingBalls {
  constructor(options) {
    const { ballMode, mirrored, tail, BallCount, neopixelCount, baseStripe } =
      options;
    this.mirrored = mirrored;
    this.tail = tail;
    this.speed = 3; //slows down the animation
    this.ballCount = BallCount;
    this.stripe = baseStripe ? baseStripe : setAll(0, 0, 0, neopixelCount);
    this.baseStripe = baseStripe ? baseStripe : setAll(0, 0, 0, neopixelCount);
    this.gravity = -9.81;
    this.startHeight = 1;
    this.impactVelocityStart = Math.sqrt(-2 * this.gravity * this.startHeight);
    this.height = new Array(BallCount);
    this.ballColors = new Array(BallCount);
    this.impactVelocity = new Array(BallCount);
    this.timeSinceLastBounce = new Array(BallCount);
    this.clockTimeSinceLastBounce = new Array(BallCount);
    this.dampening = new Array(BallCount);
    this.position = new Array(BallCount);
    this.neopixelCount = neopixelCount;

    for (let i = 0; i < BallCount; i++) {
      this.clockTimeSinceLastBounce[i] = millis();
      this.height[i] = this.StartHeight;
      this.position[i] = 0;
      this.impactVelocity[i] = this.impactVelocityStart;
      this.timeSinceLastBounce[i] = 0;
      this.ballColors[i] = { r: random(255), g: random(255), b: random(255) };
      this.dampening[i] = 0.9 - i / BallCount ** 2;
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
    this.stripe = [...this.baseStripe];

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

  getStripe() {
    return this.stripe;
  }
}

module.exports = BauncingBalls;
