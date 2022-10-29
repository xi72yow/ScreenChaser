/**
 * js analogous to microcontroller random
 *
 * @param max {Integer} max random number
 * @return {Interger} num between 0 and max
 */
function random(max) {
  return (Math.random() * max) | 0;
}

export default random;
