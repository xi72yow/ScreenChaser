import Modal from "@core/modal";
import NumberInput from "@core/numberInput";
import Toaster from "@core/toasts";
import RectangleEditor from "@/ledFieldEditor/rectangle-editor";
import { generateLedFields } from "@/biasCalculation/ledFields";
import { daemon } from "@/ws";
import "./index.css";

class DeviceCard extends HTMLElement {
  static template = `
    <div class="device">
        <div class="device-details">
            <div class="head" style="margin: 10px;">
                <div class="name">$1</div>
                <div class="ip" style="font-size: 0.8em;">$2</div>
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

    const onInputChange = () => {
      this.updateEditorPreview();
      this.saveConfig();
    };
    this.fieldWidth.onChange(onInputChange);
    this.fieldHeight.onChange(onInputChange);
    this.ledCountLeft.onChange(onInputChange);
    this.ledCountRight.onChange(onInputChange);
    this.ledCountTop.onChange(onInputChange);
    this.ledCountBottom.onChange(onInputChange);
    this.startLed.onChange(onInputChange);
    this.clockWise.onChange(onInputChange);
    this.bufferSeconds.onChange(() => this.saveConfig());

    this.modal.onSave(() => this.saveConfig());
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
      }
    } catch (err) {
      console.error("failed to load device config:", err);
    }
    this.render();
  }

  render() {
    this.modal.setModalTitle(`ChaserSettings ${this.deviceName || this.ip}`);
    this.innerHTML = DeviceCard.template
      .replace("$1", this.deviceName || "Unknown Device")
      .replace("$2", this.ip);

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
        this.modal.toggle();
        this.updateEditorPreview();
      });
    }
  }

  handleEditorChange(data: any) {
    if (!data?.rectangles?.length) return;

    const cw = data.canvasWidth;
    const ch = data.canvasHeight;
    const avgWidth =
      data.rectangles.reduce((sum: number, r: any) => sum + r.width, 0) /
      data.rectangles.length;
    const avgHeight =
      data.rectangles.reduce((sum: number, r: any) => sum + r.height, 0) /
      data.rectangles.length;

    this.fieldWidth.setValue(
      Math.max(1, Math.min(100, Math.round((avgWidth / cw) * 100))),
      true
    );
    this.fieldHeight.setValue(
      Math.max(1, Math.min(100, Math.round((avgHeight / ch) * 100))),
      true
    );
    this.saveConfig();
  }

  updateEditorPreview() {
    const countLeft = this.ledCountLeft.getValue();
    const countRight = this.ledCountRight.getValue();
    const countTop = this.ledCountTop.getValue();
    const countBottom = this.ledCountBottom.getValue();

    if (countLeft + countRight + countTop + countBottom === 0) {
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

      const cw = this.editor.canvas.width;
      const ch = this.editor.canvas.height;

      this.editor.importData({
        rectangles: ledFields.map((field: any, i: number) => ({
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
        },
      });
    } catch (err) {
      console.error("failed to save config:", err);
      Toaster({
        text: `Failed to save: ${err}`,
        type: "error",
        duration: 3000,
      }).showToast();
    }
  }
}

customElements.define("device-card", DeviceCard);
