// Test-time module loader for node:test (--experimental-strip-types).
//
// Why this exists — two gaps between the source's bundler-style TypeScript and
// Node's native ESM/strip-types loader, both of which only tsc and Vite bridge:
//
//   1. ALIASES: Node's resolver does not understand the TS `paths` aliases
//      (`@/`, `@utils`, `@constants`, ...), nor the extensionless relative
//      imports the source uses (`./logger`). The `resolve` hook maps those to
//      real `src/...` files.
//
//   2. TYPE-ONLY IMPORTS IN VALUE POSITION: several modules import a type with a
//      plain `import { X }` (not `import type { X }`), e.g. types/index.ts and
//      chessConstants.ts. `--experimental-strip-types` only erases annotations;
//      it leaves such imports intact, so Node then fails to find a runtime
//      export named `X`. The `load` hook transpiles `.ts`/`.tsx` source with the
//      TypeScript compiler, which correctly elides type-only imports/exports.
//
// This is TEST-TIME ONLY. Production resolution and type erasure still come from
// tsconfig `paths` + Vite/tsc; this file mirrors the alias map (see ALIASES)
// without modifying any production config or source.
//
// Mechanism: registered via `module.register(...)` from ./register-test-aliases.mjs,
// wired into the `test` script with `--import`. We export `resolve` + `load`
// hooks per the stable Node ESM loader API (no deprecated --experimental-loader).

import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

// Complete alias map, mirroring tsconfig.json `paths` + vite.config.js.
// Each entry maps an alias root to a directory under the project root.
//   - Bare-barrel aliases (no trailing slash) also resolve the alias used as a
//     whole specifier (e.g. `@utils` -> src/shared/utils/index.ts).
//   - Slash aliases resolve `@root/sub` -> <dir>/sub (+ extension resolution).
const ALIASES = [
  { prefix: '@/', dir: 'src' },
  { prefix: '@shared/', dir: 'src/shared' },
  { prefix: '@components/', dir: 'src/components' },
  { prefix: '@pages/', dir: 'src/pages' },
  { prefix: '@contexts/', dir: 'src/contexts' },
  { prefix: '@hooks/', dir: 'src/shared/hooks', bare: '@hooks' },
  { prefix: '@utils/', dir: 'src/shared/utils', bare: '@utils' },
  { prefix: '@constants/', dir: 'src/shared/constants', bare: '@constants' },
  { prefix: '@app-types/', dir: 'src/shared/types', bare: '@app-types' }
];

// Extensions to try when an aliased specifier has no explicit file extension,
// matching vite.config.js `resolve.extensions` (TS first).
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'];

/**
 * Turn an absolute path that may omit its extension or point at a directory
 * into a concrete file path. Returns null if nothing exists.
 * @param {string} absPath
 * @returns {string | null}
 */
function resolveFile(absPath) {
  // Exact file (already has a valid extension).
  if (existsSync(absPath) && statSync(absPath).isFile()) {
    return absPath;
  }
  // Try appending each known extension: `@utils/logger` -> `.../logger.ts`.
  for (const ext of EXTENSIONS) {
    const withExt = `${absPath}${ext}`;
    if (existsSync(withExt) && statSync(withExt).isFile()) {
      return withExt;
    }
  }
  // Directory import: resolve to its index file (`@constants` -> index.ts).
  if (existsSync(absPath) && statSync(absPath).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const indexFile = `${absPath}/index${ext}`;
      if (existsSync(indexFile) && statSync(indexFile).isFile()) {
        return indexFile;
      }
    }
  }
  return null;
}

/**
 * Map an alias specifier to an absolute path under the project root, or null
 * if the specifier is not a project alias (so it passes through to Node).
 * @param {string} specifier
 * @returns {string | null}
 */
