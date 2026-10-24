import { flushPendingWrites } from './pendingWrites';
import { inlinePieceSources, inlinedPieceSources } from './pieceSources';
import { SNAPSHOT_KEY, stateFingerprint } from './stateFingerprint';

const MAX_SNAPSHOT_LENGTH = 2_000_000;
const MAX_SHARED_SNAPSHOT_LENGTH = 512_000;
const PIECE_IMAGE = /^\/(?:fairy)?piece\//;
const SVG_DATA_URI = 'data:image/svg+xml;charset=utf-8,';
const PIECE_SOURCES_ID = 'cv-piece-sources';
const RAW_TEXT_PARENTS = new Set(['TEXTAREA', 'SCRIPT', 'STYLE', 'TITLE']);
const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'number',
  'range',
  'color'
]);

const observedPieceSvgs = new Map<string, string>();

function currentBuild(): string | null {
  return (
    document.querySelector('script[type="module"][src]')?.getAttribute('src') ??
    null
  );
}

function hasOpenModal(): boolean {
  return [document.documentElement, document.body].some((el) =>
    el.classList.contains('modal-open')
  );
}

function cachePieceSvg(url: string) {
  const { origin, pathname } = new URL(url);
  if (
    origin !== window.location.origin ||
    !PIECE_IMAGE.test(pathname) ||
    observedPieceSvgs.has(pathname)
  )
    return;
  observedPieceSvgs.set(pathname, '');
  fetch(pathname, { cache: 'force-cache' })
    .then((res) => (res.ok ? res.text() : Promise.reject(new Error(pathname))))
    .then((svg) =>
      observedPieceSvgs.set(pathname, SVG_DATA_URI + encodeURIComponent(svg))
    )
    .catch(() => observedPieceSvgs.delete(pathname));
}

function knownPieceSources(): Map<string, string> {
  const sources = new Map(inlinedPieceSources());
  for (const [path, uri] of observedPieceSvgs) if (uri) sources.set(path, uri);
  return sources;
}

function inlinePieceImages(clone: HTMLElement): Record<string, string> {
  const sources = knownPieceSources();
  const pathsByUri = new Map([...sources].map(([path, uri]) => [uri, path]));
  const used: Record<string, string> = {};
  for (const img of clone.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (!src) continue;
    const path = src.startsWith('data:')
      ? pathsByUri.get(src)
      : new URL(src, window.location.href).pathname;
    const uri = path && sources.get(path);
    if (!path || !uri) continue;
    used[path] = uri;
    img.setAttribute('src', uri);
  }
  return used;
}

function persistFieldState(source: Element, target: Element) {
  if (source instanceof HTMLTextAreaElement) {
    target.textContent = source.value;
  } else if (source instanceof HTMLSelectElement) {
    target.querySelectorAll('option').forEach((option, index) => {
      option.toggleAttribute('selected', source.options[index]?.selected);
    });
  } else if (source instanceof HTMLInputElement) {
    if (source.type === 'checkbox' || source.type === 'radio') {
      target.toggleAttribute('checked', source.checked);
    } else if (TEXT_INPUT_TYPES.has(source.type)) {
      target.setAttribute('value', source.value);
    }
  }
}

function canvasDataUrl(canvas: HTMLCanvasElement): string | null {
  try {
    return canvas.toDataURL();
  } catch {
    return null;
  }
}

function persistVisibleCanvases(root: HTMLElement, clone: HTMLElement) {
  const sources = root.querySelectorAll('canvas');
  clone.querySelectorAll('canvas').forEach((canvas, index) => {
    const source = sources[index];
    if (!source?.width || !source.height) return;
    const { top, bottom } = source.getBoundingClientRect();
    if (bottom < 0 || top > window.innerHeight) return;
    const url = canvasDataUrl(source);
    if (url) canvas.style.background = `url("${url}") center / 100% 100%`;
  });
}

function preserveTextBoundaries(clone: HTMLElement) {
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  const boundaries: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (
      node.nextSibling?.nodeType === Node.TEXT_NODE &&
      !RAW_TEXT_PARENTS.has(node.parentElement?.tagName ?? '')
    )
      boundaries.push(node as Text);
  }
  for (const text of boundaries) text.after(document.createComment(''));
}

function serialize(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  const pieces = inlinePieceImages(clone);
  persistVisibleCanvases(root, clone);
  const fields = root.querySelectorAll('input, textarea, select');
  clone.querySelectorAll('input, textarea, select').forEach((field, index) => {
    const source = fields[index];
    if (source) persistFieldState(source, field);
  });
  clone
    .querySelectorAll('[role="region"][aria-live]')
    .forEach((region) => region.replaceChildren());
  preserveTextBoundaries(clone);
  return { html: clone.innerHTML, pieces };
}

function writeSnapshot(storage: Storage, value: string | null): boolean {
  try {
    if (value === null) storage.removeItem(SNAPSHOT_KEY);
    else storage.setItem(SNAPSHOT_KEY, value);
    return true;
  } catch {
    return false;
  }
}

function currentState(): string | null {
  try {
    return stateFingerprint();
  } catch {
    return null;
  }
}

function saveSnapshot(root: HTMLElement, current: boolean) {
  flushPendingWrites();
  const build = currentBuild();
  const state = currentState();
  const snapshot =
    current && build && state && !hasOpenModal()
      ? JSON.stringify({
          build,
          state,
          path: window.location.pathname + window.location.search,
          ...serialize(root)
        })
      : '';
  const usable = snapshot.length > 0;
  const saved =
    usable &&
    snapshot.length <= MAX_SNAPSHOT_LENGTH &&
    writeSnapshot(sessionStorage, snapshot);
  if (!saved) writeSnapshot(sessionStorage, null);
  const shared =
    saved &&
    snapshot.length <= MAX_SHARED_SNAPSHOT_LENGTH &&
    writeSnapshot(localStorage, snapshot);
  if (!shared) writeSnapshot(localStorage, null);
}

function parsePieceSources(
  json: string | null | undefined
): [string, string][] {
  try {
    const { pieces } = JSON.parse(json ?? '{}') as { pieces?: unknown };
    if (typeof pieces !== 'object' || pieces === null) return [];
    return Object.entries(pieces).filter(
      (entry): entry is [string, string] =>
        PIECE_IMAGE.test(entry[0]) &&
        typeof entry[1] === 'string' &&
        entry[1].startsWith(SVG_DATA_URI)
    );
  } catch {
    return [];
  }
}

export function inlineDocumentPieces() {
  inlinePieceSources(
    parsePieceSources(document.getElementById(PIECE_SOURCES_ID)?.textContent)
  );
}

export function restoreSnapshot(root: HTMLElement): boolean {
  const snapshot = document.getElementById('root-snapshot');
  if (!snapshot) return false;
  root.replaceChildren(...snapshot.childNodes);
  snapshot.remove();
  return true;
}

export function snapshotOnHide(root: HTMLElement) {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) cachePieceSvg(entry.name);
  }).observe({ type: 'resource', buffered: true });
  let current = true;
  window.addEventListener('storage', (event) => {
    if (event.storageArea === localStorage && event.key !== SNAPSHOT_KEY)
      current = false;
  });
  const save = () => saveSnapshot(root, current);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
}
