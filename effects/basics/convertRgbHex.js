/**
 * returns an 2 digit hex
 *
 * @param rgb {Byte} 8Bit color number
 * @return {String} converted Hex String
 */
function rgbToHex(rgb) {
  const hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    return `0${hex}`;
  }
  return hex;
}

/**
 *
 * @param {string} hex rgb hex color number FFFFFF
 * @returns {object} with rgb values {r:255,g:255,b:255}
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: 0,
        g: 0,
        b: 0,
      };
}

export { rgbToHex, hexToRgb };
