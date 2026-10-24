import { useSyncExternalStore } from 'react';
import type { AroundNavHandler, BaseLocationHook } from 'wouter';
import { navigate } from 'wouter/use-browser-location';

import { suppressTransitionsUntilPainted } from '@/shared/utils/viewTransition';
import { navigateWithTransition } from './navigation';
import { pageModule } from './pageModule';

const pages = {
  '/': pageModule(() => import('@/pages/HomePage/HomePage')),
  '/fairy-chess': pageModule(
    () => import('@/pages/FairyChessPage/FairyChessPage')
  ),
  '/about': pageModule(() => import('@/pages/AboutPage/AboutPage')),
  '/export': pageModule(() => import('@/pages/ExportPage/ExportPage')),
  '/settings': pageModule(() => import('@/pages/SettingsPage/SettingsPage')),
  '/fen-history': pageModule(
    () => import('@/pages/FENHistoryPage/FENHistoryPage')
  ),
  '/advanced-fen': pageModule(
    () => import('@/pages/AdvancedFENInputPage/AdvancedFENInputPage')
  ),
  '/latex': pageModule(() => import('@/pages/LatexPage/LatexPage')),
  '/auth/sign-in': pageModule(() => import('@/pages/AuthPages/SignInPage')),
  '/auth/sign-up': pageModule(() => import('@/pages/AuthPages/SignUpPage')),
  '/auth/forgot-password': pageModule(
    () => import('@/pages/AuthPages/ForgotPasswordPage')
  ),
  '/auth/mfa': pageModule(() => import('@/pages/AuthPages/MfaChallengePage'))
};
const notFound = pageModule(() => import('@/pages/NotFoundPage'));

export const HomePage = pages['/'].Component;
export const FairyChessPage = pages['/fairy-chess'].Component;
export const AboutPage = pages['/about'].Component;
export const ExportPage = pages['/export'].Component;
export const SettingsPage = pages['/settings'].Component;
export const FENHistoryPage = pages['/fen-history'].Component;
export const AdvancedFENInputPage = pages['/advanced-fen'].Component;
export const LatexPage = pages['/latex'].Component;
export const SignInPage = pages['/auth/sign-in'].Component;
export const SignUpPage = pages['/auth/sign-up'].Component;
export const ForgotPasswordPage = pages['/auth/forgot-password'].Component;
export const MfaChallengePage = pages['/auth/mfa'].Component;
export const NotFoundPage = notFound.Component;

function pageFor(path: string) {
  return pages[path as keyof typeof pages] ?? notFound;
}

export function preloadPage(path: string): Promise<void> {
  return pageFor(path).load();
}

const LOCATION_EVENTS = ['popstate', 'pushState', 'replaceState', 'hashchange'];
const locationListeners = new Set<() => void>();
let shownPath = window.location.pathname;
let pendingPath = shownPath;

function showLoadedPath() {
  const path = window.location.pathname;
  if (path === pendingPath) return;
  pendingPath = path;
  const show = () => {
    if (pendingPath !== path) return;
    shownPath = path;
    locationListeners.forEach((listener) => listener());
  };
  if (pageFor(path).isLoaded()) show();
  else
    void preloadPage(path)
      .catch(() => {})
      .then(show);
}

function subscribeToLoadedPath(listener: () => void) {
  if (!locationListeners.size)
    LOCATION_EVENTS.forEach((event) => addEventListener(event, showLoadedPath));
  locationListeners.add(listener);
  showLoadedPath();
  return () => {
    locationListeners.delete(listener);
    if (!locationListeners.size)
      LOCATION_EVENTS.forEach((event) =>
        removeEventListener(event, showLoadedPath)
      );
  };
}

export const useLoadedLocation: BaseLocationHook = () => [
  useSyncExternalStore(subscribeToLoadedPath, () => shownPath),
  navigate
];

export function prefetchPages(): void {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (
    navigator.webdriver ||
    connection?.saveData ||
    /2g/.test(connection?.effectiveType ?? '')
  )
    return;
  void Object.keys(pages).reduce(
    (previous, path) => previous.then(() => preloadPage(path)).catch(() => {}),
    Promise.resolve()
  );
}

export function prefetchOnIntent(event: Event): void {
  const link =
    event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!(link instanceof HTMLAnchorElement) || link.origin !== location.origin)
    return;
  void preloadPage(link.pathname).catch(() => {});
}

let navigationId = 0;
export const navigateWithLoadedPage: AroundNavHandler = (
  navigate,
  to,
  options
) => {
  const id = ++navigationId;
  const origin = window.location.href;
  suppressTransitionsUntilPainted();
  const path = new URL(to, window.location.href).pathname;
  // Keep the current page visible while the destination's JS and CSS load.
  void preloadPage(path)
    .catch(() => {})
    .then(() => {
      if (id === navigationId && window.location.href === origin)
        navigateWithTransition(navigate, to, options);
    });
};
