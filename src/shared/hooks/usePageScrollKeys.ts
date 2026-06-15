import { useEffect } from 'react';

import {
  canPageScroll,
  getPageScrollMax,
  getPageViewportHeight,
  isTextEntryTarget,
  ownsArrowKeys,
  pageScrollBy,
  pageScrollToY
} from '@utils';

/** Tunables for the global page-scroll keyboard layer. */
export interface PageScrollKeysOptions {
  /** Master switch; when false no listener is attached. Default true. */
  enabled?: boolean;
  /** Pixels scrolled per Arrow press. Page keys use ~90% of the viewport. */
  scrollStep?: number;
}

/**
 * App-wide keyboard scrolling: Arrow Up/Down, PageUp/PageDown, Home/End move the
 * active scroll region (the `#main-content` overflow on desktop, the document on
 * mobile). This is mounted ONCE near the app root so every route — not just the
 * board editor — is operable without a mouse, fixing the "arrow keys do nothing"
 * complaint. WCAG 2.1.1 (Keyboard).
 *
 * Suppressed while the user is typing in a field, inside an open dialog/listbox/
 * menu, or while focus is on a control that owns the arrow keys itself (the
 * board grid's roving focus, range sliders) so those interactions are never
 * hijacked.
 */
export function usePageScrollKeys(options: PageScrollKeysOptions = {}): void {
  const { enabled = true, scrollStep = 80 } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // A component-level handler that already claimed this key (a tablist /
      // radiogroup roving arrow, the board grid, a listbox) calls
      // `preventDefault`; React's root listener runs before this window
      // listener, so honouring `defaultPrevented` keeps the page from
      // double-acting (e.g. scrolling while arrowing between settings tabs).
      if (e.defaultPrevented) return;
      if (isTextEntryTarget(e.target) || ownsArrowKeys(e.target)) return;

      const viewport = getPageViewportHeight();
      switch (e.key) {
        case 'ArrowDown':
          if (!canPageScroll(1)) return;
          e.preventDefault();
          pageScrollBy(scrollStep);
          break;
        case 'ArrowUp':
          if (!canPageScroll(-1)) return;
          e.preventDefault();
          pageScrollBy(-scrollStep);
          break;
        case 'PageDown':
          if (!canPageScroll(1)) return;
          e.preventDefault();
          pageScrollBy(viewport * 0.9);
          break;
        case 'PageUp':
          if (!canPageScroll(-1)) return;
          e.preventDefault();
          pageScrollBy(-viewport * 0.9);
          break;
        case 'Home':
          if (!canPageScroll(-1)) return;
          e.preventDefault();
          pageScrollToY(0);
          break;
        case 'End':
          if (!canPageScroll(1)) return;
          e.preventDefault();
          pageScrollToY(getPageScrollMax());
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, scrollStep]);
}
