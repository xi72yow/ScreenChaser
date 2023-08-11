import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { TaskCodes, db } from "../components/database/db";
import {
  createSourceString,
  parseSourceString,
} from "../components/forms/inputs/sourcePicker";
import { BiasCore } from "screenchaser-core/dist/bias/biasCore";

import { instantiate } from "screenchaser-core/dist/ledDecayRelease";

import base64 from "screenchaser-core/dist/ledDecayRelease.wasm.js";

const isDev = process.env.NODE_ENV === "development";

let totalCalculatedFrames = 0;

let calculationStartTime = 0;

async function setVideoSrcFromMediaStream(sourceId, id, fps) {
  try {
    const mediaStream = await (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          /*minFrameRate: 80,*/
          maxWidth: 1920,
          maxHeight: 1080,
        },
      },
    });
    const video: HTMLVideoElement = document.querySelector(id);
    video.srcObject = mediaStream;
    video.onloadedmetadata = (e) => {
      video.play();
      calculationStartTime = Date.now();
    };
  } catch (e) {
    throw e;
  }
}

function base64ToArrayBuffer(base64) {
  const binaryString = globalThis.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; ++i) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function initDecay() {
  const { memory, createLedDecay, calculateFrame } = await instantiate(
    await (async () => {
      try {
        return await globalThis.WebAssembly.compile(
          base64ToArrayBuffer(base64)
        );
      } catch (e) {
        throw new Error(`Unable to compile WebAssembly module: ${e.message}`);
      }
    })(),
    undefined
  );

  return {
    createLedDecay,
    calculateFrame,
    memory,
  };
}

const { memory, createLedDecay, calculateFrame } = await initDecay();

function ChaserPair({ device, config }) {
  const { name, id } = parseSourceString(config.config.sourceId);
  const cleanedId = id.replaceAll(/[\W_]+/g, "");
  const biasCore = useRef(null as BiasCore);

  const videoRef = useRef(null as HTMLVideoElement);

  function snapshot() {
    biasCore.current?.renderSituationPreview(cleanedId);
    const time = Date.now() - calculationStartTime;
    console.log(
      `fps-setup: ${
        config.config.fps
      } - calculated frames: ${totalCalculatedFrames} - time: ${time}ms - fps: ${(
        totalCalculatedFrames /
        (time / 1000)
      ).toFixed(2)}
          `
    );
  }

  useEffect(() => {
    const video = videoRef.current;

    createLedDecay(
      config.config.ledFields.length,
      config.config.bufferdFrames,
      device.id
    );

    if (biasCore.current) {
      biasCore.current.destroy();
    }

    setVideoSrcFromMediaStream(id, "#video" + cleanedId, config.config.fps);
    biasCore.current = new BiasCore(
      cleanedId,
      config.config.ledFields,
      (data) => {
        totalCalculatedFrames++;
        const arr = calculateFrame(device.id, data);
        global.ipcRenderer.send("CHASER:SEND_STRIPE", arr, device.id);
      }
    );

    if (process.env.NODE_ENV === "development") {
      video.addEventListener("click", snapshot);
    }

    return () => {
      if (biasCore.current) {
        biasCore.current.destroy();
      }

      if (process.env.NODE_ENV === "development") {
        video.removeEventListener("click", snapshot);
      }
    };
  }, [config]);

  return (
    <div style={{ border: "1px solid black" }}>
      <video
        style={{ width: "100%" }}
        id={"video" + cleanedId}
        ref={videoRef}
      ></video>
      <canvas
        id={"canvas" + cleanedId}
        style={{ imageRendering: "pixelated", width: "100%" }}
        width={config.config.length}
        height={1}
      ></canvas>
      <canvas
        style={{ imageRendering: "pixelated", width: "100%" }}
        id={"inspection-shaft-canvas" + cleanedId}
      ></canvas>
    </div>
  );
}

type Props = {};

function Next() {
  const chaserIntervals = useRef([]);

  function handleError(e, sourceId) {
    console.error(e);
    chaserIntervals.current.forEach((interval) => clearInterval(interval));
    if (e.message === "Could not start video source" && sourceId)
      global.ipcRenderer.invoke("GET_SOURCES").then(async (sources) => {
        //if Could not start video source then try to find videosource by name
        configs.forEach(({ config, device }) => {
          const { name, id } = parseSourceString(config.config.sourceId);
          if (id === sourceId) {
            const source = sources.find((source) => source.name === name);
            if (source) {
              console.info(
                `found source by name and set config (${config.id}) to new source: ${source}`
              );
              db.configs.update(config.id, {
                config: {
                  ...config.config,
                  sourceId: createSourceString(source),
                },
              });
            } else {
              console.error(`could not find source by name: ${name}`);
              new Notification("ScreenChaser Notification", {
                body: `${
                  device.name || device.ip
                }: Could not find source by name: ${name}`,
              });
            }
          }
        });
      });
    // could not handle error
    else throw e;
  }

  const configs = useLiveQuery(
    async () => {
      const allDevices = await db.devices.toArray();
      const prepardedData = allDevices.map(async (device) => {
        return {
          device,
          config: await db.configs.get(device.configId).catch((e) => {
            return { taskCode: "nothing to do" };
          }),
        };
      });
      const devices = await Promise.all(prepardedData);
      return devices.filter(({ config }) => {
        return !!config && config?.taskCode === TaskCodes.videoChaser;
      });
    },
    null,
    []
  );

  return (
    <div>
      {/* filter configs to create one video for each uniqe source */}
      {configs
        .filter(({ config }: any, index, configs) => {
          return (
            configs.findIndex(
              (c: any) => c.config.config.sourceId === config.config.sourceId
            ) === index
          );
        })
        .map(({ device, config }) => {
          return (
            <ChaserPair
              key={device.id + "div"}
              config={config}
              device={device}
            ></ChaserPair>
          );
        })}
    </div>
  );
}

export default Next;
