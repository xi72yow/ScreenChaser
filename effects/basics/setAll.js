import { rgbToHex } from "./convertRgbHex.js";
/**
 *
 * @param {byte} r 8Bit color
 * @param {byte} g 8Bit color
 * @param {byte} b 8Bit color
 * @param {int} neopixelCount num of neopixels
 * @returns {Array} created stripe
 */
function setAll(r, g, b, neopixelCount) {
  let stripe = [];
  for (let index = 0; index < neopixelCount; index++) {
    stripe[index] = rgbToHex(r) + rgbToHex(g) + rgbToHex(b);
  }
  return stripe;
}

export default setAll;
