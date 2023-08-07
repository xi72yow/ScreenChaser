import { instantiate } from "../../dist/ledDecayDebug";

import { fs} from "fs";

const {
  memory,
  createLedDecay,
  calculateFrame,
} = await instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {}
)

const LEDS = 114;
const TIMES = 50;

function generateRandomUnit8Arr(length: number = LEDS): Uint8Array {
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

const ledDecay = createLedDecay(LEDS, 5, 1);

const frameIn1 = generateRandomUnit8Arr(LEDS * 4);
const frameIn2 = generateRandomUnit8Arr(LEDS * 4);

console.log(`frameIn1: ${frameIn1} `);

for (let i = 0; i < TIMES; i++) {
  const frameOut = calculateFrame(1, frameIn1);
  console.log(`frameOut ${i}: ${frameOut}`);
}

console.log("ok");
