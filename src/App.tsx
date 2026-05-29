import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { Navbar } from '@/components/layout';
import { ErrorBoundary } from '@shared/ui';
import { FENBatchProvider } from '@/contexts/FENBatchContext';
import { ModalProvider } from '@/contexts/ModalContext';
import Routes from '@/routes/Router';
import { logger } from '@utils/logger';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSecurityCheck } from '@/features/auth/hooks/useSecurityCheck';

/** Lazy-loaded: only needed when an authenticated user hits the 90-day lock. */
const SecurityLockModal = lazy(() =>
  import('@/features/auth/components/SecurityLockModal').then((m) => ({
    default: m.SecurityLockModal,
  })),
);

declare global {
  interface Window {
    __INITIAL_THEME__?: string;
  }
}

/**
 * Tool pages where navbar should be hidden for distraction-free experience.
 */
const TOOL_PAGES: string[] = ['/settings', '/fen-history', '/advanced-fen'];

const VALID_THEMES = new Set<string>(['light', 'dark']);

type Theme = 'light' | 'dark';

function isTheme(value: string): value is Theme {
  return VALID_THEMES.has(value);
}

const THEME_REVEAL_DEFAULT_OFFSET = 24;

/**
 * Sets CSS variables for circular reveal animation.
 *
 * @param x - Reveal origin X in viewport
 * @param y - Reveal origin Y in viewport
 */
function setThemeRevealVars(x: number, y: number): void {
  const clampedX = Math.min(Math.max(x, 0), window.innerWidth);
  const clampedY = Math.min(Math.max(y, 0), window.innerHeight);
  const maxDx = Math.max(clampedX, window.innerWidth - clampedX);
  const maxDy = Math.max(clampedY, window.innerHeight - clampedY);
  const radius = Math.hypot(maxDx, maxDy);

  document.documentElement.style.setProperty(
    '--theme-reveal-x',
    `${clampedX}px`
  );
  document.documentElement.style.setProperty(
    '--theme-reveal-y',
    `${clampedY}px`
  );
  document.documentElement.style.setProperty(
    '--theme-reveal-radius',
    `${radius}px`
  );
}

/**
 * Retrieves the initial theme from various sources.
 * Priority: window variable > localStorage > system preference.
 *
 * @returns Theme value
 */
function getInitialTheme(): Theme {
  if (
    typeof window !== 'undefined' &&
    typeof window.__INITIAL_THEME__ === 'string' &&
    isTheme(window.__INITIAL_THEME__)
  ) {
    return window.__INITIAL_THEME__;
  }

  try {
    const saved = localStorage.getItem('chess-theme');
    if (saved && isTheme(saved)) {
      return saved;
    }
  } catch (error) {
    logger.warn('localStorage access blocked:', error);
  }

  const prefersDark = window.matchMedia?.(
    '(prefers-color-scheme: dark)'
  ).matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Saves theme to localStorage safely.
 *
 * @param theme - Theme value to save
 */
function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem('chess-theme', theme);
  } catch (error) {
    logger.warn('localStorage access blocked:', error);
  }
}

/**
 * Main application component.
 * Handles theme management, routing, and layout structure.
 *
 * @returns Application root
 */
function App() {
  const location = useLocation();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const { isAuthenticated } = useAuth();
  const { isLocked, isLoading, unlock } = useSecurityCheck();

  const isToolPage = TOOL_PAGES.includes(location.pathname);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleMediaChange(event: MediaQueryListEvent) {
      try {
        const manualOverride = localStorage.getItem('chess-theme');
        if (!manualOverride) {
          setTheme(event.matches ? 'dark' : 'light');
        }
      } catch (error) {
        logger.warn('localStorage access blocked:', error);
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const toggleTheme = useCallback(
    (event?: React.SyntheticEvent | Event) => {
      const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
      const prefersReducedMotion = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      let revealX = window.innerWidth - THEME_REVEAL_DEFAULT_OFFSET;
      let revealY = THEME_REVEAL_DEFAULT_OFFSET;

      if (event?.currentTarget instanceof Element) {
        const rect = event.currentTarget.getBoundingClientRect();
        revealX = rect.left + rect.width / 2;
        revealY = rect.top + rect.height / 2;
      }

      setThemeRevealVars(revealX, revealY);

      const startViewTransition = document.startViewTransition?.bind(document);
      if (!startViewTransition || prefersReducedMotion) {
        setTheme(nextTheme);
        return;
      }

      const transitionDirection =
        nextTheme === 'light' ? 'to-light' : 'to-dark';
      document.documentElement.setAttribute(
        'data-theme-transition',
        transitionDirection
      );

      const transition = startViewTransition(() => {
        setTheme(nextTheme);
      });

      transition.finished.finally(() => {
        document.documentElement.removeAttribute('data-theme-transition');
      });
    },
    [theme]
  );

  return (
    <ErrorBoundary>
      <FENBatchProvider>
        <ModalProvider>
            <div className="min-h-dvh sm:h-dvh flex flex-col sm:overflow-hidden bg-linear-to-br from-bg-gradient-start to-bg-gradient-end text-[clamp(0.9375rem,0.25vw+0.875rem,1rem)] transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-6 focus:py-3 focus:bg-accent focus:text-bg focus:rounded-xl focus:shadow-lg focus:font-semibold"
            >
              Skip to main content
            </a>

            {!isToolPage && <Navbar theme={theme} toggleTheme={toggleTheme} />}

            <main
              id="main-content"
              tabIndex={-1}
              className={`flex-1 min-h-0 sm:overflow-x-hidden sm:overflow-y-auto focus:outline-none ${!isToolPage ? 'mt-12' : ''}`}
            >
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
                </div>
              ) : (
                <>
                  {isAuthenticated && isLocked && (
                    <Suspense fallback={null}>
                      <SecurityLockModal onUnlock={unlock} />
                    </Suspense>
                  )}
                  <Routes />
                </>
              )}
            </main>
          </div>
        </ModalProvider>
      </FENBatchProvider>
    </ErrorBoundary>
  );
}

export default App;
