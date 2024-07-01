import mDnsSd from "../dns-service-discovery/dns-sd";
import WledConnector from "../wled-connector";

export default class DeviceSwitch {
  deviceMap!: Map<string, string>;
  mDnsSd!: typeof mDnsSd;
  constructor() {
    this.init();
  }

  async init() {
    this.mDnsSd = mDnsSd;
    const deviceList = await this.mDnsSd.discover({
      name: "_services._dns-sd._udp.local",
      type: "PTR",
      key: "fqdn",
    });
    this.deviceMap = new Map();
    deviceList.forEach((device) => {
      console.log("🚀 ~ DeviceSwitch ~ deviceList.forEach ~ device:", device);
      // this.deviceMap.set(device.name, device.address);
    });
  }
}
