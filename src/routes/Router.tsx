import { ReactNode, Suspense } from 'react';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants
} from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';

import {
  AboutPage,
  AdvancedFENInputPage,
  ExportPage,
  FENHistoryPage,
  ForgotPasswordPage,
  HomePage,
  MfaChallengePage,
  NotFoundPage,
  SettingsPage,
  SignInPage,
  SignUpPage
} from '@/routes/lazyPages';
import { useEffectiveReducedMotion } from '@hooks';

const EXPO_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

/**
 * Page-transition variants. The full motion slides + fades + softly scales the
 * incoming page (and pushes the outgoing one the other way) over ~0.4s with an
 * expo-out ease, so the route change reads as a deliberate transition rather
 * than an instant swap. The reduced-motion variant collapses to a quick fade.
 */
const pageVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: EXPO_OUT } as Transition
  },
  exit: {
    opacity: 0,
    y: -18,
    scale: 0.985,
    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] } as Transition
  }
};

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } as Transition },
  exit: { opacity: 0, transition: { duration: 0.1 } as Transition }
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
              duration: 0.9,
              times: [0, 0.7, 1],
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.3
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
      <div className="relative w-16 h-16">
        <BrandLoaderLogo />
      </div>
    </motion.div>
  );
}

interface AnimatedPageProps {
  children: ReactNode;
  reduced: boolean;
}

function AnimatedPage({ children, reduced }: AnimatedPageProps) {
  return (
    <motion.div
      variants={reduced ? reducedVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
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
  const reduced = useEffectiveReducedMotion();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedPage reduced={reduced}>
                <HomePage />
              </AnimatedPage>
            }
          />
          <Route
            path="/export"
            element={
              <AnimatedPage reduced={reduced}>
                <ExportPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/about"
            element={
              <AnimatedPage reduced={reduced}>
                <AboutPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/settings"
            element={
              <AnimatedPage reduced={reduced}>
                <SettingsPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/fen-history"
            element={
              <AnimatedPage reduced={reduced}>
                <FENHistoryPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/advanced-fen"
            element={
              <AnimatedPage reduced={reduced}>
                <AdvancedFENInputPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/auth/sign-in"
            element={
              <AnimatedPage reduced={reduced}>
                <SignInPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/auth/sign-up"
            element={
              <AnimatedPage reduced={reduced}>
                <SignUpPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <AnimatedPage reduced={reduced}>
                <ForgotPasswordPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/auth/mfa"
            element={
              <AnimatedPage reduced={reduced}>
                <MfaChallengePage />
              </AnimatedPage>
            }
          />
          <Route
            path="*"
            element={
              <AnimatedPage reduced={reduced}>
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
