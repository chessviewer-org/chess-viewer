import { useCallback, useEffect, useRef } from 'react';

let scrollLockCount = 0;
let originalBodyStyle: Record<string, string> = {};
let originalHtmlStyle: Record<string, string> = {};

/** 
 * Measures the width of the browser's scrollbar. 
 * 
 * @returns Scrollbar width in pixels
 */
function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.width = '100px';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  document.body.removeChild(outer);
  return scrollbarWidth;
}

/** 
 * Locks the document scroll. 
 * 
 * @returns The current vertical scroll position
 */
function lockScroll(): number {
  if (typeof window === 'undefined') return 0;
  scrollLockCount++;

  if (scrollLockCount === 1) {
    const scrollbarWidth = getScrollbarWidth();
    const body = document.body;
    const html = document.documentElement;

    originalBodyStyle = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width
    };

    originalHtmlStyle = {
      overflow: html.style.overflow,
      scrollBehavior: html.style.scrollBehavior
    };

    const scrollY = window.scrollY || window.pageYOffset;
    html.style.overflow = 'hidden';
    html.style.scrollBehavior = 'auto';

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
      const fixedElements = document.querySelectorAll<HTMLElement>(
        '.fixed-header, [data-fixed]'
      );
      fixedElements.forEach((el) => {
        const currentPadding =
          parseInt(window.getComputedStyle(el).paddingRight) || 0;
        el.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
        el.setAttribute('data-scroll-lock-padding', currentPadding.toString());
      });
    }

    body.setAttribute('data-scroll-lock-y', scrollY.toString());
    return scrollY;
  }

  const body = document.body;
  return parseInt(body.getAttribute('data-scroll-lock-y') || '0', 10);
}

/** 
 * Unlocks the document scroll and restores styles. 
 */
function unlockScroll(): void {
  if (typeof window === 'undefined') return;
  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount === 0) {
    const body = document.body;
    const html = document.documentElement;
    const scrollY = parseInt(body.getAttribute('data-scroll-lock-y') || '0', 10);

    Object.keys(originalBodyStyle).forEach((key) => {
      const val = originalBodyStyle[key];
      if (val !== undefined) {
        (body.style as any)[key] = val;
      }
    });

    Object.keys(originalHtmlStyle).forEach((key) => {
      const val = originalHtmlStyle[key];
      if (val !== undefined) {
        (html.style as any)[key] = val;
      }
    });

    window.scrollTo(0, scrollY);

    const fixedElements = document.querySelectorAll<HTMLElement>(
      '[data-scroll-lock-padding]'
    );
    fixedElements.forEach((el) => {
      const originalPadding = el.getAttribute('data-scroll-lock-padding');
      el.style.paddingRight = originalPadding ? `${originalPadding}px` : '';
      el.removeAttribute('data-scroll-lock-padding');
    });

    body.removeAttribute('data-scroll-lock-y');
    originalBodyStyle = {};
    originalHtmlStyle = {};
  }
}

interface ScrollLockOptions {
  allowTouchMove?: boolean;
}

/**
 * Locks or unlocks document scroll, preventing body scroll when modals are open.
 * Returns the scroll position at the time of locking.
 *
 * @param isLocked - Whether scroll should be locked
 * @param options - Additional options
 * @returns The scroll Y position
 */
export function useScrollLock(
  isLocked: boolean = false,
  options: ScrollLockOptions = {}
): number {
  const { allowTouchMove = false } = options;
  const isLockedRef = useRef<boolean>(isLocked);
  const scrollYRef = useRef<number>(0);

  /** 
   * Internal touch move preventer for iOS compatibility. 
   * 
   * @param e - Touch event
   */
  const preventTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!allowTouchMove) {
        e.preventDefault();
      }
    },
    [allowTouchMove]
  );

  useEffect(() => {
    isLockedRef.current = isLocked;
    if (isLocked) {
      const scrollY = lockScroll();
      scrollYRef.current = scrollY;
      if (!allowTouchMove) {
        document.addEventListener('touchmove', preventTouchMove, {
          passive: false
        });
      }
    } else {
      unlockScroll();
      if (!allowTouchMove) {
        document.removeEventListener('touchmove', preventTouchMove);
      }
    }

    return () => {
      if (isLockedRef.current) {
        unlockScroll();
        if (!allowTouchMove) {
          document.removeEventListener('touchmove', preventTouchMove);
        }
      }
    };
  }, [isLocked, allowTouchMove, preventTouchMove]);

  return scrollYRef.current;
}
