import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  IpcMainEvent,
  shell,
} from "electron";
import { isDev, prepareVite } from "./helpers";
import DeviceSwitch from "./device-switch";
import prepareMainWindow from "./helpers/prepare-main-window";
import { port } from "./helpers/consts";
import prepareChaserWindow from "./helpers/prepare-chaser-window";

app.on("ready", async () => {
  if (isDev) {
    await prepareVite(port);
  }
  const deviceSwitch = new DeviceSwitch();

  const [mainWindow, chaserWindow, search] = await Promise.all([
    prepareMainWindow(),
    prepareChaserWindow(),
    deviceSwitch.search(),
  ]);

  ipcMain.handle("GET_DEVICES", async (event, ...args) => {
    return deviceSwitch.getDevices();
  });
});

ipcMain.handle("GET_SOURCES", async (event, ...args) => {
  const thumbnailSize = args[0];
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: thumbnailSize || { width: 400, height: 400 },
  });
  return sources;
});

ipcMain.handle("SCAN_NETWORK", async (event, ...args) => {});

ipcMain.on("MANAGE_CHASER", (event, args: any) => {});

ipcMain.on("LIGHTS:OFF", async (event, args) => {});

ipcMain.on("LIGHTS:ON", async (event, args) => {});

ipcMain.on("CHASER:SEND_STRIPE", (event, stripe, id) => {});

ipcMain.on("SHELL:OPEN_LINK", (event, link) => {
  shell.openExternal(link);
});

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});

app.on("window-all-closed", () => {
  ipcMain.removeAllListeners();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
