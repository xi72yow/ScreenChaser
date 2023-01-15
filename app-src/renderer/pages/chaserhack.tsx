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

  async function setVideoSrcFromMediaStream(sourceId, id) {
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

  //check for black bar at specific row
  function checkBlackBarRow(frame, width, row) {
    const avg = frame
      .slice(
        frame.length - width * (row + 1) * 4,
        frame.length - width * row * 4
      )
      .reduce((acc, curr) => acc + curr, 0);
    //i have to subsract 255 because of the alpha channel
    return (avg - 255 * width) / (width * 4) < 10;
  }

  //check for black bar at specific col
  function checkBlackBarCol(frame, width, col) {
    let avg = 0;
    const height = frame.length / (width * 4);
    for (let i = col * 4; i < frame.length; i += 4 * width) {
      avg += frame[i] + frame[i + 1] + frame[i + 2];
    }
    return (avg / height) * 3 < 10;
  }

  function calculateStripeData(frame, width, height, setup) {
    const { rowB, colR, rowT, colL } = setup;

    function isSet(set) {
      return set > -1;
    }
    // 0=>left, 1=>right, 2=>top, 3=>bottom
    const stripe = [[], [], [], []];
    function pushToStripe(x, y, i) {
      const [redIndex, greenIndex, blueIndex, alphaIndex] =
        getColorIndicesForCoord(x, y, width);

      stripe[i].push(
        rgbToHex(frame[redIndex]) +
          rgbToHex(frame[greenIndex]) +
          rgbToHex(frame[blueIndex])
      );
    }

    if (isSet(colL) || isSet(colR))
      for (let i = 0; i < height; i++) {
        if (isSet(colL)) {
          pushToStripe(colL, i, 0);
        }
        if (isSet(colR)) {
          pushToStripe(width - colR - 1, i, 1);
        }
      }

    if (isSet(rowT) || isSet(rowB))
      for (let i = 0; i < width; i++) {
        if (isSet(rowT)) {
          pushToStripe(i, rowT, 2);
        }
        if (isSet(rowB)) {
          pushToStripe(i, height - rowB - 1, 3);
        }
      }

    // col stripeData starts at the top, row stripeData starts at the left
    return stripe;
  }

  function adjustStripeDataForSetup(
    stripeData,
    startLed = 0,
    clockWise = false
  ) {
    // 0=>left, 1=>right, 2=>top, 3=>bottom
    const clockWiseRotStripeData = [...stripeData];

    let stripeDataAround = [];

    if (!clockWise) {
      clockWiseRotStripeData[0] = stripeData[0].reverse();
      clockWiseRotStripeData[2] = stripeData[1].reverse();
    } else {
      clockWiseRotStripeData[1] = stripeData[2].reverse();
      clockWiseRotStripeData[3] = stripeData[3].reverse();
    }

    stripeDataAround = [
      ...clockWiseRotStripeData[3],
      ...clockWiseRotStripeData[1],
      ...clockWiseRotStripeData[2],
      ...clockWiseRotStripeData[0],
    ];

    if (clockWise) stripeDataAround = stripeDataAround.reverse();

    return [
      ...stripeDataAround.slice(startLed, stripeDataAround.length),
      ...stripeDataAround.slice(0, startLed),
    ];
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

    if (configs) {
      configs
        .filter((config) => config.task.taskCode === "chaser")
        .forEach(async (config, i) => {
          console.log(config.chaser.sourceId);

          const videoSelector =
            "#" + "video" + config.chaser.sourceId.replaceAll(/[\W_]+/g, "");

          setVideoSrcFromMediaStream(config.chaser.sourceId, videoSelector);

          chaserIntervals.current[i] = {
            interval: null,
            downScaleCore: null,
            canvas: null,
            setUp: null,
            lastBarDetection: null,
          };

          chaserIntervals.current[i].canvas = new OffscreenCanvas(256, 256);

          // this is for black bar detection, if there is only one black bar, i can detect, but i cant repair it xD
          // in nano setups there is maybe a problem, we will see
          const width = config.chaser.width < 10 ? 10 : config.chaser.width;
          const height = config.chaser.height < 10 ? 10 : config.chaser.height;

          chaserIntervals.current[i].downScaleCore = createDownScaleCore(
            chaserIntervals.current[i].canvas,
            width,
            height
          );

          chaserIntervals.current[i].setUp = { ...config.chaser.setUp };

          chaserIntervals.current[i].interval = setInterval(async () => {
            const video = document.querySelector(
              videoSelector
            ) as HTMLVideoElement;

            if (!video && video.width === 0) return;
            let imageBitmap = await createImageBitmap(video);

            const frame = downScaleImageBitmap(
              imageBitmap,
              width,
              height,
              chaserIntervals.current[i].downScaleCore
            );

            const blackL = checkBlackBarCol(frame, width, 0);
            const blackR = checkBlackBarCol(frame, width, width - 1);

            const blackT = checkBlackBarRow(frame, width, 0);
            const blackB = checkBlackBarRow(frame, width, height - 1);

            const stripeData = calculateStripeData(
              frame,
              width,
              height,
              chaserIntervals.current[i].setUp
            );

            const adjustedStripeData = adjustStripeDataForSetup(
              stripeData,
              config.chaser.startLed,
              config.chaser.clockWise
            );

            ipcRenderer.send(
              "CHASER:SEND_STRIPE",
              adjustedStripeData,
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
      {/* filter configs for running chasers and create one video for each uniqe source */}
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
              <video
                id={"video" + config.chaser.sourceId.replaceAll(/[\W_]+/g, "")}
              ></video>
            </div>
          );
        })}
    </div>
  );
}

export default Next;
