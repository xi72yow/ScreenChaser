const dgram = require("dgram");
const os = require("os");
const { hexToRgb } = require("./basics/convertRgbHex");

class DataEmitter {
  constructor(DEBUG = false, ipaddr = "") {
    this.ipaddr = ipaddr;
    this.currentPixelArray = [];
    this.lastChunk = [];
    this.xSlaves = [];
    this.DEBUG = DEBUG;
    this.SCAN_NETWORK = false;
    this.sendedPacks = 0;
    this.recivedPacks = 0;
    this.server = dgram.createSocket("udp4");

    this.server.on("error", (err) => {
      console.log(`server error:\n${err.stack}`);
      server.close();
    });

    this.server.on("message", (msg, senderInfo) => {
      if (DEBUG) {
        if (this.recivedPacks === 0) {
          console.log(`Messages received ${msg}`);
        }
        this.recivedPacks++;
      }
      if (this.SCAN_NETWORK) this.xSlaves.push({ ...senderInfo });

      /*server.send(msg,senderInfo.port,senderInfo.address,()=>{
            console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`)
            })*/
    });

    this.server.on("listening", () => {
      const address = this.server.address();
      console.log(`server listening on ${address.address}:${address.port}`);
    });
  }

  /**
   * returns an array with arrays of the given size
   *
   * @param myArray {Array} array to split
   * @param chunk_size {Integer} Size of every group
   * @return {Array} contains all chunks
   */
  chunkArray(myArray, chunk_size) {
    let index = 0;
    const tempArray = [];

    for (index = 0; index < myArray.length; index += chunk_size) {
      const myChunk = myArray.slice(index, index + chunk_size);
      // Do something if you want with the group
      tempArray.push(myChunk);
    }
    return tempArray;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  dec2bin(dec) {
    return (dec >>> 0).toString(2);
  }

  combinations(n) {
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

  binToIp(bin) {
    return this.chunkArray(bin, 8)
      .map((octet) => parseInt(octet, 2))
      .join(".");
  }

  ipToBin(ip) {
    return ip
      .split(".")
      .map((value) => {
        const convert = this.dec2bin(parseInt(value));
        return "0".repeat(8 - convert.length) + convert;
      })
      .join("");
  }

  /**
   * send the stripe data to esp
   *
   * @param pixelArray {Array} represents the light colors (rgb-color formatted)
   * @return {Array} light colors (hex-color formatted)
   */
  emit(pixelArray) {
    if (this.ipaddr === "") {
      console.log(
        "ipaddr is not set: call init() first or set ipaddr manually"
      );
      return;
    }

    const hexColorStrip = [];
    let pixelUDPframe = "";
    this.currentPixelArray = [...pixelArray];
    for (let i = 0; i < pixelArray.length; i++) {
      const rgb = pixelArray[i];
      pixelUDPframe += rgb;
      hexColorStrip[i] = rgb;
    }
    //send Data to ESP esp rx max size is 256
    const sendingFrames = this.chunkArray(pixelUDPframe, 252); //252/6=42LED
    sendingFrames.forEach((frames, i) => {
      if (this.lastChunk[i] === frames) {
        return;
      }
      if (this.DEBUG) {
        this.sendedPacks++;
      }
      this.server.send(i.toString(16) + frames, 4210, this.ipaddr);
    });
    this.lastChunk = sendingFrames;
    return hexColorStrip;
  }

  logHealth() {
    if (this.DEBUG) {
      console.log(`sendedPacks: ${this.sendedPacks}`);
      console.log(`recivedPacks: ${this.recivedPacks}`);
      console.log(
        `packageloss: ${(this.recivedPacks / this.sendedPacks) * 100 - 100}%`
      );
    } else {
      console.log("debug is off");
    }
  }

  async init() {
    return new Promise(async (resolve, reject) => {
      if (this.ipaddr === "") {
        this.SCAN_NETWORK = true;
        const scanning = await this.scanNetwork();
        this.ipaddr = scanning[0].address;
        console.log(`ipaddr is set to: ${this.ipaddr}`);
      } else {
        console.log(`ipaddr is alredy set to: ${this.ipaddr}`);
      }
      resolve();
      this.SCAN_NETWORK = false;
    });
  }

  async scanNetwork() {
    this.SCAN_NETWORK = true;
    return new Promise(async (resolve, reject) => {
      console.log("Scanning network...");
      let scanningCount = 0;
      const interfaces = Object.keys(os.networkInterfaces()).filter(
        (value) => value !== "lo"
      );

      const importantInterface = os.networkInterfaces()[interfaces[0]][0];
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

      while (this.xSlaves.length === 0) {
        scanningCount++;

        for (let i = 0; i < trys.length; i++) {
          const tryy = trys[i];
          this.server.send(
            "FFFFFFF",
            4210,
            this.binToIp(baseAddressBin + tryy)
          );
        }
        await this.delay(150);
        if (scanningCount > 3) {
          break;
        }
      }

      await this.delay(1500);
      this.SCAN_NETWORK = false;
      resolve(this.xSlaves);
    });
  }

  claculatePower() {
    let power = 0;

    this.currentPixelArray.forEach((color, i) => {
      let rgb = hexToRgb(color);
      power += (rgb.r / 255) * 20 + (rgb.g / 255) * 20 + (rgb.b / 255) * 20;
    });
    
    //D1 Mini 100mA RPI0 1A
    return power * 0.005;
  }

  logMaxPower() {
    const maxPower = this.claculatePower();
    console.log(`maxPower for LEDs: ${maxPower} W`);
  }
}

module.exports = DataEmitter;
