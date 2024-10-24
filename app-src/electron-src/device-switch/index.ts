import mDnsSd from "../dns-service-discovery/dns-sd";
import WledConnector, {
  State,
  WledConnectorInterface,
} from "../wled-connector";

export default class DeviceSwitch {
  deviceMap!: Map<string, WledConnectorInterface>;
  mDnsSd!: typeof mDnsSd;

  constructor() {}

  async search(): Promise<void> {
    this.mDnsSd = mDnsSd;

    const deviceList = await this.mDnsSd.discover({
      name: "_services._dns-sd._udp.local",
      type: "PTR",
    });

    this.deviceMap = new Map();

    await Promise.all(
      deviceList.map(async (device) => {
        const wledConnector = new WledConnector({
          ip: device.address,
        });

        try {
          await wledConnector.init();
          this.deviceMap.set(device.address, wledConnector);
        } catch (error) {
          console.error(
            `Device on: ${device.address} is probably not a WLED device.`
          );
        }
      })
    );
  }

  getDevices(): Map<string, WledConnectorInterface> {
    return this.deviceMap;
  }

  getDevice(ip: string): WledConnectorInterface | undefined {
    return this.deviceMap.get(ip);
  }

  async callApi(ip: string, data: Partial<State>): Promise<void> {
    const device = this.getDevice(ip);

    if (!device) {
      throw new Error("Device not found.");
    }

    try {
      await device.callApi(data);
    } catch (error) {
      throw new Error("Could not connect to device.");
    }
  }

  emitUdp(ip: string, data: any[]): void {
    const device = this.getDevice(ip);

    if (!device) {
      throw new Error("Device not found.");
    }

    device.emitUdp(data);
  }
}
