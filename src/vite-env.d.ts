/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Typed client env vars. Read these with DOT notation only
// (`import.meta.env.VITE_SUPABASE_URL`) — Vite statically inlines dot access at
// build time; bracket access is NOT replaced and resolves to undefined in
// production. All VITE_-prefixed vars ship to the browser, so they are public.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  requestIdleCallback?: (callback: () => void) => number;
}

// Side-effect CSS import for the self-hosted Inter font. @fontsource-variable
// ships only a stylesheet (no JS / types), so declare the bare specifier to let
// `import '@fontsource-variable/inter'` (src/index.tsx) type-check under strict
// module resolution.
declare module '@fontsource-variable/inter';
