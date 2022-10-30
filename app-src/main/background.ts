import {
  app,
  BrowserWindow,
  contextBridge,
  desktopCapturer,
  ipcMain,
  ipcRenderer,
} from "electron";
import serve from "electron-serve";
import { createWindow, StatCalculator } from "./helpers";
import Manager from "./helpers/effects_build/manager/manager";

const isProd: boolean = process.env.NODE_ENV === "production";

const ChaserManager = new Manager();

const ChaserStatCalculator = new StatCalculator({
  Manager: ChaserManager,
});

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

  mainWindow.on("closed", () => {
    app.quit();
  });

  ipcMain.handle("GET_SOURCES", async (event, ...args) => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });
    return sources;
  });

  ipcMain.handle("GET_STATS", () => {
    return ChaserStatCalculator.calculateStats();
  });

  ipcMain.on("CHANGE_CONFIG_DEBOUNCED", (event, args) => {
    console.log("CHANGE_CONFIG_DEBOUNCED");
    ChaserManager.setDebouncedConfigs(args);
  });

  ipcMain.on("CHANGE_CONFIG", (event, args) => {
    console.log("CHANGE_CONFIG");
    ChaserManager.setConfigs(args);
  });

  ipcMain.on("LIGHTS_OFF", (event, args) => {
    ChaserManager.lightsOff();
  });

  ipcMain.on("LIGHTS_ON", (event, args) => {
    ChaserManager.startAll();
  });

  let selected = {};
  let chaserWindow: BrowserWindow;

  ipcMain.on("CHASER:ON", async (event, args) => {
    chaserWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      frame: !isProd,
      transparent: isProd,
      width: 1,
      height: 1,
    });

    if (isProd) {
      await chaserWindow.loadURL("app://./chaserhack.html");
    } else {
      const port = process.argv[2];
      await chaserWindow.loadURL(`http://localhost:${port}/chaserhack`);
      chaserWindow.webContents.openDevTools();
    }
  });

  ipcMain.on("CHASER:OFF", async (event, args) => {
    if (chaserWindow) {
      chaserWindow.close();
    }
    await chaserWindow.close();
    chaserWindow = null;
  });

  ipcMain.on("CHASER:SEND_STRIPE", (event, args) => {
    ChaserManager.sendChasingStripe(args);
  });
})();

app.on("window-all-closed", () => {
  app.quit();
});
