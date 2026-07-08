import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

const ALIASES = [
  { prefix: '@/', dir: 'src' },
  { prefix: '@shared/', dir: 'src/shared' },
  { prefix: '@components/', dir: 'src/components' },
  { prefix: '@pages/', dir: 'src/pages' },
  { prefix: '@contexts/', dir: 'src/shared/contexts', bare: '@contexts' },
  { prefix: '@hooks/', dir: 'src/shared/hooks', bare: '@hooks' },
  { prefix: '@utils/', dir: 'src/shared/utils', bare: '@utils' },
  { prefix: '@constants/', dir: 'src/shared/constants', bare: '@constants' },
  { prefix: '@app-types/', dir: 'src/shared/types', bare: '@app-types' }
];

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'];

function resolveFile(absPath) {
  if (existsSync(absPath) && statSync(absPath).isFile()) {
    return absPath;
  }
  for (const ext of EXTENSIONS) {
    const withExt = `${absPath}${ext}`;
    if (existsSync(withExt) && statSync(withExt).isFile()) {
      return withExt;
    }
  }
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

  const relative = resolveRelative(specifier, context);
  if (relative !== null) {
    return {
      url: pathToFileURL(relative).href,
      shortCircuit: true
    };
  }

  return nextResolve(specifier, context);
}

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
      verbatimModuleSyntax: false,
      isolatedModules: true,
      jsx: url.endsWith('.tsx') ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
      jsxImportSource: 'react'
    },
    fileName: filePath
  });

  return {
    format: 'module',
    source: outputText.replaceAll(
      'import.meta.env',
      'globalThis.__VITE_TEST_ENV__'
    ),
    shortCircuit: true
  };
}
