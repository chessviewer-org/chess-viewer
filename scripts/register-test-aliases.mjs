import { register } from 'node:module';

globalThis.__VITE_TEST_ENV__ = { DEV: true, PROD: false, MODE: 'test' };

if (typeof globalThis.addEventListener !== 'function') {
  const bus = new EventTarget();
  globalThis.addEventListener = bus.addEventListener.bind(bus);
  globalThis.removeEventListener = bus.removeEventListener.bind(bus);
  globalThis.dispatchEvent = bus.dispatchEvent.bind(bus);
}

register('./test-alias-loader.mjs', import.meta.url);
