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
} from '@/routes/pages';

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/export">
        <ExportPage />
      </Route>
      <Route path="/about">
        <AboutPage />
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
  );
}

export default AppRoutes;
