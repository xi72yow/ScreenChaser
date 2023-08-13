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
  { name: "Pause Habitutation", src: "videos/pause_habitutation.mp4" },
  { name: "Pause Evaluation Short", src: "videos/pause_evaluation_short.mp4" },
  { name: "Pause Evaluation Long", src: "videos/pause_evaluation_long.mp4" },
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

  const [playlist, setPlaylist] = React.useState(null);

  React.useEffect(() => {
    if (!playlist) {
      return;
    }

    const video = videoRef.current;
    video.src = encodeURI(playlist[0].src);

    const vidPlay = (idx, nostart) => {
      currentVideo = idx;
      videoStart = nostart ? false : true;
      video.src = encodeURI(playlist[idx]["src"]);
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
      if (currentVideo == playlist.length) {
        currentVideo = 0;
        video.pause();
        videoStart = true;
      }
      vidPlay(currentVideo, videoStart);

      const configId = playlist[currentVideo].configId;
      setConfig(configId);
    });

    setConfig(playlist[0].configId);
    vidPlay(0, true);
  }, [playlist]);

  function saveAs(blob, fileName) {
    var url = window.URL.createObjectURL(blob);
    var anchorElem = document.createElement("a");
    anchorElem.style.display = "none";

    anchorElem.href = url;
    anchorElem.download = fileName;

    document.body.appendChild(anchorElem);
    anchorElem.click();

    document.body.removeChild(anchorElem);
  }

  return (
    <div>
      <video
        style={{ width: "100%" }}
        id={"video"}
        ref={videoRef}
        className={styles.vVid}
      ></video>
      <button
        onClick={() => {
          generateTestConfig().then((data) => {
            const playlist = [];

            console.log(data);

            const pushToPlaylist = (name, src, configId) => {
              playlist.push({ name, src: encodeURI(src), configId });
            };

            function generateSplit(
              video,
              config,
              startWithReferenz,
              evaluation
            ) {
              const indikator = evaluation ? "(Evaluation)" : "(Habitutation)";
              const pauseIndexes = evaluation ? [1, 2] : [0, 0];
              if (startWithReferenz) {
                pushToPlaylist(
                  `Referenz ${video.name} ${indikator}`,
                  video.src,
                  4
                );
                pushToPlaylist(
                  "Pause " + indikator,
                  breakVideoSourceList[pauseIndexes[0]]["src"],
                  4
                );
                pushToPlaylist(
                  `Test ${video.name} ${indikator}`,
                  video.src,
                  config.id
                );
                pushToPlaylist(
                  "Pause " + indikator,
                  breakVideoSourceList[pauseIndexes[1]]["src"],
                  4
                );
              } else {
                pushToPlaylist(
                  `Test ${video.name} ${indikator}`,
                  video.src,
                  config.id
                );
                pushToPlaylist(
                  "Pause " + indikator,
                  breakVideoSourceList[pauseIndexes[0]]["src"],
                  4
                );
                pushToPlaylist(
                  `Referenz ${video.name} ${indikator}`,
                  video.src,
                  4
                );
                pushToPlaylist(
                  "Pause " + indikator,
                  breakVideoSourceList[pauseIndexes[1]]["src"],
                  4
                );
              }
            }

            for (let i = 0; i < data.length; i++) {
              const video = videoSourceList[data[i].videoIdx];
              const startWithReferenz = data[i].startWithReferenz;
              const config = configList[data[i].configIdx];

              // create Double Stimulus Continuous Quality Scale (DSCQS) playlist
              generateSplit(video, config, startWithReferenz, false);
              generateSplit(video, config, startWithReferenz, true);
            }
            console.log(playlist);

            setPlaylist(playlist);
          });
        }}
      >
        Generate Test Config
      </button>
      <button
        onClick={() => {
          const video = videoRef.current;
          if (video.paused) {
            video.play();
            video.requestFullscreen();
          } else {
            video.pause();
          }
        }}
      >
        Play
      </button>

      <button
        onClick={() => {
          if (!playlist) {
            return;
          }
          const playlistString = JSON.stringify(playlist);
          const blob = new Blob([playlistString], {
            type: "text/plain;charset=utf-8",
          });
          saveAs(blob, "playlist.json");
        }}
      >
        Download Playlist
      </button>
    </div>
  );
}
