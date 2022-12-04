import { reScale } from "./basics/reScale";
import { CoreChaserEffectInterface, EffectInterface } from "./types";

export interface AnimationInterface {
  frames: Array<Array<string>>;
  fps: number;
}

export interface AnimationEffectInterface
  extends CoreChaserEffectInterface,
    AnimationInterface {}

class Animation implements EffectInterface {
  count: number;
  frames: any;
  neopixelCount: any;
  fps: number;
  lastFrameTime: number;
  constructor(options: AnimationEffectInterface) {
    const { frames, fps = 10, neopixelCount } = options;
    this.count = 0;
    this.neopixelCount = neopixelCount;
    this.frames = frames.map((frame: string[]) => {
      return reScale(frame, neopixelCount);
    });
    this.fps = fps;
    this.lastFrameTime = Date.now();
  }

  render() {
    if (this.count === this.frames.length) {
      this.count = 0;
    }
    const frame = this.frames[this.count];
    if (Date.now() - this.lastFrameTime > 1000 / this.fps) {
      this.lastFrameTime = Date.now();
      this.count++;
    }
    return frame;
  }

  getIdentifier(): "animation" {
    return "animation";
  }
}

export default Animation;
