var MjpegCamera = require("mjpeg-camera");

class CamManager {
  constructor(ips) {
    this.cams = [];
    this.frames = [];
    this.ips = ips;
    this.timer;
    this.timerInterval = 1000;
    this.aktive = false;

    for (let i = 0; i < ips.length; i++) {
      let camera = new MjpegCamera({
        name: "backdoor",
        url: "http://" + ips[i] + ":81/",
      });
      // camera.start();

      this.cams.push(camera);
    }

    this.cams.forEach((cam, i) => {
      cam.on("data", (frame) => {
        this.frames[i] = frame.data;
      });
    });
  }

  start() {
    this.aktive = true;
    this.cams.forEach((cam, i) => {
      cam.start();
    });
  }

  stop() {
    this.aktive = false;
    this.cams.forEach((cam, i) => {
      cam.stop();
    });
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
