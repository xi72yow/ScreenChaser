var MjpegCamera = require("./mjpeg-camera/mjpeg-camera");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CamManager {
  constructor(ips, io) {
    this.cams = [];
    this.frames = [];
    this.ips = ips;
    this.timer;
    this.timerInterval = 1000;
    this.aktive = false;
    this.io = io;

    this.createCams(ips);
  }

  camsOff() {
    if (this.aktive) {
      this.cams.forEach(async (cam, i) => {
        cam.stop();
        await sleep(200);
        cam.removeAllListeners("data");
      });
      this.aktive = false;
    }
  }

  createCams(ips) {
    this.camsOff();
    this.ips = ips;
    this.cams = [];
    for (let i = 0; i < ips.length; i++) {
      let camera = new MjpegCamera({
        name: "backdoor",
        url: "http://" + ips[i] + ":81/",
      });
      // camera.start();

      this.cams.push(camera);
    }
  }

  start() {
    if (!this.aktive) {
      this.aktive = true;
      this.cams.forEach((cam, i) => {
        cam.on("data", (frame) => {
          this.io.emit("cam" + i, frame.data.toString("base64"));
          this.frames[i] = frame.data;
        });
      });

      this.cams.forEach((cam, i) => {
        cam.start();
      });
      this.aktive = true;
    }
  }

  stop() {
    this.camsOff();
  }

  refresh(ips) {
    this.camsOff();

    this.createCams(ips);
  }

  getFrames() {
    return this.frames;
  }

  getIps() {
    return this.ips;
  }

  logCams() {
    console.log("🚀 ~ file: camApi.js ~ line 87 ~ this.cams", this.cams);
  }

  logFrames() {
    console.log("🚀 ~ file: camApi.js ~ line 87 ~ frames", this.frames);
  }
}

module.exports = CamManager;

/* 
const { Server } = require("socket.io");

const io = new Server(3000, {
  // options
});
var MjpegCamera = require("mjpeg-camera");

// Create an MjpegCamera instance
var camera = new MjpegCamera({
  name: "backdoor",
  url: "http://192.168.2.123:81/",
});

// As frames come in, emit them in socket.io
camera.on("data", function (frame) {
  io.emit("frame", frame.data.toString("base64"));
});

// Start streaming
camera.start();
 */
