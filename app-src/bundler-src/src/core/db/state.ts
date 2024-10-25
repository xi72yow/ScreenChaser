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

  private observed: Set<string>;
  private updateCallback?: UpdateCallback;

  constructor(observed: string[], updateCallback?: UpdateCallback) {
    this.updateCallback = updateCallback;

    this.observed = new Set(observed);

    State.target.addEventListener("set", (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string; value: any }>;
      if (this.updateCallback && this.observed.has(customEvent.detail.name)) {
        this.updateCallback(customEvent.detail.name, customEvent.detail.value);
      }
    });
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

    const event = new CustomEvent("set", { detail: { name, value } });
    State.target.dispatchEvent(event);
  }

  async get(name: string): Promise<any> {
    this.observed.add(name);

    const db = await this.dbConnect();
    return await db.get(State.storeName, name);
  }
}
