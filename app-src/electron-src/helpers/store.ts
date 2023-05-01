import electron from "electron";
import path from "path";
import fs from "fs";

export default class Store {
  path: string;
  data: any;
  constructor(opts: { configName: string; defaults: any }) {
    //@ts-ignore
    const userDataPath = (electron.app || electron.remote.app).getPath(
      "userData"
    );

    this.path = path.join(userDataPath, opts.configName + ".json");

    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key: string | number) {
    return this.data[key];
  }

  set(key: string | number, val: any) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath: fs.PathOrFileDescriptor, defaults: any) {
  try {
    // @ts-ignore
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return defaults;
  }
}
