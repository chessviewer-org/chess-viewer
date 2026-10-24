const inlineSources = new Map<string, string>();

export function pieceSrc(path: string): string {
  return inlineSources.get(path) ?? path;
}

export function inlinePieceSources(
  sources: Iterable<readonly [string, string]>
) {
  for (const [path, uri] of sources) inlineSources.set(path, uri);
}

export function inlinedPieceSources(): ReadonlyMap<string, string> {
  return inlineSources;
}
