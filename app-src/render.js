const { desktopCapturer, remote } = require("electron");
const { dialog, Menu } = remote;
const neopixelCount = 120;

var width = window.innerWidth;
var height = window.innerHeight;

var stage = new Konva.Stage({
  container: "container",
  width: width,
  height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

var tooltip = new Konva.Text({
  text: "",
  fontFamily: "Calibri",
  fontSize: 12,
  padding: 5,
  textFill: "white",
  fill: "black",
  alpha: 0.75,
  visible: false,
});

var tooltipLayer = new Konva.Layer();
tooltipLayer.add(tooltip);
stage.add(tooltipLayer);

var stripesLayer = new Konva.Layer();
stage.add(stripesLayer);

var video = document.createElement("video");

const stripe = {
  group: null,
  leds: [],
  isForAmbient: false,
  connetedTo: "",
  espIsConnected: false,
  stripeToExpand: null,
  breakPoint: [],
};

const previewWidth = 800;
const previewHeight = 450;

//sum of array
function sum(array) {
  return array.reduce((a, b) => a + b, 0);
}
/**
 *
 * @param {pos} start
 * @param {Array(boolean)} layout [untern rechts oben links] betrachtung vorm screen
 */
function posAmbi(start, layout, pixelCount) {
  stripe.group = dragGroup = new Konva.Group({
    draggable: true,
  });

  dragGroup.on("mouseover", function () {
    document.body.style.cursor = "pointer";
  });
  dragGroup.on("mouseout", function () {
    document.body.style.cursor = "default";
  });

  layout = layout.map((e, i) =>
    e ? (i % 2 === 0 ? previewWidth : previewHeight) : 0
  );

  const spaceAroundScreen = sum(layout) * 1.1;
  const spaceForPixel = spaceAroundScreen / pixelCount;
  const pixelMargin = spaceForPixel * 0.2;
  const pixelSize = spaceForPixel - pixelMargin;

  var espRect = new Konva.Rect({
    x: start.x - spaceForPixel * 3.2,
    y: start.y,
    width: pixelSize * 2,
    height: pixelSize,
    fill: "red",
    stroke: "black",
    strokeWidth: 1,
    opacity: 0.7,
  });

  espRect.on("mousemove", function () {
    var mousePos = stage.getPointerPosition();
    tooltip.position({
      x: mousePos.x + 15,
      y: mousePos.y + 15,
    });
    tooltip.text(`${stripe.connetedTo} is ${stripe.espIsConnected} connected`);
    tooltip.show();
  });

  espRect.on("mouseout", function () {
    tooltip.hide();
  });

  dragGroup.add(espRect);

  for (let i = 0; i < pixelCount; i++) {
    var rect = new Konva.Rect({
      x: start.x + i * spaceForPixel,
      y: start.y,
      width: pixelSize,
      height: pixelSize,
      fill: "gray",
      stroke: "black",
      strokeWidth: 1,
      opacity: 0.7,
    });

    let click = 0;

    rect.on("mousemove", function () {
      var mousePos = stage.getPointerPosition();
      tooltip.position({
        x: mousePos.x + 15,
        y: mousePos.y + 15,
      });
      tooltip.text(`LED number: ${i + 1}`);
      tooltip.show();
    });

    rect.on("mouseout", function () {
      tooltip.hide();
    });

    rect.on("click", function () {
      click++;
      for (let index = i + 1; index < stripe.leds.length; index++) {
        const lastLed = stripe.leds[i];
        const led = stripe.leds[index];

        switch (click % 4) {
          case 0:
            led.position({
              x: lastLed.x(),
              y: lastLed.y() - index * spaceForPixel + i * spaceForPixel, //top
            });
            break;
          case 1:
            led.position({
              x: lastLed.x() + index * spaceForPixel - i * spaceForPixel, //right
              y: lastLed.y(),
            });
            break;

          case 2:
            led.position({
              x: lastLed.x(),
              y: lastLed.y() + index * spaceForPixel - i * spaceForPixel, //down
            });
            break;

          case 3:
            led.position({
              x: lastLed.x() - index * spaceForPixel + i * spaceForPixel, //left
              y: lastLed.y(),
            });
            break;

          default:
            break;
        }
      }
    });

    dragGroup.add(rect);
    stripe.leds.push(rect);
    stripesLayer.add(dragGroup);
  }
}

posAmbi({ x: 100, y: 900 }, [true, true, true, true], 120);

var image = new Konva.Image({
  image: video,
  draggable: true,
  x: (stage.width() - previewWidth) / 2,
  y: 69,
  width: previewWidth,
  height: previewHeight,
  stroke: "black",
  strokeWidth: 15,
  lineCap: "round",
  lineJoin: "round",
  fill: "#222222",
});
layer.add(image);

var text = new Konva.Text({
  text: "Loading video...",
  width: stage.width(),
  height: stage.height(),
  align: "center",
  verticalAlign: "middle",
});
layer.add(text);

var anim = new Konva.Animation(function () {
  // do nothing, animation just need to update the layer
}, layer);

// update Konva.Image size when meta is loaded
video.addEventListener("loadedmetadata", function (e) {
  text.text("Press PLAY...");
});

const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVideoSources;

// get the available video sources
async function getVideoSources() {
  //clearIntervals();
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

  // preview the video
  video.srcObject = stream;
  video.play();
  anim.start();

  /* video.pause();
  anim.stop(); */
}

/* videoElement.onclick = function () {
  clearIntervals();
  const ambiInterval = setInterval(() => {
    processCtxData();
  }, 70);
  intervals.push(ambiInterval);
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
} */
