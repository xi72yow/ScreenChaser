import "./variables.css";
import "./style.css";
import "./appShell.css";
import "./devices.css";

import "@/themeToggle";
import "@/logo";
import "@/deviceCard";
import "@/addDeviceBtn";
import "@/scanDeviceButton";
import "@/statusIndicator";

const versionEl = document.querySelector(".version");
if (versionEl) versionEl.textContent = `v${__APP_VERSION__}`;
