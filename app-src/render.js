const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const MIN_DELAY = 90;
const neopixelCount = 120;
const DEBUG = true;
const IPADDR = "192.168.2.113";
let intervals = [];
let lastChunk = [];
let sendedPacks = 0;
let recivedPacks = 0;

function clearIntervals() {
  if (intervals.length != 0) {
    //console.log(intervals)
    intervals.forEach(clearInterval);
    intervals = [];
  }
}

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});
server.on('message', (msg, senderInfo) => {
  if (DEBUG) {
    if (recivedPacks == 0) {
      console.log(`Messages received ${msg}`);
    }
    recivedPacks++;
  }
  /*server.send(msg,senderInfo.port,senderInfo.address,()=>{
  console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`)
  })*/
});
server.on('listening', () => {
  const address = server.address();
  console.log(`server listening on ${address.address}:${address.port}`);
});


/**
 * returns an array with arrays of the given size
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 * @return {Array} contains all chunks
 */
function chunkArray(myArray, chunk_size) {
  let index = 0;
  let tempArray = [];

  for (index = 0; index < myArray.length; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }
  return tempArray;
}

/**
 * returns an 2 digit hex 
 *
 * @param rgb {Byte} 8Bit color number
 * @return {String} converted Hex String
 */
function rgbToHex(rgb) {
  let hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = `0${hex}`;
  }
  return hex;
};

/**
 * js analogous to microcontroller delay
 *
 * @param ms {Integer} time to wait
 */
