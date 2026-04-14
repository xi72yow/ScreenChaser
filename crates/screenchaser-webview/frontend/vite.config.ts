import path from "node:path";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
  plugins: [
    {
      name: "middleware",
      apply: "serve",
      configureServer(viteDevServer) {
        return () => {
          viteDevServer.middlewares.use(async (req, res, next) => {
            if (req.originalUrl?.startsWith("/chaser")) {
              req.url = "/chaser.html";
            }
            next();
          });
        };
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        chaser: resolve(__dirname, "chaser.html"),
      },
    },
  },
});
