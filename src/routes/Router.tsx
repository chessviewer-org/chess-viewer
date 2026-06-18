import { ReactNode, Suspense } from 'react';

import type { Transition } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';

import {
  AboutPage,
  AdvancedFENInputPage,
  FENHistoryPage,
  HomePage,
  NotFoundPage,
  SettingsPage
} from '@/routes/lazyPages';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
  } as Transition
};

/**
 * Suspense fallback shown while a lazy page chunk loads.
 *
 * Uses `min-h-[70vh]` to reserve vertical space so the swap to real page
 * content does not cause layout shift (CLS), and fades in via framer-motion
 * for a minimalist appearance.
 */
/**
 * Lichess-style brand loader: our own ChessVision logo silhouette sits faint in
 * the background while an accent-coloured copy "fills up" from the bottom (the
 * knight's base) to the top on a loop, via an animated clip rectangle.
 *
 * The logo paths are kept identical to src/assets/logo.svg — only the fill
 * source changes (faint base layer + accent layer clipped by the rising rect).
 */
function BrandLoaderLogo() {
  return (
    <svg
      viewBox="0 0 45 45"
      className="w-full h-full"
      role="img"
      aria-label="ChessVision"
    >
      <defs>
        <clipPath id="cv-loader-fill" clipPathUnits="userSpaceOnUse">
          {/* Rises from the bottom (y=45) upward, then resets — Lichess style. */}
          <motion.rect
            x="0"
            width="45"
            initial={{ y: 45, height: 0 }}
            animate={{ y: [45, 0, 0], height: [0, 45, 45] }}
            transition={{
              duration: 1.4,
              times: [0, 0.7, 1],
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.15
            }}
          />
        </clipPath>
        <g id="cv-loader-logo">
          <path
            d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </defs>

      {/* Faint, unfilled silhouette (the "empty" logo). */}
      <use
        href="#cv-loader-logo"
        className="text-accent/15"
        fill="currentColor"
      />
      {/* Accent fill, revealed bottom-up by the animated clip. */}
      <use
        href="#cv-loader-logo"
        className="text-accent"
        fill="currentColor"
        clipPath="url(#cv-loader-fill)"
      />
    </svg>
  );
}

function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="flex items-center justify-center min-h-[70vh]"
      role="status"
      aria-label="Loading page"
    >
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <BrandLoaderLogo />
        </div>
        <p className="text-text-secondary text-sm font-semibold tracking-wide">
          Loading...
        </p>
      </div>
    </motion.div>
  );
}

interface AnimatedPageProps {
  children: ReactNode;
}

function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

/**
 * Defines all client-side routes wrapped in a Suspense boundary.
 */
function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <HomePage />
              </AnimatedPage>
            }
          />
          <Route
            path="/about"
            element={
              <AnimatedPage>
                <AboutPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/settings"
            element={
              <AnimatedPage>
                <SettingsPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/fen-history"
            element={
              <AnimatedPage>
                <FENHistoryPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/advanced-fen"
            element={
              <AnimatedPage>
                <AdvancedFENInputPage />
              </AnimatedPage>
            }
          />
          <Route
            path="*"
            element={
              <AnimatedPage>
                <NotFoundPage />
              </AnimatedPage>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default AppRoutes;
