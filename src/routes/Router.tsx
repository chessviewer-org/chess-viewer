import { ReactNode, Suspense } from 'react';

import type { Transition } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';

import {
  AboutPage,
  AdvancedFENInputPage,
  DownloadPage,
  FENHistoryPage,
  HomePage,
  NotFoundPage,
  SettingsPage,
  SupportPage
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
          <div className="absolute inset-0 rounded-2xl border-4 border-accent/20" />
          <div className="absolute inset-0 rounded-2xl border-4 border-accent border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-xl bg-linear-to-br from-accent/10 to-accent/5 flex items-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-accent/30 animate-pulse" />
          </div>
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
            path="/download"
            element={
              <AnimatedPage>
                <DownloadPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/support"
            element={
              <AnimatedPage>
                <SupportPage />
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
