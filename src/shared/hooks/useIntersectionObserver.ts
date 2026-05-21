import { useEffect, useRef, useState } from 'react';

interface IntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Observes an element and returns whether it is visible in the viewport.
 *
 * @param {IntersectionObserverOptions} [options={}]
 * @returns {{ ref: React.RefObject<T | null>, isVisible: boolean }}
 */
export function useIntersectionObserver<T extends HTMLElement>({
  threshold = 0.1,
  rootMargin = '50px'
}: IntersectionObserverOptions = {}) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return {
    ref,
    isVisible
  };
}

export default useIntersectionObserver;
