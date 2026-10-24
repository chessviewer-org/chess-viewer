import {
  SNAPSHOT_KEY,
  stateFingerprint
} from '../shared/utils/stateFingerprint';

(function () {
  const root = document.documentElement;
  const prerenderedRoute = root.getAttribute('data-prerendered-route');
  if (!prerenderedRoute) return;

  function normalize(path) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  const IGNORED_KEYS = new Set(['cv_sw_purged', 'cv_session_id', SNAPSHOT_KEY]);
  const EMPTY_VALUES = new Set(['', '[]', '{}', 'null']);

  function hasStoredState(storage) {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (
        key !== null &&
        !IGNORED_KEYS.has(key) &&
        !EMPTY_VALUES.has(storage.getItem(key) ?? '')
      )
        return true;
    }
    return false;
  }

  function hasClientState() {
    try {
      return hasStoredState(localStorage) || hasStoredState(sessionStorage);
    } catch {
      return false;
    }
  }

  function parseSnapshot(storage, build, state) {
    try {
      const snapshot = JSON.parse(storage.getItem(SNAPSHOT_KEY) ?? 'null');
      return snapshot &&
        typeof snapshot.html === 'string' &&
        snapshot.build === build &&
        snapshot.state === state &&
        snapshot.path === window.location.pathname + window.location.search
        ? snapshot
        : null;
    } catch {
      return null;
    }
  }

  function readSnapshot() {
    if (window.location.hash) return null;
    try {
      const build = document
        .querySelector('script[type="module"][src]')
        ?.getAttribute('src');
      const state = stateFingerprint();
      return (
        parseSnapshot(sessionStorage, build, state) ??
        parseSnapshot(localStorage, build, state)
      );
    } catch {
      return null;
    }
  }

  function guard() {
    const snapshot = readSnapshot();
    if (snapshot) {
      const sources = document.createElement('script');
      sources.type = 'application/json';
      sources.id = 'cv-piece-sources';
      sources.textContent = JSON.stringify({ pieces: snapshot.pieces ?? {} });
      document.head.append(sources);
      const shell = document.createElement('div');
      shell.id = 'root-snapshot';
      shell.innerHTML = snapshot.html;
      document.body.prepend(shell);
      root.classList.add('prerender-restored');
    } else if (
      normalize(prerenderedRoute) !== normalize(window.location.pathname) ||
      window.location.search ||
      window.location.hash
    ) {
      root.classList.add('prerender-stale');
    } else if (hasClientState()) {
      root.classList.add('prerender-dirty');
    }
  }

  if (document.body) {
    guard();
  } else {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      observer.disconnect();
      guard();
    });
    observer.observe(root, { childList: true });
  }
})();
