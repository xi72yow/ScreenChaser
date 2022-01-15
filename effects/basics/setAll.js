const rgbToHex = require("./rgbToHex")
/**
 * 
 * @param {byte} r 8Bit color
 * @param {byte} g 8Bit color
 * @param {byte} b 8Bit color
 * @param {int} neopixelCount num of neopixels
 * @returns {Array} created stripe
 */
function setAll(r, g, b, neopixelCount) {
    stripe = [];
    for (let index = 0; index < neopixelCount; index++) {
        stripe[index] = rgbToHex(r) + rgbToHex(g) + rgbToHex(b);
    }
    return stripe;
}

module.exports = setAll