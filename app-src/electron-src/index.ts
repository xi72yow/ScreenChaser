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

app.commandLine.appendSwitch("enable-unsafe-webgpu", "true");
app.commandLine.appendSwitch("enable-features", "Vulkan");

app.on("ready", async () => {
  if (isDev) {
    await prepareVite(port);
  }

  const [mainWindow, chaserWindow] = await Promise.all([
    prepareMainWindow(),
    prepareChaserWindow(),
  ]);
});

app.on("browser-window-created", (e, win) => {
  win.removeMenu();
  win.webContents.on("did-finish-load", () => {
    if (isDev) {
      win.webContents.openDevTools();
    }
    win.webContents.insertCSS(`
      :root {
      --c-1: #282a36 !important;  /* Dracula Background */
      --c-f: #f8f8f2 !important;  /* Dracula Foreground */
      --c-2: #44475a !important;  /* Dracula Current Line */
      --c-3: #6272a4 !important;  /* Dracula Comment */
      --c-4: #44475a !important;  /* Dracula Current Line */
      --c-5: #6272a4 !important;  /* Dracula Comment */
      --c-6: #bd93f9 !important;  /* Dracula Purple */
      --c-8: #8be9fd !important;  /* Dracula Cyan */
      --c-b: #f1fa8c !important;  /* Dracula Yellow */
      --c-c: #ff79c6 !important;  /* Dracula Pink */
      --c-e: #50fa7b !important;  /* Dracula Green */
      --c-d: #ffb86c !important;  /* Dracula Orange */
      --c-r: #ff5555 !important;  /* Dracula Red */
      --c-g: #50fa7b !important;  /* Dracula Green */
      --c-l: #8be9fd !important;  /* Dracula Cyan */
      --t-b: 0.5 !important;
      --c-o: rgba(40, 42, 54, 0.9) !important;  /* Dracula Background with opacity */
      --c-tb : rgba(40, 42, 54, var(--t-b)) !important;
      --c-tba: rgba(189, 147, 249, var(--t-b)) !important;  /* Dracula Purple with opacity */
      --c-tbh: rgba(98, 114, 164, var(--t-b)) !important;  /* Dracula Comment with opacity */
      /*following are internal*/
      --th: 70px !important;
      --tp: 70px !important;
      --bh: 63px !important;
      --tbp: 14px 8px 10px !important;
      --bbp: 9px 0 7px 0 !important;
      --bhd: none !important;
      --bmt: 0px !important;
      }
    `);
  });
});

const deviceSwitch = new DeviceSwitch();

ipcMain.handle("SCAN_NETWORK", async (event, ...args) => {
  await deviceSwitch.search();
  return await deviceSwitch.getDevices();
});

ipcMain.handle("GET_VIDEO_SOURCES", async (event, ...args) => {
  const thumbnailSize = args[0];
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: thumbnailSize || { width: 400, height: 400 },
  });
  return sources;
});

ipcMain.handle("GET_SOURCES", async (event) => {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"], // Screen first priority
    thumbnailSize: { width: 150, height: 150 },
  });
  return sources;
});

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

/* // On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	}); */
