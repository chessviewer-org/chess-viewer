import { useMemo, useRef } from 'react';
import type { Notify } from '@/engines/core/types';

export function useStartError(onNotify: Notify | undefined) {
  const notify = useRef(onNotify);
  notify.current = onNotify;
  const last = useRef('');
  return useMemo(
    () => ({
      fail(error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'This position cannot be analyzed.';
        if (message !== last.current) notify.current?.(message, 'error');
        last.current = message;
        return message;
      },
      clear() {
        last.current = '';
      }
    }),
    []
  );
}
