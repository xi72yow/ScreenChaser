import { daemon } from "@/ws";

type FrameListener = (img: HTMLImageElement) => void;

class PreviewManager {
  private listeners: Set<FrameListener> = new Set();
  private currentImage: HTMLImageElement | null = null;
  private currentUrl: string | null = null;
  private active = false;

  start() {
    if (this.active) return;
    this.active = true;

    daemon.onBinary((blob: Blob) => {
      if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        this.currentImage = img;
        this.listeners.forEach((cb) => cb(img));
      };
      img.src = this.currentUrl;
    });

    daemon.setPreview(true);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    daemon.setPreview(false);
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }

  subscribe(listener: FrameListener) {
    this.listeners.add(listener);
    if (!this.active) this.start();
  }

  unsubscribe(listener: FrameListener) {
    this.listeners.delete(listener);
    if (this.listeners.size === 0) this.stop();
  }

  get lastImage() {
    return this.currentImage;
  }
}

export const preview = new PreviewManager();
