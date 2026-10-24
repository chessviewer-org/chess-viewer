if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(registrations.map((entry) => entry.unregister()))
    )
    .catch(() => {});
}
