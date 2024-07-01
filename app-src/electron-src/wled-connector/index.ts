import dgram from "dgram";
import os from "os";

interface Chaser {
  ip: string;
}

interface State {
  on: boolean;
  bri: number;
  transition: number;
  ps: number;
  pl: number;
  nl: {
    on: boolean;
    dur: number;
    fade: boolean;
    tbri: number;
  };
  udpn: {
    send: boolean;
    recv: boolean;
  };
  seg: Segment[];
}

interface Segment {
  start: number;
  stop: number;
  len: number;
  col: number[][];
  fx: number;
  sx: number;
  ix: number;
  pal: number;
  sel: boolean;
  rev: boolean;
  cln: number;
}

interface Info {
  ver: string;
  vid: number;
  leds: {
    count: number;
    rgbw: boolean;
    pin: number[];
    pwr: number;
    maxpwr: number;
    maxseg: number;
  };
  name: string;
  udpport: number;
  live: boolean;
  fxcount: number;
  palcount: number;
  arch: string;
  core: string;
  freeheap: number;
  uptime: number;
  opt: number;
  brand: string;
  product: string;
  btype: string;
  mac: string;
}

interface WLEDDeviceData {
  state: State;
  info: Info;
  effects: string[];
  palettes: string[];
}

export interface WledConnectorInterface {
  ip: string;
  device: WLEDDeviceData;
  server: dgram.Socket;
  emitUdp(data: any[]): void;
  getIp(): string | undefined;
  callApi(data: WLEDDeviceData): Promise<WLEDDeviceData>;
}

interface WledConnectorParams {
  ip: string;
  onEmit?: (ip: string, pixelArray: string | any[]) => void;
}

export default class WledConnector implements WledConnectorInterface {
  ip!: string;
  server!: dgram.Socket;
  device!: WLEDDeviceData;
  optimisticStripeData!: any[];
  onEmit: ((ip: string, pixelArray: string | any[]) => void) | undefined;

  constructor(param: WledConnectorParams) {
    this.init(param);
  }

  async init(param: WledConnectorParams): Promise<void> {
    const { ip, onEmit } = param;
    this.ip = ip;
    try {
      this.device = await this.callApi(undefined);
    } catch (error) {
      throw new Error("Could not connect to WLED device.");
    }
    this.server = dgram.createSocket("udp4");
    this.optimisticStripeData = [];
    this.onEmit = onEmit;
  }

  getIp() {
    return this.ip;
  }

  emitUdp(data: any[]): void {
    if (!this.ip) throw new Error("No IP set.");
    if (this.onEmit) this.onEmit(this.ip, data);

    this.optimisticStripeData = data;
    let hexString = data.join("");

    const message = Buffer.from(hexString, "hex");
    this.server.send(message, 19446, this.ip, function (err, bytes) {
      if (err) throw err;
    });
  }

  async callApi(
    data: Partial<WLEDDeviceData> | undefined
  ): Promise<WLEDDeviceData> {
    const url = `http://${this.ip}//json/state`;

    let response;

    if (!data)
      response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
      });
    else response = await fetch(url);

    return response.json();
  }
}
