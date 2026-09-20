// Constants
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
const BEACON_ID = 'cv-cf-beacon';

export function loadAnalyticsBeacon(): void {
  const token = import.meta.env.VITE_CF_BEACON_TOKEN;
  if (!token) return;
  if (document.getElementById(BEACON_ID)) return;

  const script = document.createElement('script');
  script.id = BEACON_ID;
  script.src = BEACON_SRC;
  script.defer = true;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(script);
}
