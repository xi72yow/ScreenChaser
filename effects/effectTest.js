const MeteorRain = require("./meteor")
const DataEmitter = require("./dataEmitter")

let MeteorRainEffect = new MeteorRain(155, 25, 200, 5, 20, true, 100, 121)

let DataEmitterForIP = new DataEmitter("192.168.2.113")

setInterval(() => {
    DataEmitterForIP.emit(MeteorRainEffect.render())
}, 100);