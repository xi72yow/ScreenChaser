import { State } from "@/core/db/state";
import Modal from "@core/modal";
import NumberInput from "@core/numberInput";
import Toaster from "@core/toasts";
import RectangleEditor from "@/ledFieldEditor/rectangle-editor";
import { generateLedFields } from "@/biasCalculation/ledFields";
import "./index.css";

// Shared desktop stream for all device cards
let sharedStream: MediaStream | null = null;
let streamPromise: Promise<MediaStream | null> | null = null;

async function getDesktopStream(): Promise<MediaStream | null> {
  if (sharedStream) return sharedStream;
  if (streamPromise) return streamPromise;

  streamPromise = (async () => {
    try {
      const sources = await window.ipcRenderer.invoke("GET_SOURCES");
      if (!sources || sources.length === 0) return null;

      let screenSource = sources.find((s: any) => s.id.startsWith("screen:"));
      if (!screenSource) screenSource = sources[0];

      sharedStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore - Electron specific constraints
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: screenSource.id,
            maxWidth: 480,
            maxHeight: 270,
          },
        },
      } as any);

      return sharedStream;
    } catch (err) {
      console.error("Failed to get desktop stream:", err);
      return null;
    }
  })();

  return streamPromise;
}

class DeviceCard extends HTMLElement {
  static style = `

  `;
  static template = `
        <div class="device">
            <video class="background-video" autoplay muted></video>
            <div class="device-details">
                <div class="head" style="margin: 10px;">
                    <div class="name">$1</div>
                    <div class="ip" style="font-size: 0.8em;">$2</div>
                </div>
            </div>
        </div>
        `;
  state: State | undefined;
  ip: string | undefined;
  name: string | undefined;
  [key: string]: any;
  modal: Modal;
  fieldWidth: NumberInput;
  fieldHeight: NumberInput;
  ledCountLeft: NumberInput;
  ledCountRight: NumberInput;
  ledCountTop: NumberInput;
  ledCountBottom: NumberInput;
  bufferSeconds: NumberInput;
  startLed: NumberInput;
  clockWise: NumberInput;
  editorContainer: HTMLDivElement;
  editor: any;

