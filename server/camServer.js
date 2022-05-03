const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const NetScanner = require("../effects/network/netScanner");
const CamManager = require("./CamManager");

let Cams = null;

async function init() {
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
  return Cams;
}

init();

app.get("/xSlaves", function (req, res) {
  if (Cams) {
    res.end(JSON.stringify(Cams.getIps()));
  }
  res.status(205).end();
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
  }
  socket.on("disconnect", async () => {
    console.log("user disconnected");
    //var clients = io.sockets.sockets;
    const clients = await io.fetchSockets();
    if (clients.length === 0) {
      Cams.stop();
    }
  });
  console.log("a user connected");
});

server.listen(3000, "localhost", () => {
  var host = server.address().address;
  console.log(
    "🚀 ~ file: camApi.js ~ line 14 ~ server ~ host",
    server.address()
  );
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});
