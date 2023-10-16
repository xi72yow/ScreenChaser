import React from "react";

import styles from "../components/css/subjectTestCss.module.css";

import { apiKey } from "../components/apiKey";
import { db } from "../components/database/db";

import PocketBase from "pocketbase";

const pb = new PocketBase("");

pb.collection("users").authWithPassword("", "");

type Props = {};

let currentVideo = 0;

let videoStart = false;

const requestOrder = {
  jsonrpc: "2.0",
  method: "generateIntegers",
  params: {
    apiKey,
    n: 15, // Number of integers to generate
    min: 0, // Lower bound (inclusive)
    max: 14, // Upper bound (inclusive)
    replacement: false, // Without replacement (no duplicates)
  },
  id: 1,
};

const requestStartWithReferenz = {
  jsonrpc: "2.0",
  method: "generateIntegers",
  params: {
    apiKey,
    n: 15, // Number of integers to generate
    min: 0, // Lower bound (inclusive)
    max: 1, // Upper bound (inclusive)
    replacement: true, // With replacement (duplicates possible)
  },
  id: 1,
};

const videoSourceList = [
  { name: "Action Clip I", src: "videos/tokio_drift.mp4" },
  { name: "Action Clip II", src: "videos/expendables_4.mp4" },
  { name: "Middle Clip", src: "videos/super_natural_slow.mp4" },
  { name: "Slow Clip I", src: "videos/night_shot.mp4" },
  { name: "Slow Clip II", src: "videos/foggy_forest.mp4" },
];

const demoVideoSourceList = [
  { name: "Demo Video A", src: "videos/river_shot.mp4" },
  {
    name: "Demo Video B",
    src: "videos/vikings_Battle_for_Kattegat_Ragnar_vs_Jarl_Borg.mp4",
  },
  { name: "Demo Video C", src: "videos/transporter_3.mp4" },
];

const breakVideoSourceList = [
  { name: "Pause Habitutation Video A", src: "videos/break_A_habituation.mp4" },
  { name: "Pause Habitutation Video B", src: "videos/break_B_habituation.mp4" },
  { name: "Pause Evaluation Video A", src: "videos/break_A_rating.mp4" },
  { name: "Pause Evaluation Video B", src: "videos/break_B_rating.mp4" },
  { name: "Pause Rating", src: "videos/break_rating_pause.mp4" },
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

    const setConfig = (idx) => {
      const deviceId = 3;
      db.devices.where("id").equals(deviceId).modify({ configId: idx });
      if (idx === 4) {
        setTimeout(() => {
          global.ipcRenderer.send(
            "CHASER:SEND_STRIPE",
            new Array(204).fill("000000"),
            deviceId
          );
        }, 100);
      }
      console.log(
        "The Video",
        playlist[currentVideo].name,
        "is playing with",
        configList[idx - 1].name
      );
    };

    const video = videoRef.current;
    video.src = encodeURI(playlist[0].src);

    const configId = playlist[currentVideo].configId;
    setConfig(configId);

    const vidPlay = (idx, nostart) => {
      currentVideo = idx;
      videoStart = nostart ? false : true;
      video.src = encodeURI(playlist[idx]["src"]);
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

  const pushToPlaylist = (name, src, configId, playlist) => {
    playlist.push({ name, src: encodeURI(src), configId });
  };

  function generateSplit(
    video,
    config,
    startWithReferenz,
    evaluation,
    playlist
  ) {
    const indikator = evaluation ? "(Evaluation)" : "(Habitutation)";
    const pauseIndexes = evaluation ? [2, 3, 4] : [0, 1, 4];
    if (startWithReferenz) {
      pushToPlaylist(
        `Referenz ${video.name} ${indikator}`,
        video.src,
        4,
        playlist
      );
      pushToPlaylist(
        "Pause " + indikator,
        breakVideoSourceList[pauseIndexes[0]]["src"],
        4,
        playlist
      );
      pushToPlaylist(
        `Test ${video.name} ${indikator}`,
        video.src,
        config.id,
        playlist
      );
      pushToPlaylist(
        "Pause " + indikator,
        breakVideoSourceList[pauseIndexes[1]]["src"],
        4,
        playlist
      );
    } else {
      pushToPlaylist(
        `Test ${video.name} ${indikator}`,
        video.src,
        config.id,
        playlist
      );
      pushToPlaylist(
        "Pause " + indikator,
        breakVideoSourceList[pauseIndexes[0]]["src"],
        4,
        playlist
      );
      pushToPlaylist(
        `Referenz ${video.name} ${indikator}`,
        video.src,
        4,
        playlist
      );
      pushToPlaylist(
        "Pause " + indikator,
        breakVideoSourceList[pauseIndexes[1]]["src"],
        4,
        playlist
      );
    }
    if (evaluation) {
      pushToPlaylist(
        "Pause (End)",
        breakVideoSourceList[pauseIndexes[2]]["src"],
        4,
        playlist
      );
    }
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

            for (let i = 0; i < data.length; i++) {
              const video = videoSourceList[data[i].videoIdx];
              const startWithReferenz = data[i].startWithReferenz;
              const config = configList[data[i].configIdx];

              // create Double Stimulus Continuous Quality Scale (DSCQS) playlist
              generateSplit(video, config, startWithReferenz, false, playlist);
              generateSplit(video, config, startWithReferenz, true, playlist);
            }
            console.log(playlist);

            setPlaylist(playlist);

            pb.collection("subject_tests").create({
              playlist,
            });
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
          window.location.reload();
        }}
      >
        reset
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

      <button
        onClick={() => {
          const playlist = [];
          for (let j = 0; j < configList.length; j++) {
            for (let i = 0; i < demoVideoSourceList.length; i++) {
              const video = demoVideoSourceList[i];
              const startWithReferenz = Math.random() < 0.5;
              const config = configList[j];

              // create Double Stimulus Continuous Quality Scale (DSCQS) playlist
              generateSplit(video, config, startWithReferenz, false, playlist);
              generateSplit(video, config, startWithReferenz, true, playlist);
            }
          }
          console.log(
            "🚀 ~ file: subjectTest.tsx:314 ~ SubjectTest ~ playlist:",
            playlist
          );
          setPlaylist(playlist);
        }}
      >
        Generate Demo Playlist
      </button>
    </div>
  );
}
