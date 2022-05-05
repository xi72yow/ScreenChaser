const dgram = require("dgram");
const os = require("os");
const events = require("events");
const fetch = require("node-fetch");

class NetScanner {
  constructor(id, name, ip, port, protocol, status, result) {
    this.id = id;
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.protocol = protocol;
    this.status = status;
    this.xSlaves = [];
    this.server = dgram.createSocket("udp4");
    this.fetcher = new events.EventEmitter();

    this.server.on("error", (err) => {
      console.log(`server error:\n${err.stack}`);
      server.close();
    });

    this.server.on("message", (msg, senderInfo) => {
      if (this.recivedPacks === 0) {
        console.log(`Messages received ${msg}`);
      }
      this.recivedPacks++;

      const stripe = {
        ip: senderInfo.address,
        type: "led",
        port: senderInfo.port,
      };

      if (this.SCAN_NETWORK) this.xSlaves.push({ ...stripe });

      /*server.send(msg,senderInfo.port,senderInfo.address,()=>{
            console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`)
            })*/
    });

    this.fetcher.on("cam", (cam) => {
      this.xSlaves.push({ ...cam });
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

  async scanNetwork() {
    this.SCAN_NETWORK = true;
    return new Promise(async (resolve, reject) => {
      console.log("Scanning network...");
      let scanningCount = 0;
      const interfaces = Object.keys(os.networkInterfaces()).filter(
        (value) => value !== "lo"
      );

      const importantInterface = os.networkInterfaces()[interfaces[0]][0];

      const regexIpv4 = new RegExp(
        "^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(.(?!$)|$)){4}$"
      );

      if (!regexIpv4.test(importantInterface.address)) {
        console.log("No network interfaces found");
        resolve([]);
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

      while (this.xSlaves.length === 0) {
        scanningCount++;

        for (let i = 0; i < trys.length; i++) {
          const tryy = trys[i];
          const ip = this.binToIp(baseAddressBin + tryy);
          this.server.send(
            "FFFFFFF",
            4210,
            this.binToIp(baseAddressBin + tryy)
          );

          const cam = {
            ip: ip,
            type: "cam",
          };

          const fetchURL = `http://${ip}/status`;

          fetch(fetchURL)
            .then(async (res) => {
              const body = await res.json().catch((err) => {});

              if (body.framesize) {
                this.fetcher.emit("cam", cam);
              }
            })
            .catch((err) => {});
        }
        await this.delay(150);
        if (scanningCount > 3) {
          break;
        }
      }

      await this.delay(1500);

      this.xSlaves = [
        ...new Map(this.xSlaves.map((item) => [item["ip"], item])).values(),
      ];

      this.SCAN_NETWORK = false;
      resolve(this.xSlaves);
    });
  }

  logSlaves() {
    console.log("Found xSlaves in Network:", this.xSlaves);
  }
}

/* async function main() {
  const DataEmitterForIP = new NetScanner();
  await DataEmitterForIP.scanNetwork();
  DataEmitterForIP.logSlaves();
}
main(); */
module.exports = NetScanner;
