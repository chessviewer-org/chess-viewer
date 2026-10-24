const pendingFlushes = new Set<() => void>();

export function trackPendingWrite(flush: () => void): () => void {
  pendingFlushes.add(flush);
  return () => pendingFlushes.delete(flush);
}

export function flushPendingWrites() {
  for (const flush of pendingFlushes) flush();
}

window.addEventListener('pagehide', flushPendingWrites);
