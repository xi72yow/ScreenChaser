const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const compression = require("compression");
var ip = require("ip");
/* const helmet = require("helmet");
 */
/* app.use(helmet());
 */

app.use(compression({ filter: shouldCompress }));

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}

const NetScanner = require("../effects/network/netScanner");
const CamManager = require("./CamManager");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cServer() {
  // await sleep(30000);
  let Cams = null;

  async function init() {
    return new Promise(async (resolve, reject) => {
      let camIps = [];
      try {
        const netScanner = new NetScanner();
        let xSlaves = await netScanner.scanNetwork();
        netScanner.logSlaves();
        xSlaves.forEach((slave) => {
          if (slave.type === "cam") {
            camIps.push(slave.ip);
          }
        });
        Cams = new CamManager(camIps, io);
      } catch (error) {
        console.log("🚀 ~ file: camApi.js ~ line 21 ~ error", error);
      }
      resolve(camIps);
    });
  }

  init();

  app.get("/xSlaves", function (req, res) {
    if (Cams) {
      res.end(JSON.stringify(Cams.getIps()));
    }
    res.status(205).end();
  });

  app.get("/scan", async function (req, res) {
    res.end("scan");
    let ips = await init();
    Cams.refresh(ips);
    setTimeout(() => {
      res.end("scan");
    }, 500);
  });

  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/cams.html");
  });

  app.get("/socket.io.js", (req, res) => {
    res.sendFile(__dirname + "/socket.io.js");
  });

  io.on("connection", async (socket) => {
    if (!Cams) return;
    const clients = await io.fetchSockets();
    if (clients.length === 1) {
      Cams.start();
      console.log("streams started");
    }
    socket.on("disconnect", async () => {
      console.log("user disconnected");
      //var clients = io.sockets.sockets;
      const clients = await io.fetchSockets();
      if (clients.length === 0) {
        Cams.stop();
        console.log("no clients");
        console.log("streams stopped");
      }
    });
    console.log("a user connected");
  });

  server.listen(3000, ip.address(), () => {
    var host = server.address().address;

    var port = server.address().port;

    console.log("🚀 ~ app listening at http://%s:%s", host, port);
  });
}

cServer();
