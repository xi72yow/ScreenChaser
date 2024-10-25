import "./variables.css";
import "./style.css";
import "./appShell.css";
import "./devices.css";

import "@/themeToggle";
import "@/addDeviceBtn";
import "@/logo";
import "@/deviceCard";
import NumberInput from "@core/numberInput";
import Toaster from "@core/toasts";
import { State } from "./core/db/state";

const state = new State([]);

const numberInput1 = new NumberInput({
  selector: ".app-footer",
  minValue: 0,
  maxValue: 100,
  defaultValue: 50,
  helperText: "Set the temperature",
  label: "Temperature",
});
const deviceLoader = document.querySelector("#device-loader");
window.ipcRenderer.invoke("SCAN_NETWORK").then((devices) => {
  devices.forEach((device: { ip: string }) => {
    const devicesContainer = document.querySelector(".devices");
    if (
      devicesContainer &&
      !document.querySelector(`device-card[ip="${device.ip}"]`)
    ) {
      const deviceCard = document.createElement("device-card");
      deviceCard.setAttribute("ip", device.ip);
      devicesContainer.appendChild(deviceCard);
    }
    state.set(device.ip, device);
  });
  if (deviceLoader) {
    (deviceLoader as HTMLElement).style.display = "none";
  }
});

setInterval(() => {
  Toaster({
    text: "This is a toast" + Math.random(),
    duration: 4000,
  }).showToast();
}, 2000);
