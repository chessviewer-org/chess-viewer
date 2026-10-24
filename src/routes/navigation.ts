import { flushSync } from 'preact/compat';
import type { AroundNavHandler } from 'wouter';

import { withViewTransition } from '@utils/viewTransition';

export const navigateWithTransition: AroundNavHandler = (
  navigate,
  to,
  options
) => {
  const changesPage =
    new URL(to, window.location.href).pathname !== window.location.pathname;
  const go = () => {
    flushSync(() => {
      // Destination layout effects must see the new scroll position.
      if (changesPage) window.scrollTo(0, 0);
      navigate(to, options);
    });
  };
  if (changesPage) withViewTransition(go);
  else go();
};
