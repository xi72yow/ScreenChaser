import { State } from "@/core/db/state";
import Modal from "@core/modal";
import NumberInput from "@core/numberInput";
import BooleanInput from "@core/booleanInput";
import "./index.css";

class DeviceCard extends HTMLElement {
  static style = `
  
  `;
  static template = `
        <div class="device">
            <video class="background-video" autoplay muted loop>
                <source src="$5" type="video/mp4">
            </video>
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
  videoSrc: string | undefined;
  [key: string]: any;
  modal: Modal;

  constructor() {
    super();
    this.modal = new Modal();
    const fieldWidth = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 100,
      defaultValue: 10,
      helperText: "Set the width of the field of the video in percentage",
      label: "Field Width",
    });

    const fieldHeight = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 100,
      defaultValue: 10,
      helperText: "Set the height of the field of the video in percentage",
      label: "Field Height",
    });

    const ledCountLeft = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of LEDs on the left side",
      label: "LED Count Left",
    });

    const ledCountRight = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of LEDs on the right side",
      label: "LED Count Right",
    });

    const ledCountTop = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of LEDs on the top side",
      label: "LED Count Top",
    });

    const ledCountBottom = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 114,
      helperText: "Set the number of LEDs on the bottom side",
      label: "LED Count Bottom",
    });

    const bufferedFrames = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the number of frames to buffer",
      label: "Buffered Frames",
    });

    const startLed = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 999,
      defaultValue: 0,
      helperText: "Set the starting LED, if you not start in an corner",
      label: "Start LED",
    });

    const clockWise = new NumberInput({
      container: this.modal.modalBody,
      minValue: 0,
      maxValue: 1,
      defaultValue: 1,
      helperText:
        "Set the direction of the LEDs, 1 for clockwise and 0 for counter clockwise",
      label: "Clockwise",
    });
  }

  static get observedAttributes() {
    return ["ip", "name", "video-src"];
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
    } else if (name === "video-src" && oldValue !== newValue) {
      this.videoSrc = newValue;
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
    const { ip = "0.0.0.0", device } = this.deviceDetails;
    this.modal.setModalTitle(`ChaserSettings ${device.info.name || ip}`);
    this.innerHTML =
      DeviceCard.style +
      DeviceCard.template
        .replace("$1", device.info.name)
        .replace("$2", ip)
        .replace(
          "$5",
          this.videoSrc ||
            "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        );

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

  openChaserSettings() {
    console.log("Opening chaser settings: " + this.ip);
    this.modal.toggle();
  }

  openDeviceSettings() {
    if (this.ip) {
      window.open(`http://${this.ip}`, "_blank");
    }
  }
}

customElements.define("device-card", DeviceCard);
