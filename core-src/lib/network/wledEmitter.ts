import dgram from "dgram";
import { hexToRgb } from "../basics/convertRgbHex";
import os from "os";
import { ChaserTypes } from "../types";

interface Chaser {
  ip: string;
  type: string;
}

export interface DataEmitterInterface {
  ip: string | undefined;
  server: dgram.Socket;
  emit(data: any[]): void;
  getHealth(): {
    sendedPacks: number;
    recivedPacks: number;
    packageloss: number;
    power: number;
    maxPower: number;
  };
  getIp(): string | undefined;
}

export default class WledHyperionEmitter implements DataEmitterInterface {
  ip: string | undefined;
  server: dgram.Socket;
  optimisticStripeData: any[];
  scanningNetwork: boolean;
  onEmit: ((ip: string, pixelArray: string | any[]) => void) | undefined;
  type: ChaserTypes;

  constructor(param: {
    ip?: string;
    onEmit?: (ip: string, pixelArray: string | any[]) => void;
    type: ChaserTypes;
  }) {
    const { ip, onEmit, type } = param;
    this.ip = ip;
    this.server = dgram.createSocket("udp4");
    this.optimisticStripeData = [];
    this.scanningNetwork = false;
    this.onEmit = onEmit;
    this.type = type;
  }

  getHealth(): {
    sendedPacks: number;
    recivedPacks: number;
    packageloss: number;
    power: number;
    maxPower: number;
  } {
    return {
      sendedPacks: 0, //this.sendedPacks,
      recivedPacks: 0, //this.recivedPacks,
      packageloss: 0, // (this.recivedPacks / this.sendedPacks) * 100 - 100,
      power: this.claculatePower(),
      maxPower: this.optimisticStripeData.length * 3 * 20 * 0.005,
    };
  }

  claculatePower() {
    let power = 0;

    this.optimisticStripeData.forEach((color, i) => {
      let rgb = hexToRgb(color);
      power += (rgb.r / 255) * 20 + (rgb.g / 255) * 20 + (rgb.b / 255) * 20;
    });

    //D1 Mini 100mA RPI0 1A
    return power * 0.005;
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

      const fetchPomises = trys.map(async (tryy) => {
        const ip = this.binToIp(baseAddressBin + tryy);
        try {
          const response = await fetch(`http://${ip}`);
          if (response.status === 200) {
            const text = await response.text();
            if (text.includes("WLED")) {
              ledSlaves.push({ ip, type: "WLED" });
              // this prevents the led stripe from turning back to the other mode
              const message = Buffer.from("02ff000000", "hex");
              this.server.send(message, 21324, ip);
            }
            if (text.includes("ScreenChaser")) {
              ledSlaves.push({ ip, type: "ScreenChaser" });
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

  emit(data: any[]): void {
    if (!this.ip) throw new Error("No IP set.");
    if (this.onEmit) this.onEmit(this.ip, data);

    this.optimisticStripeData = data;
    let hexString = data.join("");
    
    if (this.type === "ScreenChaser") hexString = "00" + hexString;

    const message = Buffer.from(hexString, "hex");
    this.server.send(message, 19446, this.ip, function (err, bytes) {
      if (err) throw err;
    });
  }
}
