import path from "node:path";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      { find: "@core", replacement: path.resolve(__dirname, "src/core") },
      {
        find: "@fonts",
        replacement: path.resolve(__dirname, "src/core/fonts"),
      },
    ],
  },
  server: {
    proxy: {
      "/ws": {
        target: "ws://127.0.0.1:19447",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
