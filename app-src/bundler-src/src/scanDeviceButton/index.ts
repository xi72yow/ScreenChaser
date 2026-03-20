import refreshIcon from "@core/icons/refresh.svg";
import IconButton from "@/core/iconButton";
import Toaster from "@core/toasts";
import { State } from "@/core/db/state";

// Create the icon button reference
let scanButton: IconButton;

// Track scanning state
let isScanning = false;

function createDeviceCard(ip: string) {
  const devicesContainer = document.querySelector(".devices");
  if (
    devicesContainer &&
    !document.querySelector(`device-card[ip="${ip}"]`)
  ) {
    const deviceCard = document.createElement("device-card");
    deviceCard.setAttribute("ip", ip);
    devicesContainer.appendChild(deviceCard);
  }
}

function removeDeviceCard(ip: string) {
  const card = document.querySelector(`device-card[ip="${ip}"]`);
  if (card) card.remove();
}

async function loadCachedDevices() {
  const state = new State([]);
  try {
    const keys = await state.getAllKeys();
    for (const key of keys) {
      createDeviceCard(String(key));
    }
  } catch (err) {
    console.error("Failed to load cached devices:", err);
  }
}

function scanNetwork() {
  // Prevent multiple simultaneous scans
  if (isScanning) return;
  isScanning = true;

  const state = new State([]);

  // Start the button spinning animation
  scanButton.startSpin();

  window.ipcRenderer
    .invoke("SCAN_NETWORK")
    .then(async (devices) => {
      const foundIps = new Set<string>();

      devices.forEach((device: { ip: string }) => {
        foundIps.add(device.ip);
        createDeviceCard(device.ip);

        // Add default chaser configuration if not exists
        if (!device.chaserConfig) {
          device.chaserConfig = {
            fieldWidth: 10,
            fieldHeight: 10,
            ledCountLeft: 0,
            ledCountRight: 0,
            ledCountTop: 0,
            ledCountBottom: 114,
            bufferSeconds: 5,
            startLed: 0,
            clockWise: 1,
          };
        }
        state.set(device.ip, device);
      });

      // Remove cards for devices no longer on the network
      try {
        const cachedKeys = await state.getAllKeys();
        for (const key of cachedKeys) {
          const ip = String(key);
          if (!foundIps.has(ip)) {
            removeDeviceCard(ip);
          }
        }
      } catch (err) {
        console.error("Failed to clean stale devices:", err);
      }

      // Stop the button spinning animation
      scanButton.stopSpin();
      isScanning = false;
    })
    .catch((error) => {
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

// Load cached devices immediately, then scan in background
loadCachedDevices().then(() => {
  setTimeout(() => {
    scanNetwork();
  }, 800);
});
