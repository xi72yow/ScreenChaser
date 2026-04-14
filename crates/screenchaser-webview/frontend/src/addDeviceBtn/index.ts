import plusIcon from "@core/icons/plus.svg";
import IconButton from "@/core/iconButton";
import Modal from "@core/modal";
import NumberInput from "@core/numberInput";
import { daemon } from "@/ws";

const modal = new Modal();
modal.setModalTitle("Capture Settings");
modal.saveIconBtn?.iconButton?.remove();

const targetFps = new NumberInput({
  container: modal.modalBody,
  minValue: 1,
  maxValue: 144,
  defaultValue: 60,
  helperText: "Processing framerate for LED color extraction",
  label: "Target FPS",
});

const previewWidth = new NumberInput({
  container: modal.modalBody,
  minValue: 240,
  maxValue: 1920,
  defaultValue: 960,
  helperText: "Preview image width in pixels",
  label: "Preview Width",
});

const previewQuality = new NumberInput({
  container: modal.modalBody,
  minValue: 10,
  maxValue: 100,
  defaultValue: 70,
  helperText: "JPEG quality for preview stream (10-100)",
  label: "Preview Quality",
});

const previewFps = new NumberInput({
  container: modal.modalBody,
  minValue: 1,
  maxValue: 60,
  defaultValue: 15,
  helperText: "Preview stream framerate",
  label: "Preview FPS",
});

async function loadSettings() {
  try {
    await daemon.connect();
    const response = await daemon.getConfig();
    const capture = response.config?.capture;
    if (capture) {
      targetFps.setValue(capture.target_fps || 60, true);
      previewWidth.setValue(capture.preview_width || 960, true);
      previewQuality.setValue(capture.preview_quality || 70, true);
      previewFps.setValue(capture.preview_fps || 15, true);
    }
  } catch (err) {
    console.error("failed to load capture config:", err);
  }
}

async function saveSettings() {
  try {
    await daemon.updateCapture({
      target_fps: targetFps.getValue(),
      monitor_index: 0,
      preview_width: previewWidth.getValue(),
      preview_quality: previewQuality.getValue(),
      preview_fps: previewFps.getValue(),
    });
  } catch (err) {
    console.error("failed to save capture config:", err);
  }
}

const onChange = () => saveSettings();
targetFps.onChange(onChange);
previewWidth.onChange(onChange);
previewQuality.onChange(onChange);
previewFps.onChange(onChange);

new IconButton({
  selector: ".footer-right",
  stateOneIcon: plusIcon,
  stateTwoIcon: plusIcon,
  stateOneStrokeColor: "#888",
  stateTwoStrokeColor: "#888",
  onClick: () => {
    loadSettings();
    modal.toggle();
  },
});
