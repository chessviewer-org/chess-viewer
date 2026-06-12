/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  requestIdleCallback?: (callback: () => void) => number;
}
