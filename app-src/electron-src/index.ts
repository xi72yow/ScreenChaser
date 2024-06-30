// Native
import { join } from "path";
import { format } from "url";

// Packages
import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  IpcMainEvent,
  shell,
} from "electron";
import { createWindow, isDev, prepareVite } from "./helpers";

const hostname = "localhost";
const port = 3000;

const showChaserWindowInProd = isDev;

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  const mainWindow = createWindow("main", {
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: join(__dirname, "preload.js"),
    },
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

  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      // Add listeners to handle ports being added or removed before the callback for `select-serial-port`
      // is called.
      mainWindow.webContents.session.on("serial-port-added", (event, port) => {
        console.log("serial-port-added FIRED WITH", port);
        // Optionally update portList to add the new port
      });

      mainWindow.webContents.session.on(
        "serial-port-removed",
        (event, port) => {
          console.log("serial-port-removed FIRED WITH", port);
          // Optionally update portList to remove the port
        }
      );

      event.preventDefault();
      if (portList && portList.length > 0) {
        callback(portList[0].portId);
      } else {
        // eslint-disable-next-line standard/no-callback-literal
        callback(""); // Could not find any matching devices
      }
    }
  );

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      if (
        ((permission === "serial" || permission === "media") &&
          details.securityOrigin === "file:///" &&
          process.env.NODE_ENV === "production") ||
        process.env.NODE_ENV !== "production"
      ) {
        return true;
      }

      return false;
    }
  );

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === "serial" && details.origin === "file://") {
      return true;
    }

    return false;
  });

  if (isDev) {
    await prepareVite(port);
    mainWindow.loadURL(`http://${hostname}:${port}/`);
    mainWindow.webContents.openDevTools();
  } else {
    const url = format({
      pathname: join(__dirname, "../bundler-dist/index.html"),
      protocol: "file:",
      slashes: true,
    });

    mainWindow.loadURL(url);
  }

  //This is figuring out white screen issue.
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    app.quit();
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

let chaserWindow: BrowserWindow | null = null;

async function manageChaserWindow() {
  if (chaserWindow) return;

  chaserWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: join(__dirname, "preload.js"),
      backgroundThrottling: false,
    },
    frame: showChaserWindowInProd,
    transparent: !showChaserWindowInProd,
    width: !showChaserWindowInProd ? 1 : 800,
    height: !showChaserWindowInProd ? 1 : 600,
  });

  if (isDev) {
    chaserWindow.loadURL(`http://${hostname}:${port}/chaser`);
    chaserWindow.webContents.openDevTools();
  } else {
    const url = format({
      pathname: join(__dirname, "../bundler-dist/chaser.html"),
      protocol: "file:",
      slashes: true,
    });
    chaserWindow.loadURL(url);
  }

  chaserWindow.on("closed", () => {
    chaserWindow = null;
  });
}

ipcMain.on("CHASER:ON", async (event, args) => {
  manageChaserWindow();
});

ipcMain.on("CHASER:OFF", async (event, args) => {
  if (chaserWindow) {
    await chaserWindow.close();
    chaserWindow = null;
  }
});

ipcMain.on("LIGHTS:OFF", async (event, args) => {});

ipcMain.on("LIGHTS:ON", async (event, args) => {});

/* ipcMain.on("CHASER:DECAY_CHANGE", (event, ledCount, bufferSize, id) => {
  createLedDecay(ledCount, bufferSize, id);
}); */

ipcMain.on("CHASER:SEND_STRIPE", (event, stripe, id) => {});

ipcMain.on("CHASER:SEND_STATIC_STRIPE", (event, stripe, id) => {});

ipcMain.on("SHELL:OPEN_LINK", (event, link) => {
  shell.openExternal(link);
});

app.on("window-all-closed", () => {
  app.quit();
});

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});
