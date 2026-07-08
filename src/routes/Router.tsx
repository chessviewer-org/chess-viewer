import { ReactNode, Suspense } from 'react';
import { Route, Switch } from 'wouter';

import {
  HomePage,
  AboutPage,
  ExportPage,
  SettingsPage,
  FENHistoryPage,
  AdvancedFENInputPage,
  NotFoundPage,
  SignInPage,
  SignUpPage,
  ForgotPasswordPage,
  MfaChallengePage
} from '@/routes/lazyPages';

import { usePageTransition } from './usePageTransition';

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-[70vh] animate-loader-in"
      role="status"
      aria-label="Loading page"
    >
      <div className="relative w-16 h-16">
        <LoadingLogo />
      </div>
    </div>
  );
}

function LoadingLogo() {
  return (
    <svg
      viewBox="0 0 45 45"
      className="w-full h-full"
      role="img"
      aria-label="ChessViewer"
    >
      <style>{`
        @keyframes cv-fill {
          0%   { y: 45px; height: 0; }
          70%  { y: 0;    height: 45px; }
          100% { y: 0;    height: 45px; }
        }
        .cv-fill-rect { animation: cv-fill 0.9s ease-in-out infinite; animation-delay: 0.3s; }
      `}</style>

      <defs>
        <clipPath id="cv-loader-fill" clipPathUnits="userSpaceOnUse">
          <rect x="0" width="45" y="45" height="0" className="cv-fill-rect" />
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

      <use
        href="#cv-loader-logo"
        className="text-accent/15"
        fill="currentColor"
      />
      <use
        href="#cv-loader-logo"
        className="text-accent"
        fill="currentColor"
        clipPath="url(#cv-loader-fill)"
      />
    </svg>
  );
}

function AnimatedPage({
  children,
  phase
}: {
  children: ReactNode;
  phase: 'entering' | 'exiting';
}) {
  const className =
    phase === 'exiting' ? 'page-transition-exit' : 'animate-page-enter';
  return <div className={className}>{children}</div>;
}

function AllRoutes({
  location,
  phase
}: {
  location: { pathname: string };
  phase: 'entering' | 'exiting';
}) {
  return (
    <Switch location={location.pathname}>
      <Route path="/">
        <AnimatedPage phase={phase}>
          <HomePage />
        </AnimatedPage>
      </Route>
      <Route path="/export">
        <AnimatedPage phase={phase}>
          <ExportPage />
        </AnimatedPage>
      </Route>
      <Route path="/about">
        <AnimatedPage phase={phase}>
          <AboutPage />
        </AnimatedPage>
      </Route>
      <Route path="/settings">
        <AnimatedPage phase={phase}>
          <SettingsPage />
        </AnimatedPage>
      </Route>
      <Route path="/fen-history">
        <AnimatedPage phase={phase}>
          <FENHistoryPage />
        </AnimatedPage>
      </Route>
      <Route path="/advanced-fen">
        <AnimatedPage phase={phase}>
          <AdvancedFENInputPage />
        </AnimatedPage>
      </Route>

      <Route path="/auth/sign-in">
        <AnimatedPage phase={phase}>
          <SignInPage />
        </AnimatedPage>
      </Route>
      <Route path="/auth/sign-up">
        <AnimatedPage phase={phase}>
          <SignUpPage />
        </AnimatedPage>
      </Route>
      <Route path="/auth/forgot-password">
        <AnimatedPage phase={phase}>
          <ForgotPasswordPage />
        </AnimatedPage>
      </Route>
      <Route path="/auth/mfa">
        <AnimatedPage phase={phase}>
          <MfaChallengePage />
        </AnimatedPage>
      </Route>

      <Route path="*">
        <AnimatedPage phase={phase}>
          <NotFoundPage />
        </AnimatedPage>
      </Route>
    </Switch>
  );
}

function AppRoutes() {
  const { current, previous } = usePageTransition();

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="page-transition-stack">
        {previous && (
          <div
            key={previous.location.pathname}
            className="page-transition-slot page-transition-slot--exiting"
          >
            <AllRoutes location={previous.location} phase="exiting" />
          </div>
        )}

        <div
          key={current.location.pathname}
          className="page-transition-slot page-transition-slot--entering"
        >
          <AllRoutes location={current.location} phase="entering" />
        </div>
      </div>
    </Suspense>
  );
}

export default AppRoutes;
