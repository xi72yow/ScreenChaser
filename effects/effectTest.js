const MeteorRain = require("./meteor")
const DataEmitter = require("./dataEmitter")
const BouncingBalls = require("./bouncingBalls")
const setAll = require("./basics/setAll")


let MeteorRainEffect = new MeteorRain(155, 25, 200, 5, 20, true, 100, 120)

let DataEmitterForIP = new DataEmitter("192.168.2.113")
let BouncingBallsEffect = new BouncingBalls(255, false, 10, 3, 120);

setInterval(() => {
    DataEmitterForIP.emit(MeteorRainEffect.render())
}, 100);