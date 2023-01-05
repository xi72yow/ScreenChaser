![ScreenChaser Banner](https://xi72yow.de/data/pictures/screenchaser_logo.png#gh-light-mode-only)

![ScreenChaser Banner](https://xi72yow.de/data/pictures/screenchaser_logo_white.png#gh-dark-mode-only)

<h1 align="left">ScreenChaser</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Maintained%3F-Yes-green?style=for-the-badge">
  <img src="https://img.shields.io/github/license/xi72yow/ScreenChaser?style=for-the-badge">
  <img src="https://img.shields.io/github/stars/xi72yow/ScreenChaser?style=for-the-badge">
  <img src="https://img.shields.io/github/issues/xi72yow/ScreenChaser?color=violet&style=for-the-badge">
</p>

## What is the ScreenChaser

The ScreenChaser consists of three different software parts to control Neopixel (WS2812B LEDs) with the help of your own PC and the local network. For this purpose, the PC sends the calculated data packages to the microcontroller via UDP. The three parts consist of firmware, the core and the user interface. The core mediates between the user and the LEDs. At the moment there is a graphical interface to be able to make all the settings. Later there should be a cli with which you can use the generated config on a home server. I will describes all actual and comming features in version 1.0.0. For now, you can check out some of the current features in the animation below. The animation are recorded in a virtual room. It is unlikely that it will be a user-facing part in the future. It only serves to visualize the interaction of all components.

## Visualisation

Note that the render below only gives an insight and does not show all functionality.

![ScreenChaser Visualisation](https://xi72yow.de/data/gif/screenchaserIdea.webp)
