(function () {
  const prerenderedRoute = document.documentElement.getAttribute(
    'data-prerendered-route'
  );
  if (!prerenderedRoute) return;

  function normalize(path) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  if (normalize(prerenderedRoute) !== normalize(window.location.pathname)) {
    document.documentElement.classList.add('route-mismatch');
  }
})();
