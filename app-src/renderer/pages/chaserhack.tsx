import { useLiveQuery } from "dexie-react-hooks";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef } from "react";
import Chaser from "../components/boards/chaser";
import { db } from "../components/database/db";
import { rgbToHex } from "../components/effects_build/basics/convertRgbHex";
import setAll from "../components/effects_build/basics/setAll";

type Props = {};

function Next() {
  const caserIntervals = useRef([]);
  const caserErros = useRef(0);

  function deepEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (const key of keys1) {
      const val1 = object1[key];
      const val2 = object2[key];
      const areObjects = isObject(val1) && isObject(val2);
      if (
        (areObjects && !deepEqual(val1, val2)) ||
        (!areObjects && val1 !== val2)
      ) {
        return false;
      }
    }
    return true;
  }

  function isObject(object) {
    return object != null && typeof object === "object";
  }

  async function setVideoSource(sourceId, neoPixelCount, ip) {
    try {
      const width = neoPixelCount ? neoPixelCount : 100;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          //@ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            maxWidth: width,
          },
        },
      });
      handleStream(stream, ip);
    } catch (e) {
      handleError(e);
    }
  }

  function processCtxData(neoPixelCount, ip) {
    try {
      const canvas = document.getElementById("canvas" + ip);
      const video = document.getElementById("video" + ip);

      /* @ts-ignore */
      const width = video.videoWidth;
      /* @ts-ignore */
      const height = video.videoHeight;

      if (width === 0 || height === 0) return setAll(0, 0, 0, neoPixelCount);

      // set the canvas to the dimensions of the video feed
      /* @ts-ignore */
      canvas.width = width;
      /* @ts-ignore */
      canvas.height = height;

      // make the snapshot
      /* @ts-ignore */
      let ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);
      let frame = ctx.getImageData(0, 0, width, height);

      //interresting pixels at the top and bottom
      const averagePixelHeight = (0.2 * height) | 0;
      const averagePixelWidth = width / neoPixelCount;
      const importentTestPixel = averagePixelHeight * width;

      //console.log("Weite je neopix: " + averagePixelWidth)
      //console.log("importentTestPixel: " + importentTestPixel)

      const neopixels = new Array(neoPixelCount * 4).fill(0);
      // for the top of the screen
      //for (let i = 0; i < importentTestPixel / 4; i++)
      // for the bottom of the screen
      for (
        let i = frame.data.length / 4 - importentTestPixel;
        i < frame.data.length / 4;
        i = i + 15
      ) {
        let currentNeoPix = ((i % width) / averagePixelWidth) | 0;

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

      for (let i = 0; i < neoPixelCount; i++) {
        let count = neopixels[i * 4 + 3];
        stripe[i] =
          rgbToHex((neopixels[i * 4 + 0] / count) | 0) +
          rgbToHex((neopixels[i * 4 + 1] / count) | 0) +
          rgbToHex((neopixels[i * 4 + 2] / count) | 0);
      }
      return stripe;
    } catch (e) {
      handleError(e);
    }
  }

  function handleStream(stream, id: any) {
    const video: HTMLVideoElement = document.querySelector(id);
    video.srcObject = stream;
    video.onloadedmetadata = (e) => video.play();
  }

  function handleError(e) {
    console.log("🚀 ~ file: chaserhack.tsx ~ line 106 ~ handleError ~ e", e);
    caserIntervals.current.forEach((interval) => clearInterval(interval));
    setTimeout(() => {
      startCasers();
    }, caserErros.current * 100);
    caserErros.current++;
  }

  const configs = useLiveQuery(
    async () => {
      return await db.configs.toArray();
    },
    null,
    []
  );

  function startCasers() {
    if (configs) {
      configs
        .filter((config) => config.task.taskCode === "chaser")
        .forEach((config, i) => {
          console.log(config.chaser.sourceId);
          setVideoSource(
            config.chaser.sourceId,
            config.device.neoPixelCount,
            "#" + "video" + config.device.ip.replaceAll(".", "")
          );
          caserIntervals.current.push(
            setInterval(() => {
              const stripe = processCtxData(
                config.device.neoPixelCount,
                config.device.ip.replaceAll(".", "")
              );
              ipcRenderer.send("CHASER:SEND_STRIPE", stripe, config.device.ip);
            }, 110)
          );
        });
    }
  }

  useEffect(() => {
    console.log(configs);
    startCasers();
  }, [configs]);

  return (
    <div>
      {configs
        .filter((config) => config.task.taskCode === "chaser")
        .map((config) => (
          <div key={config.device.ip + "div"}>
            <video id={"video" + config.device.ip.replaceAll(".", "")}></video>
            <canvas
              id={"canvas" + config.device.ip.replaceAll(".", "")}
              width={config.device.neoPixelCount}
              hidden
            ></canvas>
          </div>
        ))}
    </div>
  );
}

export default Next;
