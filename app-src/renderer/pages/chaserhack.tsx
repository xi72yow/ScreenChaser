import { useLiveQuery } from "dexie-react-hooks";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef } from "react";
import { db } from "../components/database/db";
import { rgbToHex } from "../components/effects_build/basics/convertRgbHex";
import {
  hsvToRgb,
  rgbToHsv,
} from "../components/effects_build/basics/convertHsvRgb";

import setAll from "../components/effects_build/basics/setAll";

type Props = {};

const isProd: boolean = process.env.NODE_ENV === "production";

function Next() {
  const chaserIntervals = useRef([]);

  const caserErros = useRef(0);

  async function setAudioSource(neoPixelCount, ip) {
    const audioCtx = new window.AudioContext();

    let audioSource = null;
    let analyser = null;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          console.log(
            `${device.kind}: ${device.label} id = ${device.deviceId}`
          );
        });
      })
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
      });

    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: "",
          maxWidth: 25,
        },
      },
    });
    console.log(
      "🚀 ~ file: chaserhack.tsx ~ line 37 ~ setAudioSource ~ audio",
      audio
    );

    audioSource = audioCtx.createMediaStreamSource(audio);

    analyser = audioCtx.createAnalyser();
    audioSource.connect(analyser);

    analyser.fftSize = getSmallestPowerofTwo(neoPixelCount);
    const bufferLength = neoPixelCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    chaserIntervals.current.push(
      setInterval(() => {
        const stripe = [];
        analyser.getByteFrequencyData(dataArray);

        dataArray.forEach((value, index) => {
          // the analytic visualizer
          const red =
            (index * value) / 10 < 255 ? ((index * value) / 10) | 0 : 255;
          const green = index * 4 < 255 ? index * 4 : 255;
          const blue = value / 4 - 12 < 0 ? 0 : (value / 4 - 12) | 0;
          const hsv = rgbToHsv({ r: red, g: green, b: blue });
          const rgb = hsvToRgb({ ...hsv, v: value / 255 });

          stripe.push(rgbToHex(rgb.r) + rgbToHex(rgb.g) + rgbToHex(rgb.b));
        });

        ipcRenderer.send("CHASER:SEND_STRIPE", stripe, ip);
      }, 110)
    );
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
    chaserIntervals.current.forEach((interval) => clearInterval(interval));
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

  function getSmallestPowerofTwo(number) {
    if (number > Math.pow(2, Math.floor(Math.log(number) / Math.log(2))))
      return Math.pow(2, Math.floor(Math.log(number) / Math.log(2)) + 1);
    else return Math.pow(2, Math.floor(Math.log(number) / Math.log(2)));
  }

  function startCasers() {
    chaserIntervals.current.forEach((interval) => clearInterval(interval));

    if (configs) {
      configs
        .filter((config) => config.task.taskCode === "chaser")
        .forEach((config, i) => {
          if (config.chaser.sourceId === "default") {
            setAudioSource(config.device.neoPixelCount, config.device.ip);
          } else {
            setVideoSource(
              config.chaser.sourceId,
              config.device.neoPixelCount,
              "#" + "video" + config.device.ip.replaceAll(".", "")
            );
            chaserIntervals.current.push(
              setInterval(() => {
                const stripe = processCtxData(
                  config.device.neoPixelCount,
                  config.device.ip.replaceAll(".", "")
                );
                ipcRenderer.send(
                  "CHASER:SEND_STRIPE",
                  stripe,
                  config.device.ip
                );
              }, 110)
            );
          }
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
        .filter(
          (config) =>
            config.task.taskCode === "chaser" &&
            config.chaser.sourceId !== "default"
        )
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
