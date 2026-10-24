let hydrating = false;

export const isHydrating = (): boolean => hydrating;

export function duringHydration(run: () => void) {
  hydrating = true;
  try {
    run();
  } finally {
    hydrating = false;
  }
}
