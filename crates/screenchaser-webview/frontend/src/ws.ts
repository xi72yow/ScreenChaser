type MessageHandler = (msg: any) => void;
type BinaryHandler = (blob: Blob) => void;

class DaemonClient {
  private socket: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private binaryHandlers: BinaryHandler[] = [];
  private pendingRequests: Map<string, Array<(msg: any) => void>> = new Map();
  private reconnectTimer: number | null = null;
  private connectPromise: Promise<void> | null = null;
  private url: string;

  constructor() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    // in dev (vite proxy): same host. in webview: daemon on 19447
    if (location.protocol === "sc:") {
      this.url = "ws://127.0.0.1:19447/ws";
    } else {
      this.url = `${protocol}//${location.host}/ws`;
    }
  }

  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("[ws] connected to daemon");
        this.connectPromise = null;
        resolve();
      };

      this.socket.onmessage = (event) => {
        if (event.data instanceof Blob) {
          this.dispatchBinary(event.data);
          return;
        }
        try {
          const msg = JSON.parse(event.data);
          this.dispatch(msg);
        } catch (e) {
          console.warn("[ws] failed to parse message", e);
        }
      };

      this.socket.onclose = () => {
        console.log("[ws] disconnected, reconnecting in 2s...");
        this.connectPromise = null;
        this.scheduleReconnect();
      };

      this.socket.onerror = (e) => {
        console.error("[ws] error", e);
        this.connectPromise = null;
        reject(e);
      };
    });

    return this.connectPromise;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, 2000);
  }

  private dispatch(msg: any) {
    const type = msg.type as string;
    if (!type) return;

    // resolve all pending requests for this type
    const pending = this.pendingRequests.get(type);
    if (pending && pending.length > 0) {
      this.pendingRequests.delete(type);
      pending.forEach((resolve) => resolve(msg));
    }

    // notify subscribers
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((h) => h(msg));
    }
  }

  send(msg: any) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn("[ws] not connected, dropping message", msg);
      return;
    }
    this.socket.send(JSON.stringify(msg));
  }

  request(msg: any, responseType: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const queue = this.pendingRequests.get(responseType) || [];
        const idx = queue.indexOf(handler);
        if (idx !== -1) queue.splice(idx, 1);
        reject(new Error(`timeout waiting for ${responseType}`));
      }, 30000);

      const handler = (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      };

      const queue = this.pendingRequests.get(responseType) || [];
      queue.push(handler);
      this.pendingRequests.set(responseType, queue);

      this.send(msg);
    });
  }

  on(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) || [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  private dispatchBinary(blob: Blob) {
    this.binaryHandlers.forEach((h) => h(blob));
  }

  onBinary(handler: BinaryHandler) {
    this.binaryHandlers.push(handler);
  }

  offBinary(handler: BinaryHandler) {
    this.binaryHandlers = this.binaryHandlers.filter((h) => h !== handler);
  }

  setPreview(enabled: boolean) {
    this.send({ type: "set_preview", enabled });
  }

  off(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(
      type,
      existing.filter((h) => h !== handler)
    );
  }

  async getConfig() {
    return this.request({ type: "get_config" }, "config");
  }

  async scanNetwork() {
    return this.request({ type: "scan_network" }, "scan_result");
  }

  async updateDevice(id: string, config: any) {
    return this.request(
      { type: "update_device", id, config },
      "config_updated"
    );
  }

  async toggleDevice(id: string, enabled: boolean) {
    return this.request(
      { type: "toggle_device", id, enabled },
      "config_updated"
    );
  }

  async removeDevice(id: string) {
    return this.request({ type: "remove_device", id }, "config_updated");
  }

  async updateCapture(config: any) {
    return this.request(
      { type: "update_capture", config },
      "config_updated"
    );
  }
}

export const daemon = new DaemonClient();
