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
  const devices = deviceSwitch.getDevices();

  // Convert Map to array format for frontend
  const deviceArray = [];
  for (const [ip, wledConnector] of devices.entries()) {
    deviceArray.push({
      ip: ip,
      device: wledConnector.device, // Use 'device' property from interface
    });
  }

  return deviceArray;
});

// Cache screen sources so Wayland only asks once
let cachedSources: Awaited<ReturnType<typeof desktopCapturer.getSources>> | null = null;

async function getScreenSources() {
  if (!cachedSources) {
    cachedSources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 720, height: 405 },
    });
  }
  return cachedSources;
}

ipcMain.handle("GET_VIDEO_SOURCES", async () => {
  return getScreenSources();
});

ipcMain.handle("GET_SOURCES", async () => {
  return getScreenSources();
});

ipcMain.on("MANAGE_CHASER", (event, args: any) => {});

ipcMain.on("LIGHTS:OFF", async (event, args) => {});

ipcMain.on("LIGHTS:ON", async (event, args) => {});

ipcMain.on("CHASER:SEND_STRIPE", (event, stripe, id) => {});

const warnedDevices = new Set<string>();

ipcMain.handle(
  "SEND_LED_DATA",
  async (event, args: { ip: string; data: number[]; ledCount: number }) => {
    const { ip, data, ledCount } = args;

    try {
      // Check if device exists in deviceSwitch
      const device = deviceSwitch.getDevice(ip);

      if (!device) {
        if (!warnedDevices.has(ip)) {
          warnedDevices.add(ip);
          console.warn(
            `Device ${ip} not found. Please scan network first.`,
          );
        }
        return { success: false, ip };
      }

      // Format data for WLED DRGB protocol
      // Protocol: 0x02 (DRGB mode), 0xFF (timeout), then RGB data
      const wledData = [];

      // WLED UDP protocol header
      wledData.push("02"); // DRGB protocol mode
      wledData.push("FF"); // Timeout (255 = no timeout)

      // Convert RGBA to RGB hex format for WLED
      for (let i = 0; i < data.length; i += 4) {
        // Convert each RGB value to 2-digit hex string
        const r = data[i].toString(16).padStart(2, "0");
        const g = data[i + 1].toString(16).padStart(2, "0");
        const b = data[i + 2].toString(16).padStart(2, "0");
        wledData.push(r, g, b);
      }

      // Send via WLED connector
      deviceSwitch.emitUdp(ip, wledData);

      return { success: true, ip, ledCount };
    } catch (error) {
      console.error(`Error sending LED data to ${ip}:`, error);
      throw error;
    }
  },
);

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
