/**
 *
 * @param {objekt} hsvRef {h:0,s:0,v:0}
 * @returns objekt with rgb values {r:0,g:0,b:0}
 */
function hsvToRgb(hsvRef: { h: number; s: number; v: number }) {
  let hsv = { ...hsvRef }; //clone all properties into a objekt with new reference
  if (hsv.h <= 0) {
    hsv.h = 0;
  }
  if (hsv.s <= 0) {
    hsv.s = 0;
  }
  if (hsv.v <= 0) {
    hsv.v = 0;
  }
  hsv.h = hsv.h / 360;
  hsv.v = Math.round(hsv.v * 255);

  var i = Math.floor(hsv.h * 6);
  var f = hsv.h * 6 - i;
  var p = Math.round(hsv.v * (1 - hsv.s));
  var q = Math.round(hsv.v * (1 - f * hsv.s));
  var t = Math.round(hsv.v * (1 - (1 - f) * hsv.s));

  switch (i % 6) {
    case 0:
      return {
        r: hsv.v,
        g: t,
        b: p,
      };
    case 1:
      return {
        r: q,
        g: hsv.v,
        b: p,
      };
    case 2:
      return {
        r: p,
        g: hsv.v,
        b: t,
      };
    case 3:
      return {
        r: p,
        g: q,
        b: hsv.v,
      };
    case 4:
      return {
        r: t,
        g: p,
        b: hsv.v,
      };
    case 5:
      return {
        r: hsv.v,
        g: p,
        b: q,
      };

    default:
      return {
        r: 0,
        g: 0,
        b: 0,
      };
  }
}
/**
 *
 * @param {object} rgbRef {r:0,g:0,b:0}
 * @returns object with hsv values {h:0,s:0,v:0}
 */
function rgbToHsv(rgbRef: { r: number; g: number; b: number }) {
  let rgb = { ...rgbRef }; //clone all properties into a objekt with new reference

  rgb.r = rgb.r / 255;
  rgb.g = rgb.g / 255;
  rgb.b = rgb.b / 255;

  let max = Math.max(rgb.r, rgb.g, rgb.b);
  let min = Math.min(rgb.r, rgb.g, rgb.b);
  let h,
    s,
    v = max;

  let d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case rgb.r:
        h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0);
        break;
      case rgb.g:
        h = (rgb.b - rgb.r) / d + 2;
        break;
      case rgb.b:
        h = (rgb.r - rgb.g) / d + 4;
        break;
    }
    if (h) h = h / 6;
    else h = 0;
  }

  return {
    h: h * 360,
    s: s,
    v: v,
  };
}

export { hsvToRgb, rgbToHsv };
