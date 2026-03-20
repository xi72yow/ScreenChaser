import { IndexedDB } from "./indexeddb";

interface UpdateCallback {
  (name: string, value: any): void;
}

export class State {
  static dbName: string = "stateDB";
  static dbVersion: number = 1;
  static storeName: string = "state";
  static DB: IndexedDB | null = null;
  static target: EventTarget = new EventTarget();
  static channel: BroadcastChannel = new BroadcastChannel("state-sync");
  private static channelInitialized = false;

  private observed: Set<string>;
  private updateCallback?: UpdateCallback;

  constructor(observed: string[], updateCallback?: UpdateCallback) {
    this.updateCallback = updateCallback;

    this.observed = new Set(observed);

    // Listen for same-window events
    State.target.addEventListener("set", (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string; value: any }>;
      if (this.updateCallback && this.observed.has(customEvent.detail.name)) {
        this.updateCallback(customEvent.detail.name, customEvent.detail.value);
      }
    });

    // Listen for cross-window events (BroadcastChannel)
    if (!State.channelInitialized) {
      State.channelInitialized = true;
      State.channel.onmessage = (e: MessageEvent) => {
        const { name, value } = e.data;
        // Re-dispatch locally so all State instances in this window get notified
        const event = new CustomEvent("set", { detail: { name, value } });
        State.target.dispatchEvent(event);
      };
    }
  }

  async dbConnect(): Promise<IndexedDB> {
    State.DB = State.DB || new IndexedDB();

    if (!State.DB.connection) {
      await State.DB.connect(
        State.dbName,
        State.dbVersion,
        (db, oldVersion) => {
          if (oldVersion === 0) {
            db.createObjectStore(State.storeName);
          }
        }
      );
    }

    return State.DB;
  }

  async set(name: string, value: any): Promise<void> {
    this.observed.add(name);

    const db = await this.dbConnect();
    await db.set(State.storeName, name, value);

    // Notify same window
    const event = new CustomEvent("set", { detail: { name, value } });
    State.target.dispatchEvent(event);

    // Notify other windows
    State.channel.postMessage({ name, value });
  }

  async get(name: string): Promise<any> {
    this.observed.add(name);

    const db = await this.dbConnect();
    return await db.get(State.storeName, name);
  }

  async getAllKeys(): Promise<IDBValidKey[]> {
    const db = await this.dbConnect();
    return await db.getAllKeys(State.storeName);
  }
}