  constructor() {
    super();
    this.modal = new Modal();
    this.fieldWidth = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 100,
      defaultValue: 10,
      helperText: "Set the width of the field of the video in percentage",
      label: "Field Width",
    });

    this.fieldHeight = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 100,
      defaultValue: 10,
      helperText: "Set the height of the field of the video in percentage",
      label: "Field Height",
    });

    this.ledCountLeft = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of LEDs on the left side",
      label: "LED Count Left",
    });

    this.ledCountRight = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of LEDs on the right side",
      label: "LED Count Right",
    });

    this.ledCountTop = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of LEDs on the top side",
      label: "LED Count Top",
    });

    this.ledCountBottom = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 114,
      helperText: "Set the number of LEDs on the bottom side",
      label: "LED Count Bottom",
    });

    this.bufferSeconds = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0.01,
      maxValue: 10,
      defaultValue: 5,
      step: 0.01,
      helperText: "Set the buffer duration in seconds (0.01-10)",
      label: "Buffer Seconds",
    });

    this.startLed = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the starting LED, if you not start in an corner",
      label: "Start LED",
    });

    this.clockWise = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 1,
      defaultValue: 1,
      helperText:
        "Set the direction of the LEDs, 1 for clockwise and 0 for counter clockwise",
      label: "Clockwise",
    });

    // LED Field Editor preview
    this.editorContainer = document.createElement("div");
    this.editorContainer.style.cssText = `
      grid-column: 1 / -1;
      background: var(--BGDarker, #191a21);
      border-radius: 4px;
      padding: 8px;
      border: 1px solid var(--BORDER, #44475a);
    `;

    const editorLabel = document.createElement("div");
    editorLabel.textContent = "LED Field Preview";
    editorLabel.style.cssText = `
      font-size: 12px;
      color: var(--COMMENT, #6272a4);
      margin-bottom: 8px;
    `;
    this.editorContainer.appendChild(editorLabel);

    this.modal.modalBody.appendChild(this.editorContainer);

    this.editor = new RectangleEditor(this.editorContainer, {
      width: 700,
      height: 394,
      snapEnabled: true,
      autoFitEnabled: false,
      showNumbers: true,
      onRectanglesChanged: (data: any) => this.handleEditorChange(data),
    });

    // Update preview and auto-save when any config input changes
    const onInputChange = () => {
      this.updateEditorPreview();
      this.autoSaveChaserConfig();
    };
    this.fieldWidth.onChange(onInputChange);
    this.fieldHeight.onChange(onInputChange);
    this.ledCountLeft.onChange(onInputChange);
    this.ledCountRight.onChange(onInputChange);
    this.ledCountTop.onChange(onInputChange);
    this.ledCountBottom.onChange(onInputChange);
    this.startLed.onChange(onInputChange);
    this.clockWise.onChange(onInputChange);
    this.bufferSeconds.onChange(() => this.autoSaveChaserConfig());

    // Set up the modal's save button callback
    this.modal.onSave(() => this.saveChaserConfig());
  }

  static get observedAttributes() {
    return ["ip", "name"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "ip" && oldValue !== newValue) {
      this.ip = newValue;
      if (!this.state)
        this.state = new State([this.ip], (name, value) => {
          this.render(name, value);
        });
      this.fetchAndRenderDeviceDetails();
    } else if (name === "name" && oldValue !== newValue) {
      this.name = newValue;
    }
  }

  async connectedCallback() {
    if (this.ip) {
      await this.fetchAndRenderDeviceDetails();
    }
  }

  async fetchAndRenderDeviceDetails() {
    if (!this.ip || !this.state)
      throw new Error("IP not set or state not initialized");

    const deviceDetails = (await this.state.get(`${this.ip}`)) || {};
    this.render(this.ip, deviceDetails);
  }

  render(name: string, value: any) {
    this.deviceDetails = value;
    const { ip = "0.0.0.0", device, chaserConfig } = this.deviceDetails;
    this.modal.setModalTitle(`ChaserSettings ${device?.info?.name || ip}`);

    // Load saved chaser config if it exists (silent to avoid triggering save loops)
    if (chaserConfig) {
      this.fieldWidth.setValue(chaserConfig.fieldWidth || 10, true);
      this.fieldHeight.setValue(chaserConfig.fieldHeight || 10, true);
      this.ledCountLeft.setValue(chaserConfig.ledCountLeft || 0, true);
      this.ledCountRight.setValue(chaserConfig.ledCountRight || 0, true);
      this.ledCountTop.setValue(chaserConfig.ledCountTop || 0, true);
      this.ledCountBottom.setValue(chaserConfig.ledCountBottom || 114, true);
      this.bufferSeconds.setValue(chaserConfig.bufferSeconds || 5, true);
      this.startLed.setValue(chaserConfig.startLed || 0, true);
      this.clockWise.setValue(
        chaserConfig.clockWise !== undefined ? chaserConfig.clockWise : 1,
        true,
      );
    }
    this.innerHTML =
      DeviceCard.style +
      DeviceCard.template
        .replace("$1", device?.info?.name || "Unknown Device")
        .replace("$2", ip);

    // Attach live desktop stream to the video element
    const video = this.querySelector(".background-video") as HTMLVideoElement;
    if (video) {
      getDesktopStream().then((stream) => {
        if (stream && video.isConnected) {
          video.srcObject = stream;
        }
      });
    }

    const ipElement = this.querySelector(".ip");
    if (ipElement) {
      ipElement.addEventListener("click", (event) => {
        event.stopPropagation();
        this.openDeviceSettings();
      });
    }

    const card = this.querySelector(".device");
    if (card) {
      card.addEventListener("click", (event) => {
        this.openChaserSettings();
      });
    }
  }

  handleEditorChange(data: any) {
    if (!data || !data.rectangles || data.rectangles.length === 0) return;

    const cw = data.canvasWidth;
    const ch = data.canvasHeight;

    // Calculate average field dimensions as percentage (0-100)
    const avgWidth =
      data.rectangles.reduce((sum: number, r: any) => sum + r.width, 0) /
      data.rectangles.length;
    const avgHeight =
      data.rectangles.reduce((sum: number, r: any) => sum + r.height, 0) /
      data.rectangles.length;

    const fieldWidthPercent = Math.round((avgWidth / cw) * 100);
    const fieldHeightPercent = Math.round((avgHeight / ch) * 100);

    // Update inputs silently (we call autoSave explicitly below)
    this.fieldWidth.setValue(Math.max(1, Math.min(100, fieldWidthPercent)), true);
    this.fieldHeight.setValue(Math.max(1, Math.min(100, fieldHeightPercent)), true);

    // Auto-save so the chaser picks up changes immediately
    this.autoSaveChaserConfig();
  }

  private async autoSaveChaserConfig() {
    if (!this.ip || !this.state) return;

    const totalLeds =
      this.ledCountLeft.getValue() +
      this.ledCountRight.getValue() +
      this.ledCountTop.getValue() +
      this.ledCountBottom.getValue();

    if (totalLeds === 0) return;

    try {
      const chaserConfig = {
        fieldWidth: this.fieldWidth.getValue(),
        fieldHeight: this.fieldHeight.getValue(),
        ledCountLeft: this.ledCountLeft.getValue(),
        ledCountRight: this.ledCountRight.getValue(),
        ledCountTop: this.ledCountTop.getValue(),
        ledCountBottom: this.ledCountBottom.getValue(),
        bufferSeconds: this.bufferSeconds.getValue(),
        startLed: this.startLed.getValue(),
        clockWise: this.clockWise.getValue(),
      };

      const deviceData = (await this.state.get(this.ip)) || {};
      deviceData.chaserConfig = chaserConfig;
      await this.state.set(this.ip, deviceData);
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }

  updateEditorPreview() {
    const countLeft = this.ledCountLeft.getValue();
    const countRight = this.ledCountRight.getValue();
    const countTop = this.ledCountTop.getValue();
    const countBottom = this.ledCountBottom.getValue();
    const totalLeds = countLeft + countRight + countTop + countBottom;

    if (totalLeds === 0) {
      this.editor.clearAll();
      return;
    }

    try {
      const ledFields = generateLedFields({
        ledsX: countBottom + countTop,
        ledsY: countLeft + countRight,
        bottom: countBottom > 0,
        left: countLeft > 0,
        right: countRight > 0,
        top: countTop > 0,
        clockwise: this.clockWise.getValue() === 1,
        fieldHeight: this.fieldHeight.getValue(),
        fieldWidth: this.fieldWidth.getValue(),
        startLed: this.startLed.getValue(),
      });

      // Convert normalized (0-1) coordinates to canvas pixels
      const cw = this.editor.canvas.width;
      const ch = this.editor.canvas.height;

      const rectangles = ledFields.map((field: any, i: number) => ({
        number: i + 1,
        x: field.x * cw,
        y: field.y * ch,
        width: field.width * cw,
        height: field.height * ch,
      }));

      this.editor.importData({
        rectangles,
        canvasWidth: cw,
        canvasHeight: ch,
      });
    } catch {
      // Invalid config, ignore
    }
  }

  async loadEditorThumbnail() {
    try {
      const sources = await window.ipcRenderer.invoke("GET_VIDEO_SOURCES", {
        width: 720,
        height: 405,
      });
      if (!sources || sources.length === 0) return;

      // Use first screen source as background
      const screenSource =
        sources.find((s: any) => s.id.startsWith("screen:")) || sources[0];

      if (screenSource?.thumbnail) {
        const img = new Image();
        img.onload = () => {
          this.editor.image = img;
          this.editor.draw();
        };
        img.src = screenSource.thumbnail;
      }
    } catch (err) {
      console.error("Failed to load editor thumbnail:", err);
    }
  }

  openChaserSettings() {
    this.modal.toggle();
    this.updateEditorPreview();
    this.loadEditorThumbnail();
  }

  openDeviceSettings() {
    if (this.ip) {
      window.open(`http://${this.ip}`, "_blank");
    }
  }

  async saveChaserConfig() {
    if (!this.ip || !this.state) {
      Toaster({
        text: "Cannot save: Configuration not initialized",
        type: "error",
        duration: 3000,
      }).showToast();
      return;
    }

    try {
      const chaserConfig = {
        fieldWidth: this.fieldWidth.getValue(),
        fieldHeight: this.fieldHeight.getValue(),
        ledCountLeft: this.ledCountLeft.getValue(),
        ledCountRight: this.ledCountRight.getValue(),
        ledCountTop: this.ledCountTop.getValue(),
        ledCountBottom: this.ledCountBottom.getValue(),
        bufferSeconds: this.bufferSeconds.getValue(),
        startLed: this.startLed.getValue(),
        clockWise: this.clockWise.getValue(),
      };

      // Validate configuration
      const totalLeds =
        chaserConfig.ledCountLeft +
        chaserConfig.ledCountRight +
        chaserConfig.ledCountTop +
        chaserConfig.ledCountBottom;

      if (totalLeds === 0) {
        Toaster({
          text: "⚠️ At least one side must have LEDs configured",
          type: "warning",
          duration: 3000,
        }).showToast();
        return;
      }

      if (chaserConfig.startLed >= totalLeds) {
        Toaster({
          text: `⚠️ Start LED (${chaserConfig.startLed}) must be less than total LEDs (${totalLeds})`,
          type: "warning",
          duration: 3000,
        }).showToast();
        return;
      }

      // Get existing device data and add chaser config
      const deviceData = (await this.state.get(this.ip)) || {};
      deviceData.chaserConfig = chaserConfig;

      // Save back to database
      await this.state.set(this.ip, deviceData);

      // Show success toast
      Toaster({
        text: `✓ Configuration saved for ${this.name || this.ip}`,
        type: "success",
        duration: 3000,
      }).showToast();

      // Close modal after successful save
      setTimeout(() => {
        this.modal.close();
      }, 1500);
    } catch (error) {
      console.error(`Failed to save config for ${this.ip}:`, error);

      Toaster({
        text: `Failed to save configuration: ${error.message}`,
        type: "error",
        duration: 4000,
      }).showToast();
    }
  }
}

customElements.define("device-card", DeviceCard);
