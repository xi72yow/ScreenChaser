import { app, BrowserWindow, desktopCapturer, dialog, ipcMain } from "electron";
import * as fs from "fs";
import * as util from "util";
import serve from "electron-serve";
import { createWindow, StatCalculator } from "./helpers";
import Manager from "./helpers/effects_build/manager/manager";
import { SerialPort } from "serialport";

const writeFile = util.promisify(fs.writeFile);

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
    width: 1200,
    height: 800,
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
      thumbnailSize: { width: 400, height: 400 },
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

  let chaserWindow: BrowserWindow = null;

  ipcMain.on("CHASER:ON", async (event, args) => {
    if (chaserWindow) return;
    chaserWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      frame: !isProd,
      transparent: isProd,
      width: isProd ? 1 : 800,
      height: isProd ? 1 : 600,
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
      await chaserWindow.close();
      chaserWindow = null;
    }
  });

  ipcMain.on("CHASER:SEND_STRIPE", (event, stripe, ip) => {
    ChaserManager.sendChasingStripe(stripe, ip);
  });

  ipcMain.handle("APP:SAVE_CONFIG", async function (event, configs) {
    const filename = await dialog.showSaveDialog(
      BrowserWindow.getFocusedWindow(),
      {
        title: "Download to File…",
        defaultPath: "sc_config.json",
        filters: [{ name: "json", extensions: ["json"] }],
      }
    );
    if (filename.canceled) return "canceled";

    try {
      await writeFile(filename.filePath, JSON.stringify(configs, null, "\t"));
      return "saved";
    } catch (error) {
      console.log("🚀 ~ file: background.ts ~ line 151 ~ error", error);
      return "failed";
    }
  });

  //handle serial ports
  ipcMain.handle("SERIAL:GET_PORTS", async function (event, configs) {
    const ports = await SerialPort.list();
    return ports;
  });

  //handle serial emit
  ipcMain.on("SERIAL:EMIT", async function (event, settings) {
    console.log("🚀 ~ file: background.ts ~ line 163 ~ settings", settings);
    let sendSetting = { ...settings };
    const serialport = new SerialPort({
      path: sendSetting.path,
      baudRate: 115200,
    });
    delete sendSetting.path;
    serialport.write(JSON.stringify(settings));
  });
})();

app.on("window-all-closed", () => {
  app.quit();
});
