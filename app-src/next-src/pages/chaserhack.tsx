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

const streamMap = new Map();

async function startChaser(config, device, streamMap) {
  const { name, id } = parseSourceString(config.config.sourceId);
  const ip = device.ip;

  if (streamMap.has(device.id)) {
    console.log("stop stream");
    streamMap
      .get(device.id)
      .getTracks()
      .forEach((track) => track.stop());
    streamMap.delete(device.id);
  }

  try {
    const mediaStream = await (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: id,
          maxFrameRate: config.config.fps,
          maxWidth: 1920,
          maxHeight: 1080,
        },
      },
    });
    const videoTrack = mediaStream.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();

    const frameProcessor = new BiasCore(
      device.id,
      config.config.ledFields,
      width,
      height
    );

    createLedDecay(
      config.config.ledFields.length,
      config.config.bufferdFrames,
      device.id
    );

    //@ts-expect-error
    const trackProcessor = new MediaStreamTrackProcessor({
      track: videoTrack,
    });

    const transformer = new TransformStream({
      async transform(videoFrame, controller) {
        const pixels = frameProcessor.processVideoFrame(videoFrame);
        videoFrame.close();
        controller.enqueue(pixels);
      },
    });

    trackProcessor.readable.pipeThrough(transformer).pipeTo(
      new WritableStream({
        write(chunk) {
          const arr = calculateFrame(device.id, chunk);
          global.ipcRenderer.send("CHASER:SEND_STRIPE", arr, device.id);
        },
      })
    );

    streamMap.set(device.id, mediaStream);
  } catch (e) {
    throw e;
  }
}

function handleError(e, sourceId, configs) {
  console.error(e);
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

function Next() {
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

  useEffect(() => {
    if (configs) {
      configs.forEach(({ config, device }) => {
        startChaser(config, device, streamMap);
      });
    }
  }, [configs]);

  return (
    <div>
      <h1>Chasing window for Debug</h1>
    </div>
  );
}

export default Next;
