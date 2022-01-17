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
};

module.exports = rgbToHex