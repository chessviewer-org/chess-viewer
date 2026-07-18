import { useEffect, useLayoutEffect, useRef, useState, RefObject } from 'react';

import { readReducedMotionPreference, resolveReducedMotion } from '@utils';

export function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  enabled: boolean = true
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current(event);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ref, enabled]);
}

export function useCopyToClipboard(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return [copied, copy];
}

export function useScrollLock(isLocked: boolean): void {
  const scrollYRef = useRef(0);

  useLayoutEffect(() => {
    if (!isLocked) return;

    scrollYRef.current = window.scrollY;
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isLocked]);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useScrollReveal(ref: RefObject<HTMLElement | null>): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (resolveReducedMotion(readReducedMotionPreference())) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
}

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = ref.current;
    if (!container) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));

    const focusable = getFocusable();
    if (focusable[0]) {
      focusable[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      const elements = getFocusable();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (!first || !last) return;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [ref, isActive]);
}
