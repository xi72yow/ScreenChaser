import { useLiveQuery } from "dexie-react-hooks";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef } from "react";
import { db } from "../components/database/db";
import { setAll, rgbToHex } from "screenchaser-core";

type Props = {};

const isProd: boolean = process.env.NODE_ENV === "production";

function Next() {
  const caserIntervals = useRef([]);
  const chasedRow = useRef([]);
  const lastBlackCheck = useRef(0);

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

  function processCtxData(neoPixelCount, ip, index) {
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
          getColorIndicesForCoord(
            i,
            frame.height - chasedRow.current[index],
            frame.width
          );
        stripe.push(
          rgbToHex(frame.data[redIndex]) +
            rgbToHex(frame.data[greenIndex]) +
            rgbToHex(frame.data[blueIndex])
        );
      }

      if (Date.now() - lastBlackCheck.current > 10000) {
        chasedRow.current[index] = checkBlackBar(frame, neoPixelCount);
        lastBlackCheck.current = Date.now();
      }

      return stripe;
    } catch (e) {
      handleError(e);
    }
  }

  //check for black bar at the bottom of the frame
  function checkBlackBar(frame, neopixelCount) {
    const reducedArr = [];
    //if the last row is black, return true
    for (let k = (frame.height / 4) | 0; k > 1; k--) {
      let averageColor = 0;
      for (let i = 0; i < neopixelCount; i++) {
        const [redIndex, greenIndex, blueIndex, alphaIndex] =
          getColorIndicesForCoord(i, frame.height - k, frame.width);
        averageColor =
          averageColor +
          frame.data[redIndex] +
          frame.data[greenIndex] +
          frame.data[blueIndex];
      }
      reducedArr.push((averageColor / neopixelCount) * 3);
    }

    for (let i = reducedArr.length; i > 0; i--) {
      // here not zero because somtimes there is an logo in the bottom corner
      if (reducedArr[i] > 2) {
        const row = reducedArr.length - i + 2;
        if (row < frame.height) return row;
      }
    }
    return 1;
  }

  function handleStream(stream, id: any) {
    const video: HTMLVideoElement = document.querySelector(id);
    video.srcObject = stream;
    video.onloadedmetadata = (e) => video.play();
  }

  function handleError(e) {
    console.log("🚀 ~ file: chaserhack.tsx ~ line 106 ~ handleError ~ e", e);
    caserIntervals.current.forEach((interval) => clearInterval(interval));
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

          chasedRow.current[i] = 1;
          caserIntervals.current[i] = setInterval(() => {
            const neoPixelCount =
              config.device.neoPixelCount > 9
                ? config.device.neoPixelCount
                : 10;
            const stripe = processCtxData(
              neoPixelCount,
              config.device.ip.replaceAll(".", ""),
              i
            );
            ipcRenderer.send("CHASER:SEND_STRIPE", stripe, config.device.ip);
          }, 110);
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
