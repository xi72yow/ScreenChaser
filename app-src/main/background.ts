import { app, desktopCapturer, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import Manager from "./helpers/effects_build/manager/manager";

const isProd: boolean = process.env.NODE_ENV === "production";

const ChaserManager = new Manager();

let LastChaserState = undefined;

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 800,
    height: 700,
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setZoomFactor(1.0);

  // zoom
  mainWindow.webContents
    .setVisualZoomLevelLimits(1, 3)
    .then(() => {})
    .catch((err) => console.log(err));

  mainWindow.webContents.on("zoom-changed", (event, zoomDirection) => {
    var currentZoom = mainWindow.webContents.getZoomFactor();

    if (zoomDirection === "in") {
      if (mainWindow.webContents.zoomFactor < 3.0) {
        mainWindow.webContents.zoomFactor = currentZoom + 0.2;
      }
    }
    if (zoomDirection === "out") {
      if (mainWindow.webContents.zoomFactor - 0.2 > 0.0) {
        mainWindow.webContents.zoomFactor = currentZoom - 0.2;
      } else mainWindow.webContents.zoomFactor = 0.1;
    }
  });

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
  });

  ipcMain.handle("GET_STATS", async (event, ...args) => {
    if (!ChaserManager) return undefined;
    const MappedData = ChaserManager.emitters.map(
      (dataEmitter, index, array) => {
        const data = dataEmitter.getHealth();
        return {
          title: dataEmitter.getIp(),
          task: ChaserManager.runningEffects[index]
            ? ChaserManager.runningEffects[index].getIdentifier()
            : null,
          details: [
            {
              title: "Power:",
              value: data.power,
              icon: "bolt",
              diff: LastChaserState
                ? (data.power / LastChaserState[index].details[0]?.value) *
                    100 -
                  100
                : 100,
            },
            {
              title: "Package Loss:",
              value: data.packageloss,
              icon: "package",
              diff: LastChaserState
                ? (data.packageloss /
                    LastChaserState[index].details[1]?.value) *
                    100 -
                  100
                : 100,
            },
          ],
        };
      }
    );

    LastChaserState = MappedData;

    return MappedData;
  });

  ipcMain.on("CHANGE_CONFIG_DEBOUNCED", (event, args) => {
    ChaserManager.setDebouncedConfigs(args);
  });

  ipcMain.on("CHANGE_CONFIG", (event, args) => {
    ChaserManager.setConfigs(args);
  });

  ipcMain.on("LIGHTS_OFF", (event, args) => {
    ChaserManager.lightsOff();
  });

  ipcMain.on("LIGHTS_ON", (event, args) => {
    ChaserManager.startAll();
  });
})();

app.on("window-all-closed", () => {
  app.quit();
});
