import dgram from "dgram";

interface WledHyperionEmitterInterface {
  ip: string;
  server: dgram.Socket;
  emit(data: any[]): void;
}

export class WledHyperionEmitter implements WledHyperionEmitterInterface {
  ip: any;
  server: dgram.Socket;
  static emit: any;
  constructor({ ip }: { ip: string }) {
    this.ip = ip;
    this.server = dgram.createSocket("udp4");
  }

  emit(data: any[]): void {
    const message = Buffer.from(data.join(""), "hex");

    this.server.send(message, 19446, this.ip, function (err, bytes) {
      if (err) throw err;
    });
  }
}
