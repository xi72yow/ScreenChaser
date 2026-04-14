import refreshIcon from "@core/icons/refresh.svg";
import IconButton from "@/core/iconButton";
import { daemon } from "@/ws";

let scanButton: IconButton;
let isScanning = false;

function createDeviceCard(id: string, ip: string, name: string) {
  const devicesContainer = document.querySelector(".devices");
  if (!devicesContainer) return;

  let card = document.querySelector(
    `device-card[device-id="${id}"]`
  ) as HTMLElement;
  if (!card) {
    card = document.createElement("device-card");
    card.setAttribute("device-id", id);
    devicesContainer.appendChild(card);
  }
  card.setAttribute("ip", ip);
  card.setAttribute("name", name);
}

async function loadDevicesFromConfig() {
  try {
    const response = await daemon.getConfig();
    const devices = response.config?.devices || {};
    for (const [id, device] of Object.entries(devices) as [string, any][]) {
      createDeviceCard(id, device.ip, device.name || id);
    }
  } catch (err) {
    console.error("failed to load devices from config:", err);
  }
}

async function scanNetwork() {
  if (isScanning) return;
  isScanning = true;
  scanButton.startSpin();

  try {
    const response = await daemon.scanNetwork();
    const found = response.devices || [];

    const existingIps = new Set<string>();
    document.querySelectorAll("device-card[ip]").forEach((card) => {
      const ip = card.getAttribute("ip");
      if (ip) existingIps.add(ip);
    });

    for (const device of found) {
      if (existingIps.has(device.ip)) continue;
      const id = device.ip.replace(/\./g, "-");
      createDeviceCard(id, device.ip, device.name);
    }
  } catch (error) {
    console.error("scan failed:", error);
  }

  scanButton.stopSpin();
  isScanning = false;
}

scanButton = new IconButton({
  selector: ".footer-right",
  stateOneIcon: refreshIcon,
  stateTwoIcon: refreshIcon,
  stateOneStrokeColor: "var(--FG)",
  stateTwoStrokeColor: "var(--FG)",
  onClick: scanNetwork,
});

daemon.connect().then(() => {
  loadDevicesFromConfig().then(() => {
    setTimeout(scanNetwork, 800);
  });
});
