import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { Navbar } from '@/components/layout';
import { ErrorBoundary } from '@/components/ui';
import { FENBatchProvider, ThemeSettingsProvider } from '@/contexts';
import Routes from '@/routes/Router';
import { logger } from '@/utils/logger';
import { useSecurityCheck } from '@/features/auth/useSecurityCheck';
import { SecurityLockModal } from '@/features/auth/SecurityLockModal';

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
    VALID_THEMES.has(window.__INITIAL_THEME__)
  ) {
    return window.__INITIAL_THEME__ as Theme;
  }

  try {
    const saved = localStorage.getItem('chess-theme');
    if (saved && VALID_THEMES.has(saved)) {
      return saved as Theme;
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
  const { isLocked, unlock } = useSecurityCheck();

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
      <ThemeSettingsProvider>
        <FENBatchProvider>
          <div className="h-dvh flex flex-col overflow-hidden bg-gradient-to-br from-bg-gradient-start to-bg-gradient-end text-[clamp(0.9375rem,0.25vw+0.875rem,1rem)] transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-accent focus:text-bg focus:rounded-xl focus:shadow-glow focus:font-semibold"
            >
              Skip to main content
            </a>

            {!isToolPage && <Navbar theme={theme} toggleTheme={toggleTheme} />}

            <main
              id="main-content"
              tabIndex={-1}
              className={`flex-1 min-h-0 overflow-x-hidden focus:outline-none ${!isToolPage ? 'mt-12' : ''}`}
            >
              {isLocked && <SecurityLockModal onUnlock={unlock} />}
              <Routes />
            </main>
          </div>
        </FENBatchProvider>
      </ThemeSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
