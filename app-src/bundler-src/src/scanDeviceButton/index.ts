import refreshIcon from "@core/icons/refresh.svg";
import IconButton from "@/core/iconButton";
import Toaster from "@core/toasts";
import { State } from "@/core/db/state";

function scanNetwork() {
  const state = new State([]);
  const deviceLoader = document.querySelector("#device-loader");
  if (deviceLoader) {
    (deviceLoader as HTMLElement).style.display = "block";
  }
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
      Toaster({
        text: `Device found: ${device.ip}`,
        duration: 5000,
      }).showToast();
    });
    if (deviceLoader) {
      (deviceLoader as HTMLElement).style.display = "none";
    }
  });
}

new IconButton({
  selector: ".app-footer",
  stateOneIcon: refreshIcon,
  stateTwoIcon: refreshIcon,
  stateOneStrokeColor: "#888",
  stateTwoStrokeColor: "#888",
  onClick: scanNetwork,
});

scanNetwork();
