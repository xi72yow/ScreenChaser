export class IndexedDB {
  private db: IDBDatabase | null = null;

  constructor() {}

  initialize(
    dbName: string,
    dbVersion: number,
    dbUpgrade?: (
      db: IDBDatabase,
      oldVersion: number,
      newVersion: number | null,
    ) => void,
  ): Promise<IndexedDB> {
    return new Promise<IndexedDB>((resolve, reject) => {
      // connection object
      this.db = null;

      // no support
      if (!("indexedDB" in window)) reject("not supported");

      // open database
      const dbOpen = indexedDB.open(dbName, dbVersion);

      if (dbUpgrade) {
        // database upgrade event
        dbOpen.onupgradeneeded = (e) => {
          dbUpgrade(dbOpen.result, e.oldVersion, e.newVersion);
        };
      }

      dbOpen.onsuccess = () => {
        this.db = dbOpen.result;
        resolve(this);
      };

      dbOpen.onerror = (e) => {
        const errorCode = (e.target as IDBOpenDBRequest)?.error?.code;
        reject(`IndexedDB error: ${errorCode}`);
      };
    });
  }

  connect(
    dbName: string,
    dbVersion: number,
    dbUpgrade?: (
      db: IDBDatabase,
      oldVersion: number,
      newVersion: number | null,
    ) => void,
  ): Promise<IndexedDB> {
    return new Promise<IndexedDB>((resolve, reject) => {
      if (!("indexedDB" in window)) reject("not supported");

      const dbOpen = indexedDB.open(dbName, dbVersion);

      if (dbUpgrade) {
        dbOpen.onupgradeneeded = (e) => {
          dbUpgrade(dbOpen.result, e.oldVersion, e.newVersion);
        };
      }

      dbOpen.onsuccess = () => {
        this.db = dbOpen.result;
        resolve(this);
      };

      dbOpen.onerror = (e) => {
        reject(
          `IndexedDB error: ${(e.target as IDBOpenDBRequest).error?.message}`,
        );
      };
    });
  }

  get connection(): IDBDatabase | null {
    return this.db;
  }

  set(storeName: string, name: string, value: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }

      const transaction = this.db.transaction(storeName, "readwrite"),
        store = transaction.objectStore(storeName);

      store.put(value, name);

      transaction.oncomplete = () => {
        resolve(true);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  get(storeName: string, name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }

      const transaction = this.db.transaction(storeName, "readonly"),
        store = transaction.objectStore(storeName),
        request = store.get(name);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  getAllKeys(storeName: string): Promise<IDBValidKey[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }

      const transaction = this.db.transaction(storeName, "readonly"),
        store = transaction.objectStore(storeName),
        request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}
