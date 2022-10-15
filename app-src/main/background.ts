import { app, desktopCapturer, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";

const isProd: boolean = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 800,
    height: 600,
  });

  mainWindow.setMenuBarVisibility(false);

  if (isProd) {
    await mainWindow.loadURL("app://./home.html");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  ipcMain.handle("GET_SOURCES", async (event, ...args) => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });
    return sources;
    /* .then(async (sources) => {
        return sources;
        /*       for (const source of sources) {
          if (source.name === "GitHub Desktop") {
            mainWindow.webContents.send("SET_SOURCE", source.id);
            return;
          }
        } 
      }); */
    //const result = await somePromise(...args);
  });
})();

app.on("window-all-closed", () => {
  app.quit();
});
