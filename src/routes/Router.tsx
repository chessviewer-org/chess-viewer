import { lazy, ReactNode, Suspense } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/HomePage/HomePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const DownloadPage = lazy(() => import('@/pages/DownloadPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const FENHistoryPage = lazy(
  () => import('@/pages/FENHistoryPage/FENHistoryPage')
);
const AdvancedFENInputPage = lazy(
  () => import('@/pages/AdvancedFENInputPage/AdvancedFENInputPage')
);

import type { Transition } from 'framer-motion';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
  } as Transition
};

/** Suspense fallback spinner displayed while lazy page chunks load. */
function PageLoader() {
  return (
    <div
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
    </div>
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
