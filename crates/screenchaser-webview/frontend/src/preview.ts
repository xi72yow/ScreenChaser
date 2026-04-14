import { daemon } from "@/ws";

export interface PreviewFrame {
  width: number;
  height: number;
  imageData: ImageData;
}

type FrameListener = (frame: PreviewFrame) => void;

class PreviewManager {
  private listeners: Set<FrameListener> = new Set();
  private currentFrame: PreviewFrame | null = null;
  private active = false;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

  start() {
    if (this.active) return;
    this.active = true;

    daemon.onBinary(async (blob: Blob) => {
      const buf = await blob.arrayBuffer();
      if (buf.byteLength < 8) return;

      const header = new DataView(buf);
      const width = header.getUint32(0, true);
      const height = header.getUint32(4, true);

      const expectedSize = 8 + width * height * 4;
      if (buf.byteLength < expectedSize) return;

      const rgba = new Uint8ClampedArray(buf, 8, width * height * 4);
      const imageData = new ImageData(rgba, width, height);

      this.currentFrame = { width, height, imageData };
      this.listeners.forEach((cb) => cb(this.currentFrame!));
    });

    daemon.setPreview(true);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    daemon.setPreview(false);
  }

  subscribe(listener: FrameListener) {
    this.listeners.add(listener);
    if (!this.active) this.start();
  }

  unsubscribe(listener: FrameListener) {
    this.listeners.delete(listener);
    if (this.listeners.size === 0) this.stop();
  }

  get lastFrame() {
    return this.currentFrame;
  }
}

export const preview = new PreviewManager();
