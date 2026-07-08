import { lazy } from 'react';

const loadHomePage = () => import('@/pages/HomePage/HomePage');
const loadAboutPage = () => import('@/pages/AboutPage/AboutPage');
const loadExportPage = () => import('@/pages/ExportPage/ExportPage');
const loadSettingsPage = () => import('@/pages/SettingsPage/SettingsPage');
const loadFENHistoryPage = () =>
  import('@/pages/FENHistoryPage/FENHistoryPage');
const loadAdvancedFENPage = () =>
  import('@/pages/AdvancedFENInputPage/AdvancedFENInputPage');
const loadNotFoundPage = () => import('@/pages/NotFoundPage');
const loadSignInPage = () => import('@/pages/AuthPages/SignInPage');
const loadSignUpPage = () => import('@/pages/AuthPages/SignUpPage');
const loadForgotPasswordPage = () =>
  import('@/pages/AuthPages/ForgotPasswordPage');
const loadMfaChallengePage = () => import('@/pages/AuthPages/MfaChallengePage');

export const HomePage = lazy(loadHomePage);
export const AboutPage = lazy(loadAboutPage);
export const ExportPage = lazy(loadExportPage);
export const SettingsPage = lazy(loadSettingsPage);
export const FENHistoryPage = lazy(loadFENHistoryPage);
export const AdvancedFENInputPage = lazy(loadAdvancedFENPage);
export const NotFoundPage = lazy(loadNotFoundPage);
export const SignInPage = lazy(loadSignInPage);
export const SignUpPage = lazy(loadSignUpPage);
export const ForgotPasswordPage = lazy(loadForgotPasswordPage);
export const MfaChallengePage = lazy(loadMfaChallengePage);

export const prefetchByPath: Record<string, () => Promise<unknown>> = {
  '/': loadHomePage,
  '/about': loadAboutPage,
  '/export': loadExportPage,
  '/settings': loadSettingsPage,
  '/fen-history': loadFENHistoryPage,
  '/advanced-fen': loadAdvancedFENPage,
  '/auth/sign-in': loadSignInPage,
  '/auth/sign-up': loadSignUpPage,
  '/auth/forgot-password': loadForgotPasswordPage,
  '/auth/mfa': loadMfaChallengePage
};
