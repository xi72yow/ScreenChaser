const random = require("./basics/random")
const setAll = require("./basics/setAll")
const setPixel = require("./basics/setPixel")

class MeteorRain {
    constructor(red, green, blue, meteorSize, meteorTrailDecay, meteorRandomDecay, neopixelCount) {
        this.stripe = setAll(0, 0, 0, neopixelCount);
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.meteorSize = meteorSize;
        this.meteorTrailDecay = meteorTrailDecay;
        this.meteorRandomDecay = meteorRandomDecay;
        this.count = 0;
        this.neopixelCount = neopixelCount;
    }

    fadeToBlack(pixel, stripe, fadeValue) {
        const oldColor = stripe[pixel];
        let r = parseInt(oldColor.slice(0, 2), 16);
        let g = parseInt(oldColor.slice(2, 4), 16);
        let b = parseInt(oldColor.slice(4, 6), 16);
        r = (r <= 10) ? 0 : (r - fadeValue);
        g = (g <= 10) ? 0 : (g - fadeValue);
        b = (b <= 10) ? 0 : (b - fadeValue);
        return setPixel(pixel, stripe, r, g, b);
    }

    render() {
        this.count++;
        // fade brightness all LEDs one step
        for (let j = 0; j < this.neopixelCount; j++) {
            if ((!this.meteorRandomDecay) || (random(10) > 5)) {
                this.stripe = this.fadeToBlack(j, this.stripe, this.meteorTrailDecay);
            }
        }
        // draw meteor
        for (let k = 0; k < this.meteorSize; k++) {
            if ((this.count - k < this.neopixelCount) && (this.count - k >= 0)) {
                this.stripe = setPixel(this.count - k, this.stripe, this.red, this.green, this.blue);
            }
        }

        //reset animation
        if (this.count > this.neopixelCount * 2) {
            this.stripe = setAll(0, 0, 0, this.neopixelCount);
            this.count = 0;
        }

        return this.stripe;
    }
}

module.exports = MeteorRain