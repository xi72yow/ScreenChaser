import Modal from "@core/modal";
import NumberInput from "@core/numberInput";
import IconButton from "@core/iconButton";
import Toaster, { ToastTypes } from "@core/toasts";
import trashIcon from "@core/icons/trash.svg";
import RectangleEditor from "@/ledFieldEditor/rectangle-editor";
import { generateLedFields } from "@/biasCalculation/ledFields";
import { daemon } from "@/ws";
import { preview, type PreviewFrame } from "@/preview";
import "./index.css";

class DeviceCard extends HTMLElement {
  static template = `
    <div class="device">
        <canvas class="device-canvas"></canvas>
        <div class="device-details">
            <div class="head" style="margin: 10px;">
                <div class="name">$1</div>
                <span class="ip" style="font-size: 0.8em; cursor: pointer;">$2</span>
            </div>
        </div>
    </div>
  `;

  deviceId: string = "";
  ip: string = "";
  deviceName: string = "";

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

  private canvas: HTMLCanvasElement | null = null;
  private ledFields: any[] = [];
  private ledColors: { r: number; g: number; b: number }[] = [];
  private frameListener: ((frame: PreviewFrame) => void) | null = null;
  private colorsHandler: ((msg: any) => void) | null = null;
  private editorFrameListener: ((frame: PreviewFrame) => void) | null = null;
  private editorSized = false;

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
      defaultValue: 0.5,
      step: 0.1,
      float: true,
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

    this.editorContainer = document.createElement("div");
    this.editorContainer.style.cssText = `
      grid-column: 1 / -1;
      background: var(--BGDarker, #191a21);
      border-radius: 4px;
      padding: 8px;
      border: 1px solid var(--BORDER, #44475a);
    `;

    this.modal.modalBody.appendChild(this.editorContainer);

    this.editor = new RectangleEditor(this.editorContainer, {
      width: 700,
      height: 394,
      snapEnabled: true,
      autoFitEnabled: false,
      showNumbers: true,
      onRectanglesChanged: (data: any) => this.handleEditorChange(data),
    });

    const onInputChange = () => {
      this.updateLedFields();
      this.updateEditorPreview();
      this.saveConfig();
    };
    const onGeneratorChange = () => {
      this.ledFields = [];
      onInputChange();
    };
    this.fieldWidth.onChange(onGeneratorChange);
    this.fieldHeight.onChange(onGeneratorChange);
    this.ledCountLeft.onChange(onGeneratorChange);
    this.ledCountRight.onChange(onGeneratorChange);
    this.ledCountTop.onChange(onGeneratorChange);
    this.ledCountBottom.onChange(onGeneratorChange);
    this.startLed.onChange(onGeneratorChange);
    this.clockWise.onChange(onGeneratorChange);
    this.bufferSeconds.onChange(() => this.saveConfig());

    this.modal.saveIconBtn?.iconButton?.remove();

