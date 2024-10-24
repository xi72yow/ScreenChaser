import { BrowserWindow, app } from "electron";
import { format } from "url";
import path, { join } from "path";
import createWindow from "./create-window";
import isDev from "./is-dev";
import { port, hostname } from "./consts";

export default async function prepareMainWindow(): Promise<BrowserWindow> {
  const mainWindow = createWindow("main", {
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: join(path.dirname(__dirname), "preload.js"),
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

  return mainWindow;
}
