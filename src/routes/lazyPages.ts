import { lazy } from 'react';

import { prefetchByPath } from './prefetchRegistry';

/**
 * Single source of truth for lazily-loaded page chunks.
 *
 * Each page is paired with the raw dynamic-import factory so the SAME factory
 * can be reused for hover/focus prefetching (see `prefetchByPath` and
 * `usePrefetchRoute`). Calling the factory ahead of navigation warms Vite's
 * module cache; the click-time import then resolves instantly.
 */

const homeImport = () => import('@/pages/HomePage/HomePage');
const aboutImport = () => import('@/pages/AboutPage/AboutPage');
const exportImport = () => import('@/pages/ExportPage/ExportPage');
const settingsImport = () => import('@/pages/SettingsPage/SettingsPage');
const fenHistoryImport = () => import('@/pages/FENHistoryPage/FENHistoryPage');
const advancedFenImport = () =>
  import('@/pages/AdvancedFENInputPage/AdvancedFENInputPage');
const notFoundImport = () => import('@/pages/NotFoundPage/NotFoundPage');

export const HomePage = lazy(homeImport);
export const AboutPage = lazy(aboutImport);
export const ExportPage = lazy(exportImport);
export const SettingsPage = lazy(settingsImport);
export const FENHistoryPage = lazy(fenHistoryImport);
export const AdvancedFENInputPage = lazy(advancedFenImport);
export const NotFoundPage = lazy(notFoundImport);

/**
 * Maps a route pathname to its chunk-prefetch factory. Query strings are
 * ignored by the prefetch hook, so `/settings?tab=data` resolves to `/settings`.
 */
Object.assign(prefetchByPath, {
  '/': homeImport,
  '/about': aboutImport,
  '/export': exportImport,
  '/settings': settingsImport,
  '/fen-history': fenHistoryImport,
  '/advanced-fen': advancedFenImport
});
