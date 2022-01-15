const dgram = require('dgram');

class DataEmitter {
    constructor(ipaddr, DEBUG = false) {
        this.ipaddr = ipaddr;
        this.lastChunk = [];
        this.DEBUG = DEBUG;
        this.sendedPacks = 0;
        this.recivedPacks = 0;
        this.server = dgram.createSocket('udp4');

        this.server.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            server.close();
        });
        this.server.on('message', (msg, senderInfo) => {
            if (DEBUG) {
                if (this.recivedPacks === 0) {
                    console.log(`Messages received ${msg}`);
                }
                this.recivedPacks++;
            }
            /*server.send(msg,senderInfo.port,senderInfo.address,()=>{
            console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`)
            })*/
        });
        this.server.on('listening', () => {
            const address = this.server.address();
            console.log(`server listening on ${address.address}:${address.port}`);
        });
    }

    /**
 * returns an array with arrays of the given size
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 * @return {Array} contains all chunks
 */
    chunkArray(myArray, chunk_size) {
        let index = 0;
        let tempArray = [];

        for (index = 0; index < myArray.length; index += chunk_size) {
            let myChunk = myArray.slice(index, index + chunk_size);
            // Do something if you want with the group
            tempArray.push(myChunk);
        }
        return tempArray;
    }

    /**
 * send the stripe data to esp
 *
 * @param pixelArray {Array} represents the light colors (rgb-color formatted)
 * @return {Array} light colors (hex-color formatted)
 */
    emit(pixelArray) {
        let hexColorStrip = [];
        let pixelUDPframe = "";
        for (let i = 0; i < pixelArray.length; i++) {
            let rgb = pixelArray[i];
            pixelUDPframe += rgb;
            hexColorStrip[i] = rgb;
        }
        //send Data to ESP esp rx max size is 256
        const sendingFrames = this.chunkArray(pixelUDPframe, 252); //252/6=42LED
        sendingFrames.forEach((frames, i) => {
            if (this.lastChunk[i] === frames) {
                return;
            }
            if (this.DEBUG) {
                this.sendedPacks++;
            }
            this.server.send(i.toString(16) + frames, 4210, this.ipaddr);
        });
        this.lastChunk = sendingFrames;
        return hexColorStrip;
    }

    logHealth() {
        if (this.DEBUG) {
            console.log(`sendedPacks: ${sendedPacks}`);
            console.log(`recivedPacks: ${recivedPacks}`);
            console.log(`packageloss: ${(recivedPacks / sendedPacks * 100) - 100}%`);
        }
        else console.log("DEBUG is off");
    };

}

module.exports = DataEmitter