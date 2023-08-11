class LedDecay {
  private _frameCount: i32 = 1;
  private _frameBuffer: Array<Uint8Array>;
  private _calculatedFrame: Array<string>;
  private _decayWeights: Array<i32> = [];
  private _decayWeightSum: i32 = 0;
  constructor(ledCount: i32, frameCount: i32) {
    this._frameCount = frameCount;
    this._calculatedFrame = new Array<string>(ledCount);
    this._frameBuffer = new Array<Uint8Array>(frameCount);

    this._initDecayWeights(frameCount);

    this._reactToLedCountChange(ledCount);

    this._initFrameBuffer(frameCount, ledCount);
  }

  private _unit8To2DigitsHexString(value: u8): string {
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  private _initDecayWeights(frameCount: i32): void {
    this._decayWeights = new Array<i32>(frameCount);
    for (let i = 0; i < frameCount; i++) {
      this._decayWeights[i] = i + 1;
    }
    this._decayWeightSum = (frameCount * (frameCount + 1)) / 2;
  }

  private _manageFrameBuffer(frame: Uint8Array): void {
    this._frameBuffer.push(frame);
    this._frameBuffer.shift();
  }

  private _initFrameBuffer(frameCount: i32, ledCount: i32): void {
    this._frameBuffer = new Array<Uint8Array>(frameCount);
    for (let i = 0; i < frameCount; i++) {
      this._frameBuffer[i] = new Uint8Array(ledCount * 4);
    }
  }

  private _reactToLedCountChange(ledCount: i32): void {
    this._calculatedFrame = new Array<string>(ledCount);
    this._initFrameBuffer(this._frameCount, ledCount);
  }

  public calculateFrameDecay(frame: Uint8Array): Array<string> {
    if (frame.length / 4 !== this._calculatedFrame.length) {
      this._reactToLedCountChange(frame.length / 4);
    }

    let frameLength = this._calculatedFrame.length;
    let frameCount = this._frameCount;

    this._manageFrameBuffer(frame);

    for (let j = 0; j < frameLength; j++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      for (let i = 0; i < frameCount; i++) {
        const currentWeight = this._decayWeights[i];
        const curretFrame = this._frameBuffer[i];
        sumR += curretFrame[j * 4] * currentWeight;
        sumG += curretFrame[j * 4 + 1] * currentWeight;
        sumB += curretFrame[j * 4 + 2] * currentWeight;
      }
      this._calculatedFrame[j] =
        this._unit8To2DigitsHexString((sumR / this._decayWeightSum) as u8) +
        this._unit8To2DigitsHexString((sumG / this._decayWeightSum) as u8) +
        this._unit8To2DigitsHexString((sumB / this._decayWeightSum) as u8);
    }

    this._manageFrameBuffer(frame);
    return this._calculatedFrame;
  }
}

const LedDecayMap = new Map<i32, LedDecay>();

export function createLedDecay(ledCount: i32, frameCount: i32, id: i32): bool {
  let ledDecay = new LedDecay(ledCount, frameCount);
  LedDecayMap.set(id, ledDecay);
  return true;
}

export function calculateFrame(id: i32, frame: Uint8Array): Array<string> {
  let ledDecay = LedDecayMap.get(id);
  return ledDecay.calculateFrameDecay(frame);
}
