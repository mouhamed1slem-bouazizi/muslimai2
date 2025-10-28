// Simple IndexedDB helpers for offline hadith storage
// Guards for SSR: only works in browser

const DB_NAME = 'hadith-cache';
const STORE_NAME = 'books';

function isBrowser() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutBook(lang: string, edition: string, data: any): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = `${lang}:${edition}`;
    store.put({ id, lang, edition, savedAt: Date.now(), data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetBook<T = any>(lang: string, edition: string): Promise<T | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const id = `${lang}:${edition}`;
    const req = store.get(id);
    req.onsuccess = () => {
      resolve(req.result ? (req.result.data as T) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbDeleteBook(lang: string, edition: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = `${lang}:${edition}`;
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbListBooks(): Promise<Array<{ id: string; lang: string; edition: string; savedAt: number }>> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = Array.isArray(req.result) ? req.result : [];
      resolve(rows.map((r: any) => ({ id: r.id, lang: r.lang, edition: r.edition, savedAt: r.savedAt })));
    };
    req.onerror = () => reject(req.error);
  });
}