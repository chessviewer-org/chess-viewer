/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  requestIdleCallback?: (callback: () => void) => number;
}

// Side-effect CSS import for the self-hosted Inter font. @fontsource-variable
// ships only a stylesheet (no JS / types), so declare the bare specifier to let
// `import '@fontsource-variable/inter'` (src/index.tsx) type-check under strict
// module resolution.
declare module '@fontsource-variable/inter';
