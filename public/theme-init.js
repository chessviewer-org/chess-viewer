(function () {
  /**
   * Resolves the first-paint theme synchronously, before the bundle loads, to
   * eliminate the FOUC. Mirrors the React-side rules in `themeMode.ts`:
   *
   *   - Primary key `cv_theme_mode` may hold 'light' | 'dark' | 'system'
   *     (JSON-quoted or bare). 'system' follows the OS `prefers-color-scheme`.
   *   - Legacy key `chess-theme` is a read-only back-compat fallback for the
   *     plain strings 'light' | 'dark' ONLY (it never held 'system'; the board
   *     -colour JSON object stored there is NOT a mode and is ignored).
   *   - Nothing stored ⇒ DARK (the default). A fresh user sees dark, NOT the OS.
   *
   * Returns only the literals 'light' or 'dark'.
   *
   * @returns {'light'|'dark'} Resolved theme value
   */
  const MODE_KEY = 'cv_theme_mode';
  const LEGACY_KEY = 'chess-theme';
  const ALLOWED_MODE = { light: true, dark: true };

  function systemTheme() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /**
   * Reads + validates a stored preference, returning 'light' | 'dark' |
   * 'system' or null. Tolerates a JSON-quoted or bare string.
   *
   * @param {string|null} raw - The raw localStorage value
   * @returns {'light'|'dark'|'system'|null}
   */
  function readPreference(raw) {
    if (!raw) return null;
    let value = raw;
    if (raw.charCodeAt(0) === 34 /* '"' */) {
      try {
        const parsed = JSON.parse(raw);
        value = typeof parsed === 'string' ? parsed : '';
      } catch {
        value = '';
      }
    }
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return null;
  }

  function getInitialTheme() {
    let mode = null;
    let legacy = null;
    try {
      mode = localStorage.getItem(MODE_KEY);
      legacy = localStorage.getItem(LEGACY_KEY);
    } catch {
      mode = null;
      legacy = null;
    }

    const pref = readPreference(mode);
    if (pref === 'light' || pref === 'dark') return pref;
    if (pref === 'system') return systemTheme();

    // Back-compat: legacy plain-string 'light' | 'dark' only.
    if (legacy && Object.prototype.hasOwnProperty.call(ALLOWED_MODE, legacy)) {
      return legacy;
    }

    // Nothing stored ⇒ DARK default (not the OS setting).
    return 'dark';
  }

  const theme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', theme);
  window.__INITIAL_THEME__ = theme;
})();