    new IconButton({
      container: this.modal.buttonSpace,
      stateOneIcon: trashIcon,
      stateTwoIcon: trashIcon,
      stateOneStrokeColor: "#ff5555",
      stateTwoStrokeColor: "#ff5555",
      onClick: () => {
        if (this.deviceId) {
          daemon.removeDevice(this.deviceId);
          this.modal.close();
          this.remove();
        }
      },
    });
  }

  private connected = false;

  static get observedAttributes() {
    return ["device-id", "ip", "name"];
  }

  attributeChangedCallback(attr: string, _old: string, val: string) {
    if (attr === "device-id") this.deviceId = val;
    if (attr === "ip") this.ip = val;
    if (attr === "name") this.deviceName = val;
    if (this.connected) this.render();
  }

  async connectedCallback() {
    this.connected = true;
    await this.loadFromDaemon();
    this.startLivePreview();
  }

  disconnectedCallback() {
    this.stopLivePreview();
  }

  async loadFromDaemon() {
    try {
      await daemon.connect();
      const response = await daemon.getConfig();
      const device = response.config?.devices?.[this.deviceId];
      if (device?.chaser) {
        this.fieldWidth.setValue(device.chaser.field_width || 10, true);
        this.fieldHeight.setValue(device.chaser.field_height || 10, true);
        this.ledCountLeft.setValue(device.chaser.led_count_left || 0, true);
        this.ledCountRight.setValue(device.chaser.led_count_right || 0, true);
        this.ledCountTop.setValue(device.chaser.led_count_top || 0, true);
        this.ledCountBottom.setValue(device.chaser.led_count_bottom || 0, true);
        this.bufferSeconds.setValue(device.chaser.buffer_seconds || 0.5, true);
        this.startLed.setValue(device.chaser.start_led || 0, true);
        this.clockWise.setValue(device.chaser.clockwise ? 1 : 0, true);
        if (device.name) this.deviceName = device.name;
        if (device.chaser.fields?.length) {
          this.ledFields = device.chaser.fields;
        }
      }
    } catch (err) {
      console.error("failed to load device config:", err);
    }
    if (this.ledFields.length === 0) {
      this.updateLedFields();
    }
    this.render();
  }

  render() {
    this.modal.setModalTitle(`ChaserSettings ${this.deviceName || this.ip}`);
    this.innerHTML = DeviceCard.template
      .replace("$1", this.deviceName || "Unknown Device")
      .replace("$2", this.ip);

    this.canvas = this.querySelector(".device-canvas") as HTMLCanvasElement;

    const ipElement = this.querySelector(".ip");
    if (ipElement) {
      ipElement.addEventListener("click", (event) => {
        event.stopPropagation();
        if (this.ip) window.open(`http://${this.ip}`, "_blank");
      });
    }

    const card = this.querySelector(".device");
    if (card) {
      card.addEventListener("click", () => {
        this.openChaserSettings();
      });
    }
  }

  private async openChaserSettings() {
    this.modal.toggle();
    this.editorSized = false;

    if (this.modal.modal.style.display !== "none") {
      this.editorFrameListener = (frame: PreviewFrame) => {
        if (!this.editorSized && frame.width > 0 && frame.height > 0) {
          const aspect = frame.width / frame.height;
          const maxWidth = this.editorContainer.clientWidth - 18;
          this.editor.canvas.width = Math.round(maxWidth);
          this.editor.canvas.height = Math.round(maxWidth / aspect);
          this.editorSized = true;
          this.updateEditorPreview();
        }
        createImageBitmap(frame.imageData).then((bmp) => {
          this.editor.image = bmp;
          this.editor.draw();
        });
      };
      preview.subscribe(this.editorFrameListener);

      const last = preview.lastFrame;
      if (last) {
        this.editorFrameListener(last);
      } else {
        this.updateEditorPreview();
      }

      this.loadFromDaemon();

      const observer = new MutationObserver(() => {
        if (this.modal.modal.style.display === "none") {
          if (this.editorFrameListener) {
            preview.unsubscribe(this.editorFrameListener);
            this.editorFrameListener = null;
          }
          this.loadFromDaemon();
          observer.disconnect();
        }
      });
      observer.observe(this.modal.modal, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  }

  private startLivePreview() {
    this.frameListener = (frame: PreviewFrame) => {
      this.drawCardPreview(frame);
    };
    preview.subscribe(this.frameListener);

    this.colorsHandler = (msg: any) => {
      if (msg.colors?.[this.deviceId]) {
        this.ledColors = msg.colors[this.deviceId];
      }
    };
    daemon.on("led_colors", this.colorsHandler);
  }

  private stopLivePreview() {
    if (this.frameListener) {
      preview.unsubscribe(this.frameListener);
      this.frameListener = null;
    }
    if (this.colorsHandler) {
      daemon.off("led_colors", this.colorsHandler);
      this.colorsHandler = null;
    }
  }

  private drawCardPreview(frame: PreviewFrame) {
    if (!this.canvas) return;
    const cw = this.canvas.clientWidth || 200;
    const ch = this.canvas.clientHeight || 120;
    this.canvas.width = cw;
    this.canvas.height = ch;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    createImageBitmap(frame.imageData).then((bmp) => {
      ctx.drawImage(bmp, 0, 0, cw, ch);
      bmp.close();

      this.drawLedOverlay(ctx, cw, ch);
    });
  }

  private drawLedOverlay(ctx: CanvasRenderingContext2D, cw: number, ch: number) {

    for (let i = 0; i < this.ledFields.length; i++) {
      const f = this.ledFields[i];
      const color = this.ledColors[i];
      const x = f.x * cw;
      const y = f.y * ch;
      const w = f.width * cw;
      const h = f.height * ch;

      if (color) {
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.6)`;
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }

  private updateLedFields() {
    const countLeft = this.ledCountLeft.getValue();
    const countRight = this.ledCountRight.getValue();
    const countTop = this.ledCountTop.getValue();
    const countBottom = this.ledCountBottom.getValue();

    if (countLeft + countRight + countTop + countBottom === 0) {
      this.ledFields = [];
      return;
    }

    try {
      this.ledFields = generateLedFields({
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
    } catch {
      this.ledFields = [];
    }
  }

  handleEditorChange(data: any) {
    if (!data?.rectangles?.length) return;

    const cw = data.canvasWidth;
    const ch = data.canvasHeight;

    this.ledFields = data.rectangles.map((r: any) => ({
      x: r.x / cw,
      y: r.y / ch,
      width: r.width / cw,
      height: r.height / ch,
    }));

    this.saveConfig();
  }

  updateEditorPreview() {
    if (this.ledFields.length === 0) {
      this.editor.clearAll();
      return;
    }

    try {
      const cw = this.editor.canvas.width;
      const ch = this.editor.canvas.height;

      this.editor.importData({
        rectangles: this.ledFields.map((field: any, i: number) => ({
          number: i + 1,
          x: field.x * cw,
          y: field.y * ch,
          width: field.width * cw,
          height: field.height * ch,
        })),
        canvasWidth: cw,
        canvasHeight: ch,
      });
    } catch {
      // invalid config
    }
  }

  async saveConfig() {
    if (!this.deviceId || !this.ip) return;

    const totalLeds =
      this.ledCountLeft.getValue() +
      this.ledCountRight.getValue() +
      this.ledCountTop.getValue() +
      this.ledCountBottom.getValue();

    if (totalLeds === 0) return;

    try {
      await daemon.updateDevice(this.deviceId, {
        ip: this.ip,
        name: this.deviceName || this.deviceId,
        enabled: true,
        chaser: {
          field_width: this.fieldWidth.getValue(),
          field_height: this.fieldHeight.getValue(),
          led_count_left: this.ledCountLeft.getValue(),
          led_count_right: this.ledCountRight.getValue(),
          led_count_top: this.ledCountTop.getValue(),
          led_count_bottom: this.ledCountBottom.getValue(),
          buffer_seconds: this.bufferSeconds.getValue(),
          start_led: this.startLed.getValue(),
          clockwise: this.clockWise.getValue() === 1,
          fields: this.ledFields.length > 0 ? this.ledFields : null,
        },
      });
    } catch (err) {
      console.error("failed to save config:", err);
      Toaster({
        text: `Failed to save: ${err}`,
        type: ToastTypes.ERROR,
        duration: 3000,
      }).showToast();
    }
  }
}

customElements.define("device-card", DeviceCard);
