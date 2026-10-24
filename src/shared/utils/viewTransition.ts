import { flushSync } from 'preact/compat';

import { readReducedMotionPreference, resolveReducedMotion } from './a11yUtils';

export function canAnimateViewTransition(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !resolveReducedMotion(readReducedMotionPreference())
  );
}

export function suppressTransitionsUntilPainted() {
  const { classList } = document.documentElement;
  classList.add('instant');
  requestAnimationFrame(() =>
    requestAnimationFrame(() => classList.remove('instant'))
  );
}

export function withViewTransition(update: () => void) {
  if (!canAnimateViewTransition()) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
