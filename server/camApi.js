const express = require("express");
const app = express();
const fs = require("fs");
const got = require("got");
const fetch = require("node-fetch");
const { createWriteStream } = require("fs");
const NetScanner = require("../effects/network/netScanner");
var PassThrough = require("stream").PassThrough;
const axios = require("axios").default;
const url = "http://192.168.2.123:81/stream";
const http = require("http");
/* 
a = PassThrough();
b1 = PassThrough();
b2 = PassThrough();
a.pipe(b1);
a.pipe(b2);
b1.on("data", function (data) {
  console.log("b1:", data.toString());
});
b2.on("data", function (data) {
  console.log("b2:", data.toString());
});

async function name(params) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data, "utf-8");
  a.write(buffer);
}
//name();

var data;

http.get(url, function (res) {
  res
    .on("data", function (chunk) {
      data = chunk;
      //a.write(chunk);
    })
    .on("end", function () {
      //at this point data is an array of Buffers
      //so Buffer.concat() can make us a new Buffer
      //of all of them together
      var buffer = Buffer.concat(data);
      console.log(buffer.toString("base64"));
    });
}); */

app.get("/", function (req, res) {
  fs.readFile(__dirname + "/" + "cams.html", "utf8", function (err, data) {
    console.log("🚀 ~ file: camApi.js ~ line 7 ~ __dirname", __dirname);
    console.log(data);
    res.end(data);
  });
});

app.get("/xSlaves", async function (req, res) {
  try {
    const netScanner = new NetScanner();
    let xSlaves = await netScanner.scanNetwork();
    netScanner.logSlaves();
    res.end(JSON.stringify(xSlaves));
  } catch (error) {
    console.log("🚀 ~ file: camApi.js ~ line 21 ~ error", error);
    res.end(JSON.stringify([]));
  }
});

app.get("/cam1", async (req, res) => {
  console.log(`Ⓧ: `, data);
  res.end(data.toString("base64"));
});

function stream2buffer(stream) {
  return new Promise((resolve, reject) => {
    const _buf = [];

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));
  });
}
var server = app.listen(3000, "localhost", function () {
  var host = server.address().address;
  console.log(
    "🚀 ~ file: camApi.js ~ line 14 ~ server ~ host",
    server.address()
  );
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});
