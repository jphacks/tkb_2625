let connection: Promise<IDBDatabase> | undefined;

export function openDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
    const request = indexedDB.open('roam-demo', 1);
    let settled = false;
    const timer = setTimeout(() => fail(new Error('IndexedDB open timeout')), 5000);
    function fail(error: unknown) {
      if (settled) return;
      settled = true; clearTimeout(timer); reject(error);
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
    };
    request.onerror = () => fail(request.error);
    request.onblocked = () => fail(new Error('IndexedDB upgrade blocked'));
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true; clearTimeout(timer);
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = undefined; };
      db.onclose = () => { connection = undefined; };
      resolve(db);
    };
  });
  connection.catch(() => { connection = undefined; });
  return connection;
}

export function readRecord<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).get(key);
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('IndexedDB read failed'));
  });
}
