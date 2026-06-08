// Registers the test-time alias resolve hook on the main thread via the stable
// `module.register` API, then lets the test run proceed. Wired into the `test`
// script with `node --import ./scripts/register-test-aliases.mjs`.
//
// We use `module.register` (stable) rather than the deprecated
// `--experimental-loader` flag so this keeps working on Node 22 and 24.

import { register } from 'node:module';

// Stub for Vite's `import.meta.env` (rewritten to `globalThis.__VITE_TEST_ENV__`
// by the load hook). DEV=true keeps logger.ts behaviour deterministic in tests;
// extend this object if a test needs another VITE_ var.
globalThis.__VITE_TEST_ENV__ = { DEV: true, PROD: false, MODE: 'test' };

// Minimal DOM-event environment. The source dispatches CustomEvents on `window`
// (e.g. emitSyncTruncation -> window.dispatchEvent), and tests subscribe via
// globalThis.addEventListener. Node has EventTarget/CustomEvent globals but
// globalThis is not itself an EventTarget, so we delegate the three event
// methods to a backing EventTarget. This is environment setup, not a test stub.
if (typeof globalThis.addEventListener !== 'function') {
  const bus = new EventTarget();
  globalThis.addEventListener = bus.addEventListener.bind(bus);
  globalThis.removeEventListener = bus.removeEventListener.bind(bus);
  globalThis.dispatchEvent = bus.dispatchEvent.bind(bus);
}

register('./test-alias-loader.mjs', import.meta.url);
