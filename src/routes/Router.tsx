import { Suspense } from 'react';
import { Route, Switch } from 'wouter';

import {
  HomePage,
  FairyChessPage,
  AboutPage,
  DocsPage,
  ExportPage,
  SettingsPage,
  FENHistoryPage,
  AdvancedFENInputPage,
  LatexPage,
  NotFoundPage,
  SignInPage,
  SignUpPage,
  ForgotPasswordPage,
  MfaChallengePage
} from '@/routes/pages';

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          className="flex flex-1 items-center justify-center py-16 text-text-secondary"
          role="status"
        >
          Loading page…
        </div>
      }
    >
      <Switch>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/fairy-chess">
          <FairyChessPage />
        </Route>
        <Route path="/export">
          <ExportPage />
        </Route>
        <Route path="/about">
          <AboutPage />
        </Route>
        <Route path="/docs">
          <DocsPage />
        </Route>
        <Route path="/settings">
          <SettingsPage />
        </Route>
        <Route path="/fen-history">
          <FENHistoryPage />
        </Route>
        <Route path="/advanced-fen">
          <AdvancedFENInputPage />
        </Route>
        <Route path="/latex">
          <LatexPage />
        </Route>

        <Route path="/auth/sign-in">
          <SignInPage />
        </Route>
        <Route path="/auth/sign-up">
          <SignUpPage />
        </Route>
        <Route path="/auth/forgot-password">
          <ForgotPasswordPage />
        </Route>
        <Route path="/auth/mfa">
          <MfaChallengePage />
        </Route>

        <Route path="*">
          <NotFoundPage />
        </Route>
      </Switch>
    </Suspense>
  );
}

export default AppRoutes;
