import { BrowserWindow, app } from "electron";
import { format } from "url";
import { join } from "path";
import isDev from "./is-dev";
import { port, hostname, showChaserWindowInProd } from "./consts";

export default function prepareChaserWindow(): BrowserWindow {
  const chaserWindow = new BrowserWindow({
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

  chaserWindow.on("close", (event) => {
    event.preventDefault();
    chaserWindow.hide();
  });

  return chaserWindow;
}
