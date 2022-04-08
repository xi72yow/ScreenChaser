const { desktopCapturer, remote } = require("electron");
const { dialog, Menu } = remote;
const neopixelCount = 120;
const DEBUG = true;


function clearIntervals() {
  if (intervals.length != 0) {
    //console.log(intervals)
    intervals.forEach(clearInterval);
    intervals = [];
  }
}
 

/**
 * shows the stripe data in the preview
 *
 * @param htmlStrip {Array} represents the light colors (hex-color formatted)
 */
function renderPreview(htmlStrip) {
  const spanLeds = document.getElementsByClassName("leds");
  for (let i = 0; i < spanLeds.length; i++) {
    const rgb = hexToRgb(htmlStrip[i]);
    const led = spanLeds[i];
    led.style.backgroundColor = `#${htmlStrip[i]}`;
  }
}

// buttons fireFlameBtn
const videoElement = document.querySelector("#video");
const frostyPikeBtn = document.querySelector("#frostyPikeBtn");
const twinkleRandomBtn = document.querySelector("#twinkleRandomBtn");
const meteorRainBtn = document.querySelector("#meteorRainBtn");
const bouncingBallsBtn = document.querySelector("#bouncingBallsBtn");
const fireFlameBtn = document.querySelector("#fireFlameBtn");
const colorWheelBtn = document.querySelector("#colorWheelBtn");
const packagelossBtn = document.querySelector("#packageloss");
const canvas = document.querySelector("#canvas");

videoElement.onclick = function () {
  clearIntervals();
  const ambiInterval = setInterval(() => {
    processCtxData();
  }, 70);
  intervals.push(ambiInterval);
};

packagelossBtn.onclick = function () {
  console.log(`sendedPacks: ${sendedPacks}`);
  console.log(`recivedPacks: ${recivedPacks}`);
  console.log(`packageloss: ${(recivedPacks / sendedPacks) * 100 - 100}%`);
};

frostyPikeBtn.onclick = function () {
  clearIntervals();
  const frostyPikeInterval = setInterval(() => {
    frostyPike(10, 10, 10, 100);
  }, 100);
  intervals.push(frostyPikeInterval);
};

twinkleRandomBtn.onclick = function () {
  const stripe = setAll(0, 0, 0);
  clearIntervals();
  const twinkleRandomInterval = setInterval(() => {
    twinkleRandom(stripe);
  }, 100);
  intervals.push(twinkleRandomInterval);
};

meteorRainBtn.onclick = function () {
  clearIntervals();
  const obj = new MeteorRain(155, 25, 200, 5, 20, true, 100);
  const meteorRainInterval = setInterval(() => {
    obj.render();
  }, 100);
  intervals.push(meteorRainInterval);
};

bouncingBallsBtn.onclick = function () {
  clearIntervals();
  const obj = new BauncingBalls(255, true, 10, 3);
  const bounceInterval = setInterval(() => {
    obj.render();
  }, 100);
  intervals.push(bounceInterval);
};

fireFlameBtn.onclick = function () {
  clearIntervals();
  const obj = new FireFlame(150, 30);
  const fireInterval = setInterval(() => {
    obj.render();
  }, 100);
  intervals.push(fireInterval);
};

colorWheelBtn.onclick = function () {
  clearIntervals();
  const obj = new ColorWheel(2);
  const colorInterval = setInterval(() => {
    obj.render();
  }, 100);
  intervals.push(colorInterval);
};

function processCtxData() {
  // set the canvas to the dimensions of the video feed
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  // make the snapshot
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  const frame = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight);
  //interresting pixels at the top and bottom

  const averagePixelHeight = (0.2 * video.videoHeight) | 0;
  const averagePixelWidth = video.videoWidth / neopixelCount;
  const importentTestPixel = averagePixelHeight * video.videoWidth;

  //console.log("Weite je neopix: " + averagePixelWidth)
  //console.log("importentTestPixel: " + importentTestPixel)

  const neopixels = new Array(neopixelCount * 4).fill(0);
  // for the top of the screen
  //for (let i = 0; i < importentTestPixel / 4; i++)
  // for the bottom of the screen
  for (
    let i = frame.data.length / 4 - importentTestPixel;
    i < frame.data.length / 4;
    i += 15
  ) {
    const currentNeoPix = ((i % video.videoWidth) / averagePixelWidth) | 0;

    const r = frame.data[i * 4 + 0];
    neopixels[currentNeoPix * 4 + 0] = neopixels[currentNeoPix * 4 + 0] + r;

    const g = frame.data[i * 4 + 1];
    neopixels[currentNeoPix * 4 + 1] = neopixels[currentNeoPix * 4 + 1] + g;

    const b = frame.data[i * 4 + 2];
    neopixels[currentNeoPix * 4 + 2] = neopixels[currentNeoPix * 4 + 2] + b;

    // pixel counter for average neopixel do not need alpha
    neopixels[currentNeoPix * 4 + 3] = neopixels[currentNeoPix * 4 + 3] + 1;
  }

  const stripe = [];

  for (let i = 0; i < neopixelCount; i++) {
    const count = neopixels[i * 4 + 3];
    stripe[i] =
      rgbToHex((neopixels[i * 4 + 0] / count) | 0) +
      rgbToHex((neopixels[i * 4 + 1] / count) | 0) +
      rgbToHex((neopixels[i * 4 + 2] / count) | 0);
  }
  showStrip(stripe);
}

const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVideoSources;

// get the available video sources
async function getVideoSources() {
  clearIntervals();
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => ({
      label: source.name,
      click: () => selectSource(source),
    }))
  );
  videoOptionsMenu.popup();
}

// change the videoSource to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // preview
  videoElement.srcObject = stream;
  videoElement.play();
}
