import { type RefObject, useLayoutEffect } from 'react';
import { useLocation } from 'wouter';

export const NAVBAR_PINNED_CLASS = 'navbar-pinned';

export function useNavbarVisibility(
  menuOpen: boolean,
  navRef: RefObject<HTMLElement | null>
): void {
  const [location] = useLocation();

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const setHidden = (hidden: boolean) => {
      const value = String(hidden);
      if (nav.dataset['hidden'] !== value) nav.dataset['hidden'] = value;
    };
    setHidden(false);
    if (menuOpen) return;

    const update = () => {
      const { classList } = document.documentElement;
      if (classList.contains('modal-open')) return;
      setHidden(!classList.contains(NAVBAR_PINNED_CLASS) && window.scrollY > 0);
    };
    const revealForKeyboard = (event: FocusEvent) => {
      if (
        event.target instanceof Element &&
        event.target.matches(':focus-visible')
      ) {
        setHidden(false);
      }
    };

    update();
    // Nested textareas and menus must not change the navigation state.
    window.addEventListener('scroll', update, { passive: true });
    nav.addEventListener('focusin', revealForKeyboard);
    nav.addEventListener('focusout', update);
    return () => {
      window.removeEventListener('scroll', update);
      nav.removeEventListener('focusin', revealForKeyboard);
      nav.removeEventListener('focusout', update);
    };
  }, [menuOpen, location, navRef]);
}
