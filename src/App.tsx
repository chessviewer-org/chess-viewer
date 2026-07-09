import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { Navbar, useNavbarState } from '@/components/layout';
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
import { ErrorBoundary } from '@ui';

declare global {
  interface Window {
    __INITIAL_THEME__?: string;
  }
}

function isTheme(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

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

function canAnimateThemeReveal(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !resolveReducedMotion(readReducedMotionPreference())
  );
}

function primeThemeReveal(next: ThemeMode): void {
  const root = document.documentElement;
  const x = window.innerWidth;
  const y = 0;
  const radius = Math.hypot(window.innerWidth, window.innerHeight);
  root.style.setProperty('--theme-reveal-x', `${x}px`);
  root.style.setProperty('--theme-reveal-y', `${y}px`);
  root.style.setProperty('--theme-reveal-radius', `${radius}px`);
  root.setAttribute('data-theme-transition', `to-${next}`);
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const themeRef = useRef<ThemeMode>(theme);
  themeRef.current = theme;

  usePageScrollKeys();

  useThemeModeSync();

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      if (isFollowingSystem()) {
        applyTheme(systemThemeMode());
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [applyTheme]);

  useContrast();

  useColorVision();

  useReducedMotionPreference();

  const { openAuthModal, ...navState } = useNavbarState();

  return (
    <ErrorBoundary>
      <FENBatchProvider>
        <ModalProvider openAuthModal={openAuthModal}>
          <div className="isolate-root shell-safe-area min-h-dvh lg:h-screen lg:overflow-hidden flex flex-col bg-bg text-fluid-base transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
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
              <Routes />
            </main>
          </div>
        </ModalProvider>
      </FENBatchProvider>
    </ErrorBoundary>
  );
}

export default App;
