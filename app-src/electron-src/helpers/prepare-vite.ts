import { resolve } from "node:path";

const loadModule = async (modulePath: string) => {
  try {
    return await import(modulePath);
  } catch (e) {
    return null;
  }
};

const prepareVite = async (port: number): Promise<void> => {
  const { createServer } = await loadModule("vite");
  if (createServer) {
    const server = await createServer({
      configFile: resolve(process.cwd(), "bundler-src", "vite.config.ts"),
      root: resolve(process.cwd(), "bundler-src"),
      server: {
        port: port,
      },
    });
    await server.listen();
    server.printUrls();
    server.bindCLIShortcuts({ print: true });
  } else {
    console.info("No Vite in Production!");
  }
};

export default prepareVite;
