(function () {
  const MODE_KEY = 'cv_theme_mode';
  const LEGACY_KEY = 'chess-theme';
  const ALLOWED_MODE = { light: true, dark: true };

  function systemTheme() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

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

    if (legacy && Object.prototype.hasOwnProperty.call(ALLOWED_MODE, legacy)) {
      return legacy;
    }

    return 'dark';
  }

  const theme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', theme);
  window.__INITIAL_THEME__ = theme;

  try {
    const rawContrast = localStorage.getItem('cv_contrast');
    if (rawContrast) {
      let contrast = rawContrast;
      try {
        contrast = JSON.parse(rawContrast);
      } catch {
        /* noop */
      }
      if (contrast === 'high') {
        document.documentElement.setAttribute('data-contrast', 'high');
      }
    }
  } catch {
    /* noop */
  }
})();
