/// <reference types="vite/client" />

interface Window {
  requestIdleCallback?: (callback: () => void) => number;
}
