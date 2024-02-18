import { createServer } from "http";
import { join, isAbsolute, normalize } from "path";
import { app, protocol } from "electron";
import isDev from "./is-dev";
import { resolve } from "app-root-path";
import next from "next";

const devServer = async (dir: string, port?: number): Promise<void> => {
  const nextApp = next({ dev: true, dir });
  const requestHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  const server = createServer(requestHandler);

  server.listen(port || 8000, () => {
    app.on("before-quit", () => server.close());
  });
};

const adjustRenderer = (directory: string): void => {
  const paths = ["/_next", "/static"];
  const isWindows = process.platform === "win32";

  protocol.interceptFileProtocol("file", (request, callback) => {
    let path = request.url.substr(isWindows ? 8 : 7);

    for (const prefix of paths) {
      let newPath = path;

      if (isWindows) {
        newPath = newPath.substr(2);
      }

      if (!newPath.startsWith(prefix)) {
        continue;
      }

      if (isWindows) {
        newPath = normalize(newPath);
      }

      newPath = join(directory, "out", newPath);
      path = newPath;
    }

    path = decodeURIComponent(path);

    callback({ path });
  });
};

const prepareNext = async (
  directories: string | Record<"production" | "development", string>,
  port: number
): Promise<void> => {
  if (!directories) {
    throw new Error("Renderer location not defined");
  }

  if (typeof directories === "string") {
    directories = {
      production: directories,
      development: directories,
    };
  }

  for (const directory in directories) {
    if (!{}.hasOwnProperty.call(directories, directory)) {
      continue;
    }

    const dir = directory as "production" | "development";

    if (!isAbsolute(directories[dir])) {
      directories[dir] = resolve(directories[dir]);
    }
  }

  if (!isDev) {
    adjustRenderer(directories.production);
    return;
  }

  await devServer(directories.development, port);
};

export default prepareNext;
