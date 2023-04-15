import setPixel from "./basics/setPixel";
import { random } from "./basics/random";
import setAll from "./basics/setAll";
import { CoreChaserEffectInterface, EffectInterface } from "./types";

export interface FrostyPikeInterface {
  delay: number;
  baseStripe: string[];
}

export interface FrostyPikeEffectInterface
  extends CoreChaserEffectInterface,
    FrostyPike {}

class FrostyPike implements EffectInterface {
  count: number;
  baseStripe: Array<string>;
  stripe: Array<string>;
  neoPixelCount: number;
  delay: number;
  delayCount: number;
  constructor(options: FrostyPikeEffectInterface) {
    const { baseStripe, delay, neoPixelCount } = options;
    this.count = 0;
    this.baseStripe = baseStripe ? baseStripe : setAll(0, 0, 0, neoPixelCount);
    this.stripe = this.baseStripe;
    this.neoPixelCount = neoPixelCount;
    this.delay = delay;
    this.delayCount = 0;
  }

  render() {
    this.stripe = [...this.baseStripe];
    let pixel = random(this.neoPixelCount);
    if (this.delayCount % this.delay === 0) {
      this.stripe = setPixel(pixel, this.stripe, 255, 255, 255);
      return this.stripe;
    }
    this.delayCount++;
    return this.baseStripe;
  }

  getIdentifier(): "frostyPike" {
    return "frostyPike";
  }
}

export default FrostyPike;
