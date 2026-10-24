import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { navigateWithTransition } from '../src/routes/navigation';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  'document'
);

afterEach(() => {
  for (const [key, descriptor] of [
    ['window', originalWindow],
    ['document', originalDocument]
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function browser(animated = true, reduceMotion = false) {
  const events: string[] = [];
  let scrollY = 320;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        href: 'https://chess.test/about?tab=faq',
        pathname: '/about'
      },
      scrollTo: (x: number, y: number) => {
        assert.equal(x, 0);
        scrollY = y;
        events.push('scroll');
      },
      localStorage: { getItem: () => (reduceMotion ? '"reduce"' : null) },
      matchMedia: () => ({ matches: false })
    }
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: animated
      ? {
          startViewTransition: (commit: () => void) => {
            events.push('snapshot');
            commit();
          }
        }
      : {}
  });
  return { events, scrollY: () => scrollY };
}

test('page navigation resets scroll before destination layout runs', () => {
  const state = browser();
  navigateWithTransition(
    (to, options) => {
      assert.equal(to, '/fairy-chess');
      assert.deepEqual(options, { replace: true });
      assert.equal(state.scrollY(), 0);
      state.events.push('navigate');
    },
    '/fairy-chess',
    { replace: true }
  );
  assert.deepEqual(state.events, ['snapshot', 'scroll', 'navigate']);
});

test('navigation commits immediately without the View Transitions API', () => {
  const state = browser(false);
  navigateWithTransition(() => state.events.push('navigate'), '/', undefined);
  assert.deepEqual(state.events, ['scroll', 'navigate']);
});

test('reduced motion bypasses snapshots while still resetting scroll first', () => {
  const state = browser(true, true);
  navigateWithTransition(
    () => {
      assert.equal(state.scrollY(), 0);
      state.events.push('navigate');
    },
    '/latex',
    undefined
  );
  assert.deepEqual(state.events, ['scroll', 'navigate']);
});

test('query and fragment changes retain scroll without a page animation', () => {
  const state = browser();
  const destinations: string[] = [];
  for (const to of ['/about?tab=donate', '/about?tab=faq#answer']) {
    navigateWithTransition(
      (destination) => destinations.push(destination),
      to,
      undefined
    );
  }
  assert.deepEqual(destinations, [
    '/about?tab=donate',
    '/about?tab=faq#answer'
  ]);
  assert.equal(state.scrollY(), 320);
  assert.deepEqual(state.events, []);
});
