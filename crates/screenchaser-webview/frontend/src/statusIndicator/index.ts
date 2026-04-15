import infoIcon from "@core/icons/info-hexagon.svg";
import IconButton from "@core/iconButton";
import Modal from "@core/modal";
import { getToastHistory, type ToastHistoryEntry } from "@core/toasts";
import { daemon } from "@/ws";
import "./index.css";

export const COLOR_OK = "#50fa7b";
export const COLOR_WARN = "#f1fa8c";
export const COLOR_ERR = "#ff5555";

const modal = new Modal("System Status");
modal.saveIconBtn?.iconButton?.remove();

const detail = document.createElement("div");
detail.classList.add("status-detail");
modal.modalBody.appendChild(detail);

let currentColor = COLOR_WARN;
let lastStatus: any = null;

const btn = new IconButton({
  selector: ".footer-left",
  stateOneIcon: infoIcon,
  stateTwoIcon: infoIcon,
  stateOneStrokeColor: currentColor,
  stateTwoStrokeColor: currentColor,
});

btn.iconButton.addEventListener("click", () => {
  renderModal();
  modal.toggle();
});

const svgContainer = btn.iconButton.querySelector(".icon");
if (svgContainer) {
  new MutationObserver(() => applyColor()).observe(svgContainer, {
    childList: true,
  });
}

function applyColor() {
  const svgEl = btn.iconButton.querySelector("svg");
  if (svgEl) svgEl.setAttribute("stroke", currentColor);
}

function setColor(color: string) {
  if (color === currentColor) return;
  currentColor = color;
  applyColor();
}

const TYPE_COLORS: Record<string, string> = {
  success: COLOR_OK,
  warning: COLOR_WARN,
  error: COLOR_ERR,
  info: "#6272a4",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function renderModal() {
  let html = `
    <span class="label">Capture</span>
    <span class="value">${lastStatus?.capturing ? "Active" : "Waiting..."}</span>
    <span class="label">FPS</span>
    <span class="value">${lastStatus?.capturing ? lastStatus.fps?.toFixed(1) || "0" : "--"}</span>
  `;

  const entries = getToastHistory();
  if (entries.length > 0) {
    html += `<div class="history-list">`;
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i] as ToastHistoryEntry;
      const color = TYPE_COLORS[e.type] || "#6272a4";
      html += `
        <div class="history-row">
          <span class="history-time">${formatTime(e.time)}</span>
          <span class="history-dot" style="background:${color}"></span>
          <span class="history-text">${e.text}</span>
        </div>`;
    }
    html += `</div>`;
  }

  detail.innerHTML = html;
}

daemon.on("status", (msg) => {
  lastStatus = msg;
  if (msg.capturing) {
    setColor(COLOR_OK);
  } else {
    setColor(COLOR_WARN);
  }
});
