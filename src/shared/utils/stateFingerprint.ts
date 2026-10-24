export const SNAPSHOT_KEY = 'cv_page_snapshot';

function storageEntries(storage: Storage, prefix: string): string[] {
  const entries: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key !== null && key !== SNAPSHOT_KEY)
      entries.push(`${prefix}${key}\u0000${storage.getItem(key) ?? ''}`);
  }
  return entries;
}

export function stateFingerprint(): string {
  const entries = [
    ...storageEntries(localStorage, 'l:'),
    ...storageEntries(sessionStorage, 's:')
  ].sort();
  let hash = 5381;
  for (const entry of entries) {
    for (let index = 0; index < entry.length; index++) {
      hash = (Math.imul(hash, 33) ^ entry.charCodeAt(index)) >>> 0;
    }
    hash = (Math.imul(hash, 33) ^ 0) >>> 0;
  }
  return hash.toString(36);
}
