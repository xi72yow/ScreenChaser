var MjpegCamera = require("./mjpeg-camera/mjpeg-camera");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CamManager {
  constructor(ips, io) {
    this.cams = [null, null];
    this.frames = [];
    this.ips = ips;
    this.timer;
    this.timerInterval = 1000;
    this.aktive = false;
    this.io = io;

    this.createCams(ips);
  }

  async camsOff() {
    if (this.aktive) {
      for (let index = 0; index < this.ips.length; index++) {
        const cam = this.cams[index];
        await sleep(200);
        cam.stop();
        cam.setState(true);
        await sleep(200);
        cam.removeAllListeners();
      }

      this.aktive = false;
    }
  }

  createCams(ips) {
    this.ips = ips;
    console.log(
      "🚀 ~ file: CamManager.js ~ line 35 ~ CamManager ~ createCams ~ this.cams",
      this.cams
    );

    for (let i = 0; i < ips.length; i++) {
      let camera = new MjpegCamera({
        name: "backdoor",
        url: "http://" + ips[i] + ":81/",
        timeout: 30000,
      });
      camera.setState(false);

      // camera.start();
      /* camera.url="http11://" + ips[i] + ":81/";
      console.log(camera.url); */

      this.cams[i] = camera;
    }
  }

  start() {
    if (!this.aktive) {
      this.cams.forEach((cam, i) => {
        cam.setState(false);
        cam.on("data", (frame) => {
          this.io.emit("cam" + i, frame.data.toString("base64"));
          this.frames[i] = frame.data;
        });
        cam.start();
      });

      this.aktive = true;
    }
  }

  stop() {
    this.camsOff();
  }

  refresh(ips) {
    //this.camsOff();

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
