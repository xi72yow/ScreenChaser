import { rgbToHex } from "./convertRgbHex";
/**
 *
 * @param {byte} r 8Bit color
 * @param {byte} g 8Bit color
 * @param {byte} b 8Bit color
 * @param {int} neoPixelCount num of neopixels
 * @returns {Array} created stripe
 */
function setAll(r: Number, g: Number, b: Number, neoPixelCount: number) {
  let stripe = [];
  for (let index = 0; index < neoPixelCount; index++) {
    stripe[index] = rgbToHex(r) + rgbToHex(g) + rgbToHex(b);
  }
  return stripe;
}

export default setAll;
