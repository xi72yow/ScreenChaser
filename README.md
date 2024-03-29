<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://xi72yow.de/data/pictures/screenchaser_logo_white.png">
  <source media="(prefers-color-scheme: light)" srcset="https://xi72yow.de/data/pictures/screenchaser_logo.png">
  <img alt="ScreenChaser Banner" src="https://xi72yow.de/data/pictures/screenchaser_logo.png">
</picture>

<h1 align="left">ScreenChaser</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Maintained%3F-Yes-green?style=for-the-badge">
  <img alt="GitHub all releases" src="https://img.shields.io/github/downloads/xi72yow/ScreenChaser/total?style=for-the-badge">
  <img src="https://img.shields.io/github/stars/xi72yow/ScreenChaser?style=for-the-badge">
  <a href="https://discord.gg/g85QvUsyj9"><img alt="Discord" src="https://img.shields.io/discord/1061688839418163241?label=Discord&logo=discord&style=for-the-badge"></a>
</p>

## What is the ScreenChaser

The ScreenChaser consists of three different software parts to control Neopixel (WS2812B LEDs) with the help of your own PC and the local network. For this purpose, the PC sends the calculated data packages to the microcontroller via UDP. The three parts consist of firmware, the core and the user interface. The core mediates between the user and the LEDs. At the moment there is a graphical interface where all the settings can configured. Later there should be a cli with which you can use the generated config on a home server. I will describe all actual and comming features in version 1.0.0. For now, you can check out some of the current features in the animation below. The animation was recorded in a virtual room. It only serves to visualize the interaction of all components.

## Visualisation

Note that the render below only gives an insight and does not show all functionality.

https://user-images.githubusercontent.com/65042627/210893593-29b303a0-6971-4d15-9e41-3c11cf5573cd.mp4

## Main features roadmap:

- [ ] create better serial credentials API
- [ ] connect multiple controller to one virtual device
- [ ] esp over the air firmware update from repo
- [ ] custom theme colors
- [ ] support for multiple languages
- [ ] basic color fade effects
- [ ] create a place where animations can share
- [ ] optional user database sync
- [ ] support wled json api

```js
fetch("http://192.168.2.113/json/state", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    on: "t",
    v: true,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => {
    console.error("Error:", error);
  });
```
