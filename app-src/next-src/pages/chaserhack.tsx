import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { TaskCodes, db } from "../components/database/db";
import {
  createSourceString,
  parseSourceString,
} from "../components/forms/inputs/sourcePicker";
import { BiasCore } from "screenchaser-core/dist/bias/biasCore";

/* import {
  createLedDecay,
  calculateFrame,
} from "screenchaser-core/dist/ledDecayRelease"; */

const isDev = process.env.NODE_ENV === "development";

async function setVideoSrcFromMediaStream(sourceId, id, fps) {
  try {
    const mediaStream = await (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          minFrameRate: isDev ? 30 : fps,
          maxFrameRate: isDev ? 30 : fps,
          maxWidth: 1920,
          maxHeight: 1080,
        },
      },
    });
    const video: HTMLVideoElement = document.querySelector(id);
    video.srcObject = mediaStream;
    video.onloadedmetadata = (e) => video.play();
  } catch (e) {
    throw e;
  }
}

function ChaserPair({ device, config }) {
  const { name, id } = parseSourceString(config.config.sourceId);
  const cleanedId = id.replaceAll(/[\W_]+/g, "");
  const biasCore = useRef(null as BiasCore);

  const videoRef = useRef(null as HTMLVideoElement);

  function snapshot() {
    biasCore.current?.renderSituationPreview(cleanedId);
  }

  useEffect(() => {
    const video = videoRef.current;

    /*     createLedDecay(1, 8, 1);

    const test = calculateFrame(1, new Uint8Array([125, 80, 152]));
    console.log(test); */

    if (biasCore.current) {
      biasCore.current.destroy();
    }

    setVideoSrcFromMediaStream(id, "#video" + cleanedId, config.config.fps);
    biasCore.current = new BiasCore(
      cleanedId,
      config.config.ledFields,
      (data) => {
        global.ipcRenderer.send("CHASER:SEND_STRIPE", data, device.id);
      }
    );

    if (process.env.NODE_ENV === "development")
      video.addEventListener("click", snapshot);

    return () => {
      if (biasCore.current) {
        biasCore.current.destroy();
      }

      if (process.env.NODE_ENV === "development")
        video.removeEventListener("click", snapshot);
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
