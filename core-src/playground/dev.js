const fs = require("fs");
const path = require("path");
const tsc = require("typescript");

fs.watch(path.join(__dirname, "..", "lib/bias/"), (eventType, filename) => {
  console.log(eventType);

  if (filename.endsWith(".ts")) {
    const ts = fs.readFileSync(
      path.join(__dirname, "..", "lib/bias/", filename),
      "utf8"
    );

    //transpile typescript to javascript for browser usage
    const js = tsc.transpileModule(ts, {
      compilerOptions: {
        target: tsc.ScriptTarget.ES5,
        module: tsc.ModuleKind.CommonJS,
        declaration: false,
        sourceMap: false,
        removeComments: true,
        noImplicitAny: false,
        allowJs: true,
        lib: ["es2015", "dom"],
      },
    });

    fs.writeFileSync(
      path.join(__dirname, "..", "playground/", filename.replace(".ts", ".js")),
      js.outputText
    );
  }
  console.log(filename);
});
