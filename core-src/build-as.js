const fs = require("fs");
const contentsDebug = fs.readFileSync("./dist/ledDecayDebug.wasm", {
  encoding: "base64",
});
//create a new file that will contain and exports the base64 string
const wasmJsDebug = `export default "${contentsDebug}";`;
fs.writeFileSync("./dist/ledDecayDebug.wasm.js", wasmJsDebug, {
  encoding: "utf8",
});

const contentsRelease = fs.readFileSync("./dist/ledDecayRelease.wasm", {
  encoding: "base64",
});
//create a new file that will contain and exports the base64 string
const wasmJsRelease = `export default "${contentsRelease}";`;
fs.writeFileSync("./dist/ledDecayRelease.wasm.js", wasmJsRelease, {
  encoding: "utf8",
});
