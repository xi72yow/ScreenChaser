const fs = require('fs');
const contents = fs.readFileSync("./dist/ledDecayDebug.wasm", {encoding: 'base64'});
//create a new file that will contain and exports the base64 string
const wasmJs = `export default "${contents}";`;
fs.writeFileSync("./dist/ledDecayDebug.wasm.js", wasmJs, {encoding: 'utf8'});