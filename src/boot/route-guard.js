(function () {
  const root = document.documentElement;
  const prerenderedRoute = root.getAttribute('data-prerendered-route');
  if (!prerenderedRoute) return;

  function normalize(path) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  function hasClientState() {
    try {
      return localStorage.length > 0 || sessionStorage.length > 0;
    } catch {
      return false;
    }
  }

  if (
    normalize(prerenderedRoute) !== normalize(window.location.pathname) ||
    hasClientState()
  ) {
    root.classList.add('prerender-stale');
  }
})();