function delay(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

/**
 * js analogous to microcontroller random
 *
 * @param max {Integer} max random number
 * @return {Interger} num between 0 and max
 */
function random(max) {
  return Math.random() * max | 0;
}

/**
 * send the stripe data to esp
 *
 * @param pixelArray {Array} represents the light colors (rgb-color formatted)
 * @return {Array} light colors (hex-color formatted)
 */
function showNeoStrip(pixelArray) {
  let hexColorStrip = [];
  let pixelUDPframe = "";
  for (let i = 0; i < pixelArray.length; i++) {
    let rgb = pixelArray[i];
    pixelUDPframe += rgb;
    hexColorStrip[i] = rgb;
  }
  //send Data to ESP esp rx max size is 256
  const sendingFrames = chunkArray(pixelUDPframe, 252); //252/6=42LED
  sendingFrames.forEach((frames, i) => {
    if (lastChunk[i] === frames) {
      return;
    }
    if (DEBUG) {
      sendedPacks++;
    }
    server.send(i.toString(16) + frames, 4210, IPADDR);
  });
  lastChunk = sendingFrames;
  return hexColorStrip;
}

/**
 * shows the stripe data in the preview
 *
 * @param htmlStrip {Array} represents the light colors (hex-color formatted)
 */
function renderPreview(htmlStrip) {
  let spanLeds = document.getElementsByClassName("leds");
  for (let i = 0; i < spanLeds.length; i++) {
    let led = spanLeds[i];
    led.style.backgroundColor = `#${htmlStrip[i]}`;
  }
}

/**
 * send the stripe data to esp and shows the stripe data in the preview
 *
 * @param stripe {Array} represents the light colors (rgb-color formatted)
 */
function showStrip(stripe) {
  let htmlStrip = showNeoStrip(stripe);
  stripeReferenz = htmlStrip;
  renderPreview(htmlStrip);
}

function setAll(r, g, b) {
  stripe = [];
  for (let index = 0; index < neopixelCount; index++) {
    stripe[index] = rgbToHex(r) + rgbToHex(g) + rgbToHex(b);
  }
  return stripe;
}

/**
 * set one neopixel of the stripe 
 *
 * @param r {Byte} 8Bit color
 * @param g {Byte} 8Bit color
 * @param b {Byte} 8Bit color
 * @param pixel {Integer} pix index to modify
 * @param stripe {Array} the current stripe
 * @return {Array} modified stripe
 */
function setPixel(pixel, stripe, r, g, b) {
  let hexValue = rgbToHex(r) + rgbToHex(g) + rgbToHex(b);
  stripe[pixel] = hexValue
  return stripe;
}

/**
 * js analogous to microcontroller millis
 *
 * @return {Interger} millis
 */
function millis() {
  return Date.now()/3;
}

class BauncingBalls {
  constructor(red, green, blue, BallCount) {
    this.ballCount = BallCount;
    this.stripe = setAll(0, 0, 0);
    this.gravity = -9.81;
    this.startHeight = 1;
    this.impactVelocityStart = Math.sqrt(-2 * this.gravity * this.startHeight);
    this.height = new Array(BallCount);
    this.impactVelocity = new Array(BallCount);
    this.timeSinceLastBounce = new Array(BallCount);
    this.clockTimeSinceLastBounce = new Array(BallCount);
    this.dampening = new Array(BallCount);
    this.position = new Array(BallCount);

    for (let i = 0; i < BallCount; i++) {
      this.clockTimeSinceLastBounce[i] = millis();
      this.height[i] = this.StartHeight;
      this.position[i] = 0;
      this.impactVelocity[i] = this.impactVelocityStart;
      this.timeSinceLastBounce[i] = 0;
      this.dampening[i] = 0.90 - i / BallCount ** 2;
    }
  }

  render() {
    for (let i = 0; i < this.ballCount; i++) {
      this.timeSinceLastBounce[i] = millis() - this.clockTimeSinceLastBounce[i];
      this.height[i] = 0.5 * this.gravity * Math.pow(this.timeSinceLastBounce[i] / 1000, 2.0) + this.impactVelocity[i] * this.timeSinceLastBounce[i] / 1000;

      if (this.height[i] < 0) {
        this.height[i] = 0;
        this.impactVelocity[i] = this.dampening[i] * this.impactVelocity[i];
        this.clockTimeSinceLastBounce[i] = millis();

        if (this.impactVelocity[i] < 0.01) {
          this.impactVelocity[i] = this.impactVelocityStart;
        }
      }
      this.position[i] = Math.round(this.height[i] * (neopixelCount - 1) / this.startHeight);
    }

    for (let i = 0; i < this.ballCount; i++) {
      this.stripe = setPixel(this.position[i], this.stripe, random(255), random(255), random(255));
    }

    showStrip(this.stripe);
    this.stripe = setAll(0, 0, 0);
  }

  getStripe() {
    return this.stripe;
  }
  getGravity() {
    return this.gravity;
  }
  getStartHeight() {
    return this.startHeight;
  }
  getImpactVelocityStart() {
    return this.impactVelocityStart;
  }
}
/*void BouncingBalls(byte red, byte green, byte blue, int BallCount) {
  float Gravity = -9.81;
  int StartHeight = 1;
 
  float Height[BallCount];
  float ImpactVelocityStart = sqrt( -2 * Gravity * StartHeight );
  float ImpactVelocity[BallCount];
  float TimeSinceLastBounce[BallCount];
  int   Position[BallCount];
  long  ClockTimeSinceLastBounce[BallCount];
  float Dampening[BallCount];
 
  for (int i = 0 ; i < BallCount ; i++) {  
    ClockTimeSinceLastBounce[i] = millis();
    Height[i] = StartHeight;
    Position[i] = 0;
    ImpactVelocity[i] = ImpactVelocityStart;
    TimeSinceLastBounce[i] = 0;
    Dampening[i] = 0.90 - float(i)/pow(BallCount,2);
  }

  while (true) {
    for (int i = 0 ; i < BallCount ; i++) {
      TimeSinceLastBounce[i] =  millis() - ClockTimeSinceLastBounce[i];
      Height[i] = 0.5 * Gravity * pow( TimeSinceLastBounce[i]/1000 , 2.0 ) + ImpactVelocity[i] * TimeSinceLastBounce[i]/1000;
 
      if ( Height[i] < 0 ) {                      
        Height[i] = 0;
        ImpactVelocity[i] = Dampening[i] * ImpactVelocity[i];
        ClockTimeSinceLastBounce[i] = millis();
 
        if ( ImpactVelocity[i] < 0.01 ) {
          ImpactVelocity[i] = ImpactVelocityStart;
        }
      }
      Position[i] = round( Height[i] * (NUM_LEDS - 1) / StartHeight);
    }
 
    for (int i = 0 ; i < BallCount ; i++) {
      setPixel(Position[i],red,green,blue);
    }
   
    showStrip();
    setAll(0,0,0);
  }
} */

async function bouncingBalls() {
  let stripe = setAll(0, 0, 0);
  for (let i = 0; i < neopixelCount; i++) {
    stripe = setPixel(i, stripe, 255, 0, 0);
    await delay(50)
    showStrip(stripe);
  }
}

/**
 * creates the neopixel fadeIn effect for the whole string (is shit in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 */
async function fadeIn(red, green, blue) {
  let r, g, b;
  for (let k = 0; k < 256; k += 5) {
    r = (k / 256) * red | 0;
    g = (k / 256) * green | 0;
    b = (k / 256) * blue | 0;
    await delay(MIN_DELAY);
    let stripe = setAll(r, g, b);
    showStrip(stripe);
  }
}

/**
 * creates the neopixel fadeOut effect for the whole string (is shit in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 */
async function fadeOut(red, green, blue) {
  let r, g, b;
  for (let k = 255; k >= 0; k -= 5) {
    r = (k / 256) * red | 0;
    g = (k / 256) * green | 0;
    b = (k / 256) * blue | 0;
    await delay(MIN_DELAY);
    let stripe = setAll(r, g, b);
    showStrip(stripe);
  }
}

/**
 * creates the neopixel ColorWipe effect (looks nice in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 * @param speedDelay {Integer} time between popup pixels
 */
async function colorWipe(red, green, blue, speedDelay) {
  speedDelay = speedDelay < MIN_DELAY ? MIN_DELAY : speedDelay;
  let stripe = setAll(0, 0, 0);
  for (let i = 0; i < neopixelCount; i++) {
    stripe = setPixel(i, stripe, red, green, blue);
    await delay(speedDelay);
    showStrip(stripe);
  }
}

/**
 * creates the neopixel SnowSparkle effect (looks nice in my case)
 *
 * @param red {Byte} 8Bit color
 * @param green {Byte} 8Bit color
 * @param blue {Byte} 8Bit color
 * @param sparkleDelay {Integer} lifetime of pixel blink
 * @param speedDelay {Integer} time between blinkings
 */
async function frostyPike(red, green, blue, sparkleDelay) {
  sparkleDelay = sparkleDelay < MIN_DELAY ? MIN_DELAY : sparkleDelay;
  let stripe = setAll(red, green, blue);
  let pixel = random(neopixelCount);
  stripe = setPixel(pixel, stripe, 255, 255, 255);
  showStrip(stripe);
  await delay(sparkleDelay);
  stripe = setPixel(pixel, stripe, red, green, blue);
  showStrip(stripe);
}

/**
 * creates the neopixel TwinkleRandom effect (looks nice in my case)
 *
 * @param count {Integer} number of twinkles
 * @param speedDelay {Integer} time between blinkings
 */
async function twinkleRandom(stripe) {
  stripe = setPixel(random(neopixelCount), stripe, random(255), random(255), random(255));
  showStrip(stripe);
}

function fadeToBlack(pixel, stripe, fadeValue) {
  oldColor = stripe[pixel];
  let r = parseInt(oldColor.slice(0, 2), 16);
  let g = parseInt(oldColor.slice(2, 4), 16);
  let b = parseInt(oldColor.slice(4, 6), 16);
  r = (r <= 10) ? 0 : (r - fadeValue);
  g = (g <= 10) ? 0 : (g - fadeValue);
  b = (b <= 10) ? 0 : (b - fadeValue);
  stripe = setPixel(pixel, stripe, r, g, b);
  return stripe;
}

async function meteorRain(red, green, blue, meteorSize, meteorTrailDecay, meteorRandomDecay, speedDelay) {
  speedDelay = speedDelay < MIN_DELAY ? MIN_DELAY : speedDelay;
  let stripe = setAll(0, 0, 0);
  for (let i = 0; i < neopixelCount * 2; i++) {
    // fade brightness all LEDs one step
    for (let j = 0; j < neopixelCount; j++) {
      if ((!meteorRandomDecay) || (random(10) > 5)) {
        stripe = fadeToBlack(j, stripe, meteorTrailDecay);
      }
    }
    // draw meteor
    for (let j = 0; j < meteorSize; j++) {
      if ((i - j < neopixelCount) && (i - j >= 0)) {
        stripe = setPixel(i - j, stripe, red, green, blue);
      }
    }
    showStrip(stripe);
    await delay(speedDelay);
  }
  return 1;
}


function createExampleStripe(params) {
  let stripe = setAll(175, 0, 105);

  for (let index = 0; index < neopixelCount / 2; index++) {
    setPixel(index, stripe, 255, 187, 0);
  }
  showStrip(stripe);
}

//showStrip(setAll(255, 222, 55));
//frostyPike(10, 10, 10, 100, 100)
//colorWipe(255, 255, 0, 100)
//twinkleRandom(50, 100)
//meteorRain(155, 25, 200, 5, 20, true, 100)
//fadeIn(255, 255, 0, 100)
//fadeOut(255, 255, 0, 100)
//showStrip(setPixel(0, createExampleStripe(), 255, 255, 255))
//let bouncingBallsInterval = setInterval(() => {
//  bouncingBalls(255, 0, 0, 3)
//}, 200);
//intervals.push(bouncingBallsInterval);
setTimeout(() => {
  let obj = new BauncingBalls(255, 0, 0, 3);
  console.log(obj)
  obj.render();
  let bounceInterval = setInterval(() => {
    obj.render();

  }, 100);
  intervals.push(bounceInterval);
  //bouncingBalls()
}, 1000);
// buttons
const videoElement = document.querySelector('#video');
const frostyPikeBtn = document.querySelector('#frostyPikeBtn');
const twinkleRandomBtn = document.querySelector('#twinkleRandomBtn');
const meteorRainBtn = document.querySelector('#meteorRainBtn');
const packagelossBtn = document.querySelector('#packageloss');
const canvas = document.querySelector('#canvas');

videoElement.onclick = function () {
  clearIntervals()
  let ambiInterval = setInterval(() => {
    processCtxData();
  }, 100);
  intervals.push(ambiInterval);
};

packagelossBtn.onclick = function () {
  console.log(`sendedPacks: ${sendedPacks}`);
  console.log(`recivedPacks: ${recivedPacks}`);
  console.log(`packageloss: ${(recivedPacks / sendedPacks * 100) - 100}%`);
};

frostyPikeBtn.onclick = function () {
  clearIntervals();
  let frostyPikeInterval = setInterval(() => {
    frostyPike(10, 10, 10, 100);
  }, 100);
  intervals.push(frostyPikeInterval);
};

twinkleRandomBtn.onclick = function () {
  let stripe = setAll(0, 0, 0);
  clearIntervals();
  let twinkleRandomInterval = setInterval(() => {
    twinkleRandom(stripe)
  }, 100);
  intervals.push(twinkleRandomInterval);
};

meteorRainBtn.onclick = function () {
  clearIntervals();
  let meteorRainInterval = setInterval(() => {
    meteorRain(155, 25, 200, 5, 20, true, 100);
  }, 40_000);
  intervals.push(meteorRainInterval);
};

function processCtxData() {
  // set the canvas to the dimensions of the video feed 
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  // make the snapshot
  let ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  let frame = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight);
  //interresting pixels at the top and bottom

  const averagePixelHeight = (0.20 * video.videoHeight) | 0;
  const averagePixelWidth = video.videoWidth / neopixelCount;
  const importentTestPixel = averagePixelHeight * video.videoWidth;

  //console.log("Weite je neopix: " + averagePixelWidth)
  //console.log("importentTestPixel: " + importentTestPixel)

  const neopixels = new Array(neopixelCount * 4).fill(0);
  // for the top of the screen
  //for (let i = 0; i < importentTestPixel / 4; i++) 
  // for the bottom of the screen
  for (let i = frame.data.length / 4 - importentTestPixel; i < frame.data.length / 4; i += 15) {
    let currentNeoPix = ((i % video.videoWidth) / averagePixelWidth) | 0;

    let r = frame.data[i * 4 + 0];
    neopixels[currentNeoPix * 4 + 0] = neopixels[currentNeoPix * 4 + 0] + r;

    let g = frame.data[i * 4 + 1];
    neopixels[currentNeoPix * 4 + 1] = neopixels[currentNeoPix * 4 + 1] + g;

    let b = frame.data[i * 4 + 2];
    neopixels[currentNeoPix * 4 + 2] = neopixels[currentNeoPix * 4 + 2] + b;

    // pixel counter for average neopixel do not need alpha
    neopixels[currentNeoPix * 4 + 3] = neopixels[currentNeoPix * 4 + 3] + 1;
  }

  let stripe = [];

  for (let i = 0; i < neopixelCount; i++) {
    let count = neopixels[i * 4 + 3];
    stripe[i] = rgbToHex(neopixels[i * 4 + 0] / count | 0) + rgbToHex(neopixels[i * 4 + 1] / count | 0) + rgbToHex(neopixels[i * 4 + 2] / count | 0);
  }
  showStrip(stripe);
}

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// get the available video sources
async function getVideoSources() {
  clearIntervals()
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => ({
      label: source.name,
      click: () => selectSource(source)
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
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // preview
  videoElement.srcObject = stream;
  videoElement.play();
}
