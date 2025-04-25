import refreshIcon from "@core/icons/refresh.svg";
import IconButton from "@/core/iconButton";
import Toaster from "@core/toasts";
import { State } from "@/core/db/state";

// Create the icon button reference
let scanButton: IconButton;

// Track scanning state
let isScanning = false;

function scanNetwork() {
  // Prevent multiple simultaneous scans
  if (isScanning) return;
  isScanning = true;
  
  const state = new State([]);
  
  // Start the button spinning animation
  scanButton.startSpin();
  
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
    
    // Stop the button spinning animation
    scanButton.stopSpin();
    isScanning = false;
  }).catch((error) => {
    console.error("Error scanning network:", error);
    scanButton.stopSpin();
    isScanning = false;
  });
}

// Create the button
scanButton = new IconButton({
  selector: ".app-footer",
  stateOneIcon: refreshIcon,
  stateTwoIcon: refreshIcon,
  stateOneStrokeColor: "#888",
  stateTwoStrokeColor: "#888",
  onClick: scanNetwork,
});

// Wait for everything to be loaded before initial scan
setTimeout(() => {
  scanNetwork();
}, 800);
