import type { TicketFile } from './planning-types';
const database = 'tripdibo-ticket-files';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Ticket storage is unavailable in this browser.'));
  });
}
export async function saveTicket(file: File): Promise<TicketFile> {
  if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error('Choose a PDF, JPG, PNG, or WebP file up to 5 MB.');
  }
  const metadata = { id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type };
  const db = await openDatabase();
  try { await new Promise<void>((resolve,reject) => {
    const tx = db.transaction('files','readwrite'); tx.objectStore('files').put({ ...metadata, blob: file });
    tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(new Error('Could not save the ticket. Your browser storage may be full.'));
  }); } finally { db.close(); }
  return metadata;
}
export async function removeTicket(id: string) {
  const db = await openDatabase();
  try { await new Promise<void>((resolve,reject) => {
    const tx = db.transaction('files','readwrite'); tx.objectStore('files').delete(id);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('Could not remove the ticket file.'));
  }); } finally { db.close(); }
}
export async function downloadTicket(file: TicketFile) {
  const db = await openDatabase();
  try {
    const record = await new Promise<{ blob: Blob } | undefined>((resolve,reject) => {
      const request = db.transaction('files').objectStore('files').get(file.id);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('Could not read the ticket.'));
    });
    if (!record?.blob) throw new Error('This ticket file is not available on this browser. Attach it again from the booking editor.');
    const url = URL.createObjectURL(record.blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally { db.close(); }
}
