import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  readReducedMotionPreference,
  resolveReducedMotion
} from '@utils';

// Constants
const EXIT_DURATION = 240;

// Helpers
function userWantsReducedMotion(): boolean {
  return resolveReducedMotion(readReducedMotionPreference());
}

// Types
interface PageLocation {
  pathname: string;
}

interface TransitionState {
  current: { location: PageLocation; phase: 'entering' };
  previous: { location: PageLocation; phase: 'exiting' } | null;
}

export function usePageTransition(): TransitionState {
  const [pathname] = useLocation();
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<TransitionState>({
    current: { location: { pathname }, phase: 'entering' },
    previous: null
  });

  useEffect(() => {
    const newLocation = { pathname };

    setState((prev) => {
      if (prev.current.location.pathname === pathname) return prev;

      if (userWantsReducedMotion()) {
        return {
          current: { location: newLocation, phase: 'entering' },
          previous: null
        };
      }

      return {
        current: { location: newLocation, phase: 'entering' },
        previous: { location: prev.current.location, phase: 'exiting' }
      };
    });
  }, [pathname]);

  useEffect(() => {
    if (!state.previous) return;

    if (exitTimer.current) clearTimeout(exitTimer.current);

    exitTimer.current = setTimeout(() => {
      setState((prev) => (prev.previous ? { ...prev, previous: null } : prev));
    }, EXIT_DURATION);

    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [state.previous]);

  return state;
}
