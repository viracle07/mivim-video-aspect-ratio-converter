const databaseName = "mivim-videos";
const storeName = "source-files";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSourceVideo(id, file) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(file, id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSourceVideo(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id);
    request.onsuccess = () => { database.close(); resolve(request.result || null); };
    request.onerror = () => reject(request.error);
  });
}

export function saveConvertedVideo(id, blob) {
  return saveSourceVideo(`output:${id}`, blob);
}

export function getConvertedVideo(id) {
  return getSourceVideo(`output:${id}`);
}

async function deleteStoredValue(key) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteJobVideos(id) {
  await Promise.all([deleteStoredValue(id), deleteStoredValue(`output:${id}`)]);
}
