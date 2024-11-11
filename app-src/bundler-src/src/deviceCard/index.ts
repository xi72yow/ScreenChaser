import { State } from "@/core/db/state";
import Modal from "@core/modal";
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

  constructor() {
    super();
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
      ipElement.addEventListener("click", this.openDeviceSettings.bind(this));
    }

    const card = this.querySelector(".device");
    if (card) {
      card.addEventListener("click", this.openChaserSettings.bind(this));
    }
  }

  openChaserSettings() {
    console.log("Opening chaser settings: " + this.ip);
    const modal = new Modal();
    modal.toggle();
  }

  openDeviceSettings() {
    if (this.ip) {
      window.open(`http://${this.ip}`, "_blank");
    }
  }
}

customElements.define("device-card", DeviceCard);
