/**
 *
 * @param {Array} currentFrame current frame
 * @param {int} newLength num of neopixels
 * @param {boolean} replace if true, replace # with "", default true
 * @returns {Array} scaled stripe
 */
function reScale(
  currentFrame: Array<string>,
  newLength: number,
  replace: boolean = true
) {
  const scaledFrame = [];
  const scaling = newLength / currentFrame.length;
  const newWidth = Math.round(currentFrame.length * scaling);
  for (let i = 0; i < newWidth; i++) {
    const pix = currentFrame[Math.floor(i / scaling)];
    if (pix) {
      scaledFrame.push(replace ? pix.replace("#", "") : pix);
    } else scaledFrame.push(replace ? "000000" : "#000000");
  }
  return scaledFrame;
}

export { reScale };
