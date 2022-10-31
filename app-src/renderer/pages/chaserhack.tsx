import { useLiveQuery } from "dexie-react-hooks";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef } from "react";
import Chaser from "../components/boards/chaser";
import { db } from "../components/database/db";
import { rgbToHex } from "../components/effects_build/basics/convertRgbHex";
import setAll from "../components/effects_build/basics/setAll";

type Props = {};

const isProd: boolean = process.env.NODE_ENV === "production";

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          //@ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            maxWidth: 400,
          },
        },
      });
      handleStream(stream, ip);
    } catch (e) {
      handleError(e);
    }
  }

  const getColorIndicesForCoord = (x, y, width) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
  };

  function processCtxData(neoPixelCount, ip) {
    try {
      const canvas = document.getElementById("canvas" + ip);
      const video = document.getElementById("video" + ip);

      /* @ts-ignore */
      const width = video.videoWidth;
      /* @ts-ignore */
      const height = video.videoHeight;

      const scale = neoPixelCount / 400;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      // scale the canvas to the dimensions of the neopixels
      /* @ts-ignore */
      canvas.width = scaledWidth;
      /* @ts-ignore */
      canvas.height = scaledHeight;

      // if current setupt NOT matches the neopixel count, skip
      if (
        /* @ts-ignore */
        canvas.width === 0 ||
        /* @ts-ignore */
        canvas.height === 0 ||
        !canvas ||
        !video ||
        neoPixelCount === ""
      )
        return setAll(0, 0, 0, neoPixelCount);

      //clculate the stripe
      /* @ts-ignore */
      let ctx = canvas.getContext("2d");

      ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);

      let frame = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

      let stripe = [];

      for (let i = 0; i < neoPixelCount; i++) {
        const [redIndex, greenIndex, blueIndex, alphaIndex] =
          getColorIndicesForCoord(i, frame.height - 1, frame.width);
        stripe.push(
          rgbToHex(frame.data[redIndex]) +
            rgbToHex(frame.data[greenIndex]) +
            rgbToHex(frame.data[blueIndex])
        );
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
    caserIntervals.current.forEach((interval) => clearInterval(interval));

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
              hidden={isProd}
            ></canvas>
          </div>
        ))}
    </div>
  );
}

export default Next;
