import React from "react";

import styles from "../components/css/subjectTestCss.module.css";

import { apiKey } from "../components/apiKey";
import { db } from "../components/database/db";

type Props = {};

let currentVideo = 0;

let videoStart = false;

const requestOrder = {
  jsonrpc: "2.0",
  method: "generateIntegers",
  params: {
    apiKey,
    n: 9, // Number of integers to generate
    min: 0, // Lower bound (inclusive)
    max: 8, // Upper bound (inclusive)
    replacement: false, // Without replacement (no duplicates)
  },
  id: 1,
};

const requestStartWithReferenz = {
  jsonrpc: "2.0",
  method: "generateIntegers",
  params: {
    apiKey,
    n: 9, // Number of integers to generate
    min: 0, // Lower bound (inclusive)
    max: 1, // Upper bound (inclusive)
    replacement: true, // With replacement (duplicates possible)
  },
  id: 1,
};

const videoSourceList = [
  { name: "Action Clip", src: "videos/1.mp4" },
  { name: "Landscape Fly", src: "videos/2.mp4" },
  { name: "Another Clip", src: "videos/3.mp4" },
];

const breakVideoSourceList = [
  { name: "Pause Habitutation", src: "videos/pause_evaluation.mp4" },
  { name: "Pause Evaluation", src: "videos/pause_evaluation.mp4" },
];

const configList = [
  { name: "One Pixel", id: 1 },
  { name: "Rectangular Average", id: 2 },
  { name: "Average with Decay", id: 3 },
  { name: "disabled", id: 4 },
];

async function generateTestConfig() {
  const testOrderData = await fetch(
    "https://api.random.org/json-rpc/4/invoke",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestOrder),
    }
  ).then((response) => response.json());

  const testStartWithReferenzData = await fetch(
    "https://api.random.org/json-rpc/4/invoke",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestStartWithReferenz),
    }
  ).then((response) => response.json());

  const testOrder = testOrderData.result.random.data;
  const testStartWithReferenz = testStartWithReferenzData.result.random.data;

  return testOrder.map((num, index, array) => {
    const videoIdx = Math.floor(num / 3);
    const configIdx = num % 3;
    const startWithReferenz = testStartWithReferenz[index] === 1;
    return {
      videoIdx,
      configIdx,
      startWithReferenz,
    };
  });
}

export default function SubjectTest({}: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [testConfig, setTestConfig] = React.useState(null);

  React.useEffect(() => {
    if (!testConfig) {
      return;
      /* generateTestConfig().then((data) => {
        setTestConfig(data);
      }); */
    }

    const video = videoRef.current;
    video.src = encodeURI(videoSourceList[testConfig[0].videoIdx]["src"]);

    const vidPlay = (idx, nostart) => {
      currentVideo = idx;
      videoStart = nostart ? false : true;
      video.src = encodeURI(videoSourceList[idx]["src"]);
    };

    const setConfig = (idx) => {
      db.devices.where("id").equals(1).modify({ configId: idx });
    };

    video.addEventListener("canplay", () => {
      if (videoStart) {
        video.play();
        videoStart = false;
      }
    });

    video.addEventListener("ended", () => {
      currentVideo++;
      if (currentVideo == videoSourceList.length) {
        currentVideo = 0;
        video.pause();
        videoStart = true;
      }
      vidPlay(currentVideo, videoStart);
    });

    vidPlay(0, true);

    video.addEventListener("click", () => {
      if (video.paused) {
        video.play();
        video.requestFullscreen();
      } else {
        video.pause();
      }
    });
  }, [testConfig]);

  return (
    <div>
      <video id="vVid" className={styles.vVid} ref={videoRef}></video>
      <button
        onClick={() => {
          generateTestConfig().then((data) => {
            console.log(data);
            for (let i = 0; i < data.length; i++) {
              const video = videoSourceList[data[i].videoIdx];
              const config = configList[data[i].configIdx];
              const startWithReferenz = data[i].startWithReferenz;
              console.log(
                `Video: ${video.name}, Config: ${config.name}, StartWithReferenz: ${startWithReferenz}`
              );
            }
          });
        }}
      >
        Generate Test Config
      </button>
    </div>
  );
}