function mapAlias(specifier) {
  for (const alias of ALIASES) {
    // Bare-barrel form used as a whole: `@utils`, `@constants`, etc.
    if (alias.bare && specifier === alias.bare) {
      return `${projectRoot}${alias.dir}`;
    }
    // Slash form: `@/features/...`, `@utils/logger`, etc.
    if (specifier.startsWith(alias.prefix)) {
      const rest = specifier.slice(alias.prefix.length);
      return `${projectRoot}${alias.dir}/${rest}`;
    }
  }
  return null;
}

/**
 * Resolve an extensionless RELATIVE specifier (e.g. `./logger`) against the
 * importing module, appending a TS/JS extension or an index file. The source
 * uses bundler-style extensionless imports that tsc/Vite accept but Node's
 * strict ESM resolver rejects; this mirrors that resolution at test time
 * without rewriting source files. Returns null if it is not a resolvable
 * relative specifier.
 * @param {string} specifier
 * @param {import('node:module').ResolveHookContext} context
 * @returns {string | null}
 */
function resolveRelative(specifier, context) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return null;
  }
  const parent = context.parentURL;
  if (parent === undefined || !parent.startsWith('file:')) {
    return null;
  }
  const absPath = fileURLToPath(new URL(specifier, parent));
  return resolveFile(absPath);
}

/**
 * Node ESM resolve hook. Rewrites project aliases to real file URLs and adds
 * extension resolution for extensionless relative imports; defers everything
 * else (node: builtins, real npm packages such as `@supabase/supabase-js`,
 * already-resolvable specifiers) to the default resolver.
 * @param {string} specifier
 * @param {import('node:module').ResolveHookContext} context
 * @param {(s: string, c: import('node:module').ResolveHookContext) => unknown} nextResolve
 */
export function resolve(specifier, context, nextResolve) {
  const mapped = mapAlias(specifier);
  if (mapped !== null) {
    const file = resolveFile(mapped);
    if (file !== null) {
      return {
        url: pathToFileURL(file).href,
        shortCircuit: true
      };
    }
  }

  // Resolve extensionless relative imports ourselves. Node's default resolver
  // would return an extensionless URL that fails later in `finalizeResolution`,
  // so we must add the extension up front rather than catch a throw.
  const relative = resolveRelative(specifier, context);
  if (relative !== null) {
    return {
      url: pathToFileURL(relative).href,
      shortCircuit: true
    };
  }

  return nextResolve(specifier, context);
}

/**
 * Node ESM load hook. Transpiles project `.ts`/`.tsx` files via the TypeScript
 * compiler so type-only imports written in value position are elided (something
 * `--experimental-strip-types` does not do). All other modules — node:builtins,
 * node_modules, plain `.js` — are handed back to the default loader untouched.
 * @param {string} url
 * @param {import('node:module').LoadHookContext} context
 * @param {(u: string, c: import('node:module').LoadHookContext) => unknown} nextLoad
 */
export function load(url, context, nextLoad) {
  const isProjectTs =
    url.startsWith('file:') &&
    (url.endsWith('.ts') || url.endsWith('.tsx') || url.endsWith('.mts')) &&
    !url.includes('/node_modules/');

  if (!isProjectTs) {
    return nextLoad(url, context);
  }

  const filePath = fileURLToPath(url);
  const source = readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      // Keep import/export statements as written (minus elided type-only ones)
      // so the resolve hook still sees the original specifiers.
      verbatimModuleSyntax: false,
      isolatedModules: true,
      jsx: url.endsWith('.tsx') ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
      jsxImportSource: 'react'
    },
    fileName: filePath
  });

  return {
    format: 'module',
    // `import.meta.env` is a Vite build-time global that does not exist in raw
    // Node. Point it at a global stub (set by register-test-aliases.mjs) so
    // modules like logger.ts that read `import.meta.env.DEV` don't throw at
    // load time. This is a test-runtime shim only — production keeps Vite's env.
    source: outputText.replaceAll(
      'import.meta.env',
      'globalThis.__VITE_TEST_ENV__'
    ),
    shortCircuit: true
  };
}
