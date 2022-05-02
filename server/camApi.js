const express = require("express");
const app = express();
const fs = require("fs");
const fetch = require("node-fetch");
const NetScanner = require("../effects/network/netScanner");
const CamManager = require("./CamManager");
const url = "http://192.168.2.123:81/";

var MjpegCamera = require("mjpeg-camera");

let cams;
let frames = [];

async function getCams() {
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
    cams = new CamManager(camIps);
    cams.start();
  } catch (error) {
    console.log("🚀 ~ file: camApi.js ~ line 21 ~ error", error);
  }
}

getCams();

app.get("/", function (req, res) {
  fs.readFile(__dirname + "/" + "cams.html", "utf8", function (err, data) {
    // console.log("🚀 ~ file: camApi.js ~ line 7 ~ __dirname", __dirname);
    //  console.log(data);
    res.end(data);
  });
});

app.get("/xSlaves", async function (req, res) {
  res.end(JSON.stringify(cams.getIps()));
});
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
app.get("/cams", async (req, res) => {
  console.log("🚀", req.query);
  cams.logFrames();
  // cams.logCams();
  res.end(cams.getFrames()[randomInteger(0, cams.getFrames().length - 1)]);

  /*   cams.forEach((cam, i) => {
    cam.on("data", function (frame) {
      //console.log("🚀 ~ file: camApi.js ~ line 87 ~ frame", frame);
      frames.push(frame.data);
    });

    cam.start();
  });
  console.log(`Ⓧ: `, frames[0]);
  setTimeout(() => {
    res.end(frames[0]);
  }, 50); */
  //got.stream(url).pipe(res);
  //console.log(`Ⓧ: `, data);
  //res.end(data.toString("base64"));
});

var server = app.listen(3000, "localhost", function () {
  var host = server.address().address;
  console.log(
    "🚀 ~ file: camApi.js ~ line 14 ~ server ~ host",
    server.address()
  );
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});
