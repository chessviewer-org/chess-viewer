export const PRERENDERED_ROUTES = [
  '/',
  '/advanced-fen',
  '/about',
  '/fen-history',
  '/export',
  '/settings',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password'
];

export const PRERENDERED_ROUTE_PATTERNS = PRERENDERED_ROUTES.filter(
  (route) => route !== '/'
).map((route) => new RegExp(`^${route}/?$`));
