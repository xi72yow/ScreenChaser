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
  ip: string | undefined;
  device: WLEDDeviceData | undefined;
  server: dgram.Socket;
  emitUdp(data: any[]): void;
  getIp(): string | undefined;
  callApi(data: WLEDDeviceData): Promise<WLEDDeviceData>;
}

export default class WledConnector implements WledConnectorInterface {
  ip: string | undefined;
  server: dgram.Socket;
  device: WLEDDeviceData | undefined;
  optimisticStripeData: any[];
  scanningNetwork: boolean;
  onEmit: ((ip: string, pixelArray: string | any[]) => void) | undefined;

  constructor(param: {
    ip?: string;
    onEmit?: (ip: string, pixelArray: string | any[]) => void;
  }) {
    const { ip, onEmit } = param;
    this.ip = ip;
    this.server = dgram.createSocket("udp4");
    this.optimisticStripeData = [];
    this.scanningNetwork = false;
    this.onEmit = onEmit;
  }

  getIp(): string | undefined {
    return this.ip;
  }

  dec2bin(dec: number) {
    return (dec >>> 0).toString(2);
  }

  combinations(n: number) {
    const r = [];
    for (let i = 0; i < 1 << n; i++) {
      const c = [];
      for (let j = 0; j < n; j++) {
        c.push(i & (1 << j) ? "1" : "0");
      }
      r.push(c.join(""));
    }
    return r;
  }

  /**
   * returns an array with arrays of the given size
   *
   * @param myArray {Array} array to split
   * @param chunk_size {Integer} Size of every group
   * @return {Array} contains all chunks
   */
  chunkArray(myArray: string, chunk_size: number) {
    let index = 0;
    const tempArray = [];

    for (index = 0; index < myArray.length; index += chunk_size) {
      const myChunk = myArray.slice(index, index + chunk_size);
      tempArray.push(myChunk);
    }
    return tempArray;
  }

  binToIp(bin: string) {
    return this.chunkArray(bin, 8)
      .map((octet) => parseInt(octet, 2))
      .join(".");
  }

  ipToBin(ip: string) {
    return ip
      .split(".")
      .map((value: string) => {
        const convert = this.dec2bin(parseInt(value));
        return "0".repeat(8 - convert.length) + convert;
      })
      .join("");
  }

  async scanNetwork(): Promise<Chaser[] | []> {
    console.warn("scanNetwork() is deprecated. Use dns-sd instead.");
    const ledSlaves: Chaser[] = [];
    return new Promise(async (resolve, reject) => {
      if (this.scanningNetwork) reject("Already scanning network.");

      this.scanningNetwork = true;
      const interfaces = Object.keys(os.networkInterfaces()).filter(
        (value) => value !== "lo" && value !== "Loopback Pseudo-Interface 1"
      );

      const importantInterface = os
        .networkInterfaces()
        [interfaces[0]]?.find((x) => x.family === "IPv4");

      if (!importantInterface) {
        resolve([]);
        this.scanningNetwork = false;
        console.warn("No network interface found.");
        return;
      }

      const netmaskBin = this.ipToBin(importantInterface.netmask);
      const addressBin = this.ipToBin(importantInterface.address);
      const netmaskCount = netmaskBin.indexOf("0");
      const reverseMask =
        "0".repeat(netmaskCount) + "1".repeat(32 - netmaskCount);
      const baseAddressBin = addressBin.slice(0, netmaskCount);
      const minAddrBin = `${baseAddressBin + "0".repeat(31 - netmaskCount)}1`;
      const maxAddrBin = `${baseAddressBin + "1".repeat(31 - netmaskCount)}0`;
      const broadcastAddr = this.dec2bin(
        parseInt(reverseMask, 2) |
          parseInt(addressBin + "0".repeat(32 - addressBin.length), 2)
      );
      const myIp = this.binToIp(addressBin);
      const broadcast = this.binToIp(broadcastAddr);
      const maxAddr = this.binToIp(maxAddrBin);
      const gateWay = this.binToIp(minAddrBin);
      const addressesCount = 2 ** (32 - netmaskCount) - 2;

      const trys = this.combinations(32 - netmaskCount);

      if (trys.length > 300) reject("To many Ips in Network.");

      const fetchPomises = trys.map(async (tryy) => {
        const ip = this.binToIp(baseAddressBin + tryy);
        try {
          const response = await fetch(`http://${ip}`);
          if (response.status === 200) {
            const text = await response.text();
            if (text.includes("WLED")) {
              ledSlaves.push({ ip });
              // this prevents the led stripe from turning back to the other mode
              const message = Buffer.from("02ff000000", "hex");
              this.server.send(message, 21324, ip);
            }
            if (text.includes("ScreenChaser")) {
              ledSlaves.push({ ip });
            }
          }
        } catch (e) {
          // this device is probably not a led stripe
        }
      });

      await Promise.all(fetchPomises);

      this.scanningNetwork = false;
      resolve(ledSlaves);
    });
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

  async callApi(data: WLEDDeviceData | undefined): Promise<WLEDDeviceData> {
    if (!this.ip) throw new Error("No IP set.");

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
