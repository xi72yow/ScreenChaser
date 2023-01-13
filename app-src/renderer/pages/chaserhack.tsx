import { useLiveQuery } from "dexie-react-hooks";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef } from "react";
import { db } from "../components/database/db";
import { setAll, rgbToHex } from "screenchaser-core";
import {
  createDownScaleCore,
  downScaleImageBitmap,
} from "../components/resizer";

type Props = {};

function Next() {
  const chaserIntervals = useRef([]);
  const lastBlackCheck = useRef(0);

  async function setMediaStreamFromSource(sourceId, id) {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
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
      const video: HTMLVideoElement = document.querySelector(id);
      video.srcObject = mediaStream;
      video.onloadedmetadata = (e) => video.play();
    } catch (e) {
      handleError(e);
    }
  }

  const getColorIndicesForCoord = (x, y, width) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
  };

  //check for black bar at the bottom of the frame
  function checkBlackBar(frame, width, row) {
    const avg = frame
      .slice(
        frame.length - width * row * 4,
        frame.length - width * row * 4 + width * 4
      )
      .reduce((acc, curr) => acc + curr, 0);

    return avg / (width * 4) < 10;
  }

  function calculateStripeData(frame, width, height, row = 1) {
    const stripe = [];

    for (let i = 0; i < width; i++) {
      const [redIndex, greenIndex, blueIndex, alphaIndex] =
        getColorIndicesForCoord(i, height - row, width);
      stripe.push(
        rgbToHex(frame[redIndex]) +
          rgbToHex(frame[greenIndex]) +
          rgbToHex(frame[blueIndex])
      );
    }

    return stripe;
  }

  function handleError(e) {
    console.log("🚀 ~ file: chaserhack.tsx ~ line 106 ~ handleError ~ e", e);
    chaserIntervals.current.forEach((interval) => clearInterval(interval));
  }

  const configs = useLiveQuery(
    async () => {
      return await db.configs.toArray();
    },
    null,
    []
  );

  function startChasers() {
    chaserIntervals.current.forEach((interval) =>
      clearInterval(interval.interval)
    );

    //TODO black bar detection depands on chaser setup
    //TODO allaround chasing setup

    if (configs) {
      configs
        .filter((config) => config.task.taskCode === "chaser")
        .forEach(async (config, i) => {
          console.log(config.chaser.sourceId);

          const videoSelector = "#" + "video" + config.chaser.sourceId;

          setMediaStreamFromSource(config.chaser.sourceId, videoSelector);

          chaserIntervals.current[i] = {
            interval: null,
            downScaleCore: null,
            canvas: null,
          };

          chaserIntervals.current[i].canvas = new OffscreenCanvas(256, 256);

          chaserIntervals.current[i].downScaleCore = createDownScaleCore(
            chaserIntervals.current[i].canvas,
            config.device.neoPixelCount,
            10
          );

          chaserIntervals.current[i].interval = setInterval(async () => {
            const video = document.querySelector(
              videoSelector
            ) as HTMLVideoElement;

            if (!video) return;
            let imageBitmap = await createImageBitmap(video);

            const frame = downScaleImageBitmap(
              imageBitmap,
              config.device.neoPixelCount,
              10,
              chaserIntervals.current[i].downScaleCore
            );

            ipcRenderer.send(
              "CHASER:SEND_STRIPE",
              calculateStripeData(frame, config.device.neoPixelCount, 10, 1),
              config.device.ip
            );
          }, 100);
        });
    }
  }

  useEffect(() => {
    console.log(configs);
    startChasers();
  }, [configs]);

  return (
    <div>
      {configs
        .filter((config) => config.task.taskCode === "chaser")
        .filter((value, index, configs) => {
          return (
            configs.findIndex(
              (v) => v.chaser.sourceId === value.chaser.sourceId
            ) === index
          );
        })
        .map((config) => {
          return (
            <div key={config.device.ip + "div"}>
              <video id={"video" + config.chaser.sourceId}></video>
            </div>
          );
        })}
    </div>
  );
}

export default Next;
