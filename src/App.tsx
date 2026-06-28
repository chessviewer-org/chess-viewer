import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { Navbar, useNavbarState } from '@/components/layout';
import { useAuth, useSecurityCheck } from '@/features/auth';
import Routes from '@/routes/Router';
import { FENBatchProvider, ModalProvider } from '@contexts';
import {
  useColorVision,
  useContrast,
  usePageScrollKeys,
  useReducedMotionPreference,
  useThemeModeSync
} from '@hooks';

import {
  isFollowingSystem,
  readReducedMotionPreference,
  readThemeModePreference,
  resolveReducedMotion,
  resolveThemeMode,
  systemThemeMode,
  THEME_MODE_CHANGE_EVENT,
  type ThemeMode
} from '@utils';
import { ErrorBoundary } from '@shared/ui';

/** Lazy-loaded: only needed when an authenticated user hits the 90-day lock. */
const SecurityLockModal = lazy(() =>
  import('@/features/auth/components/SecurityLockModal').then((m) => ({
    default: m.SecurityLockModal
  }))
);

declare global {
  interface Window {
    __INITIAL_THEME__?: string;
  }
}

function isTheme(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

/**
 * Resolves the initial mode for first paint.
 * Priority: boot-script value > stored manual override > system preference.
 *
 * @returns The concrete 'light' | 'dark' to apply
 */
function getInitialTheme(): ThemeMode {
  if (
    typeof window !== 'undefined' &&
    typeof window.__INITIAL_THEME__ === 'string' &&
    isTheme(window.__INITIAL_THEME__)
  ) {
    return window.__INITIAL_THEME__;
  }

  return resolveThemeMode(readThemeModePreference());
}

/**
 * Whether the Telegram-style circular reveal should run for a theme flip.
 * False for browsers without the View Transitions API and when the user has
 * `prefers-reduced-motion: reduce` (the CSS no-ops it too, but we skip the API
 * call entirely for those cases).
 *
 * @returns Whether to animate the next theme change
 */
function canAnimateThemeReveal(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !resolveReducedMotion(readReducedMotionPreference())
  );
}

/**
 * Seeds the CSS reveal vars so the circle ORIGINATES at the TOP-RIGHT corner
 * and grows toward the BOTTOM-LEFT, covering the full diagonal. The CSS
 * keyframe `theme-circular-reveal` animates the clip-path radius from 0 to
 * `--theme-reveal-radius`, so we feed it the corner-to-corner distance. We also
 * set `data-theme-transition` so the per-direction duration/ease overrides
 * (`to-dark` / `to-light`) apply.
 *
 * @param next - The concrete theme being applied (drives the direction attr)
 */
function primeThemeReveal(next: ThemeMode): void {
  const root = document.documentElement;
  const x = window.innerWidth;
  const y = 0;
  // Distance from the top-right origin to the bottom-left corner.
  const radius = Math.hypot(window.innerWidth, window.innerHeight);
  root.style.setProperty('--theme-reveal-x', `${x}px`);
  root.style.setProperty('--theme-reveal-y', `${y}px`);
  root.style.setProperty('--theme-reveal-radius', `${radius}px`);
  root.setAttribute('data-theme-transition', `to-${next}`);
}

/**
 * Main application component.
 * Handles theme management, routing, and layout structure.
 *
 * @returns Application root
 */
