import { rgbToHex } from "./convertRgbHex.js";
/**
 * set one neopixel of the stripe
 *
 * @param r {Byte} 8Bit color
 * @param g {Byte} 8Bit color
 * @param b {Byte} 8Bit color
 * @param pixel {Integer} pix index to modify
 * @param stripe {Array} the current stripe
 * @return {Array} modified stripe
 */
function setPixel(pixel, stripe, r, g, b) {
  let hexValue = rgbToHex(r) + rgbToHex(g) + rgbToHex(b);
  stripe[pixel] = hexValue;
  return stripe;
}

export default setPixel;
