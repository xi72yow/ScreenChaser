/**
 * creates the neopixel fadeIn effect for the whole string (is shit in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 */
async function fadeIn(red, green, blue) {
  let r;
  let g;
  let b;
  for (let k = 0; k < 256; k += 5) {
    r = ((k / 256) * red) | 0;
    g = ((k / 256) * green) | 0;
    b = ((k / 256) * blue) | 0;
    await delay(MIN_DELAY);
    const stripe = setAll(r, g, b);
    showStrip(stripe);
  }
}

/**
 * creates the neopixel fadeOut effect for the whole string (is shit in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 */
async function fadeOut(red, green, blue) {
  let r;
  let g;
  let b;
  for (let k = 255; k >= 0; k -= 5) {
    r = ((k / 256) * red) | 0;
    g = ((k / 256) * green) | 0;
    b = ((k / 256) * blue) | 0;
    await delay(MIN_DELAY);
    const stripe = setAll(r, g, b);
    showStrip(stripe);
  }
}

/**
 * creates the neopixel ColorWipe effect (looks nice in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 * @param speedDelay {Integer} time between popup pixels
 */
async function colorWipe(red, green, blue, speedDelay) {
  speedDelay = speedDelay < MIN_DELAY ? MIN_DELAY : speedDelay;
  let stripe = setAll(0, 0, 0);
  for (let i = 0; i < neopixelCount; i++) {
    stripe = setPixel(i, stripe, red, green, blue);
    await delay(speedDelay);
    showStrip(stripe);
  }
}