function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  // Latest concrete theme, read synchronously inside event handlers to decide
  // whether a change is a real flip (worth animating) without re-subscribing.
  const themeRef = useRef<ThemeMode>(theme);
  themeRef.current = theme;
  const { isAuthenticated } = useAuth();
  const { isLocked, isLoading: isSecurityLoading, unlock } = useSecurityCheck();

  // App-wide keyboard scrolling (Arrow / Page / Home / End) on EVERY route, not
  // just the board editor, so the site is operable without a mouse. The board
  // grid opts out of arrow hijacking via `data-arrow-keys="self"`. WCAG 2.1.1.
  usePageScrollKeys();

  // App is the single owner of `data-theme`. The Appearance settings expose a
  // Light / Dark / System control (see `useThemeMode`). Every choice is
  // persisted (`cv_theme_mode`) + cloud-synced as an EXPLICIT value; the default
  // for a fresh user (nothing stored) is DARK, not the OS. 'System' is stored
  // literally and makes the `prefers-color-scheme` listener below track the OS.
  // We re-resolve on `THEME_MODE_CHANGE_EVENT` (same-tab live change) and
  // `storage` (other tabs), and hydrate the synced preference once via
  // `useThemeModeSync`.
  useThemeModeSync();

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Applies the next concrete theme. When it is a real flip from the current
  // `data-theme`, run the Telegram-style circular reveal (top-right → bottom-
  // left) via the View Transitions API; otherwise just set state. Falls back to
  // a plain `setTheme` when the API is unavailable or reduced-motion is on.
  const applyTheme = useCallback((next: ThemeMode) => {
    if (next === themeRef.current) return;
    if (!canAnimateThemeReveal()) {
      setTheme(next);
      return;
    }
    primeThemeReveal(next);
    const transition = document.startViewTransition(() => setTheme(next));
    transition.finished.finally(() => {
      document.documentElement.removeAttribute('data-theme-transition');
    });
  }, []);

  // React to a manual mode change (this tab via the event, other tabs via
  // `storage`): re-resolve the effective mode from the stored preference. With
  // no stored preference the default is DARK (see `readThemeModePreference`).
  useEffect(() => {
    const onChange = () =>
      applyTheme(resolveThemeMode(readThemeModePreference()));
    window.addEventListener(THEME_MODE_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(THEME_MODE_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [applyTheme]);

  // Fade out and remove the first-paint splash (index.html) now that the app
  // tree is mounted and interactive. Runs once.
  useEffect(() => {
    document.documentElement.classList.add('app-ready');
    const splash = document.getElementById('app-splash');
    if (!splash) return;
    const remove = () => splash.remove();
    const timer = window.setTimeout(remove, 400);
    splash.addEventListener('transitionend', remove, { once: true });
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleMediaChange() {
      // Only track the OS while the user explicitly chose 'system'. (No stored
      // preference now means DARK, not OS — so absence is NOT "follow OS".)
      if (isFollowingSystem()) {
        applyTheme(systemThemeMode());
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [applyTheme]);

  // Apply the saved contrast preference (`data-contrast`) and hydrate it from
  // cloud sync for a freshly signed-in device.
  useContrast();

  // Apply the saved color vision (CVD) simulation filter and hydrate from sync.
  useColorVision();

  // Apply the reduced-motion override (`data-reduced-motion`) and hydrate from
  // sync. `system` defers to the OS `prefers-reduced-motion` setting.
  useReducedMotionPreference();

  const { openAuthModal, ...navState } = useNavbarState();

  return (
    <ErrorBoundary>
      <FENBatchProvider>
        <ModalProvider openAuthModal={openAuthModal}>
          <div className="isolate-root shell-safe-area min-h-dvh lg:h-screen lg:overflow-hidden flex flex-col bg-linear-to-br from-bg-gradient-start to-bg-gradient-end text-fluid-base transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <a
              href="#main-content"
              className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-100 focus-visible:px-6 focus-visible:py-3 focus-visible:bg-accent focus-visible:text-bg focus-visible:rounded-xl focus-visible:shadow-lg focus-visible:font-semibold"
            >
              Skip to main content
            </a>

            <Navbar {...navState} />

            <main
              id="main-content"
              tabIndex={-1}
              className="main-content-offset lg:overscroll-trap flex-1 min-h-0 w-full min-w-0 max-w-full overflow-visible lg:overflow-x-hidden lg:overflow-y-auto focus:outline-none"
            >
              {/* Routes always render immediately for guests. For authenticated
                  users we wait for the security check so locked content is never
                  momentarily shown. Guests resolve instantly (no network call)
                  because useSecurityCheck reads getSession() from local storage. */}
              {isAuthenticated && isSecurityLoading ? null : isAuthenticated &&
                isLocked ? (
                <Suspense fallback={null}>
                  <SecurityLockModal onUnlock={unlock} />
                </Suspense>
              ) : (
                <Routes />
              )}
            </main>
          </div>
        </ModalProvider>
      </FENBatchProvider>
    </ErrorBoundary>
  );
}

export default App;
