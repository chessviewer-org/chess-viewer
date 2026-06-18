/**
 * Keyboard page-scroll helpers shared by the global page-scroll layer
 * (`usePageScrollKeys`) and any feature-level keyboard hook.
 *
 * The shell locks the OUTER page on desktop (`lg:overflow-hidden`) and hands the
 * scroll to an inner region — `#main-content` on the board route, but a
 * page-level `<main>` (About / Settings / FEN history) on routes that render
 * their own scroll column. On mobile the document itself scrolls. Hard-coding
 * `#main-content` therefore resolved the WRONG element on most routes (it never
 * overflows when an inner `<main>` owns the scroll), so Arrow / Page / Home /
 * End silently did nothing. We instead resolve the nearest element that is
 * ACTUALLY scrollable from the current focus point, then fall back to the
 * document. WCAG 2.1.1 (Keyboard).
 */

/** Returns true when the element's box can scroll vertically right now. */
function isScrollableY(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const overflowY = getComputedStyle(el).overflowY;
  return (
    overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
  );
}

/** True when the document/window itself has room to scroll vertically. */
function isPageScrollable(): boolean {
  const doc = document.documentElement;
  return (window.innerHeight ?? 0) + 1 < doc.scrollHeight;
}

/**
 * Largest currently-scrollable descendant of `root` (by visible height), or
 * `null`. Used as the catch-all so a page that owns its scroll on an anonymous
 * `<div>` (About / Settings render the scroll column as a `<div>`, not a
 * landmark) is still driven by the keys without every page opting in. Picking
 * the tallest visible scroller avoids latching onto a small nested list/picker
 * that merely happens to overflow.
 */
function largestScrollableDescendant(root: HTMLElement): HTMLElement | null {
  const all = root.querySelectorAll<HTMLElement>('*');
  let best: HTMLElement | null = null;
  let bestHeight = 0;
  for (const el of all) {
    if (!isScrollableY(el)) continue;
    const height = el.clientHeight;
    if (height > bestHeight) {
      best = el;
      bestHeight = height;
    }
  }
  return best;
}

/**
 * The element that actually owns the vertical scroll, or `null` for the page.
 *
 * Resolution order:
 *   1. The nearest scrollable ancestor of the focused element — so arrow keys
 *      drive whatever region the user is actually in (a page's inner column, a
 *      dialog body, the board editor's panel).
 *   2. An explicit page scroll container marked `data-page-scroll` if it
 *      overflows — the deterministic opt-in for the route's main scroll column.
 *   3. The shell scroller `#main-content` if it overflows.
 *   4. The largest scrollable descendant inside `#main-content` — catches pages
 *      whose scroll lives on an anonymous `<div>`/`<main>` (the original bug:
 *      `#main-content` itself does not overflow because the inner column owns
 *      the scroll, so Arrow / Page / Home / End silently did nothing).
 *   5. `null` → scroll the document/window (the mobile layout).
 */
function getScrollContainer(): HTMLElement | null {
  let node: HTMLElement | null =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  while (node && node !== document.body) {
    if (isScrollableY(node)) return node;
    node = node.parentElement;
  }

  const tagged = document.querySelector<HTMLElement>('[data-page-scroll]');
  if (tagged && isScrollableY(tagged)) return tagged;

  const main = document.getElementById('main-content');
  if (main && isScrollableY(main)) return main;

  if (main) {
    const inner = largestScrollableDescendant(main);
    if (inner) return inner;
  }

  return null;
}

/**
 * Whether a keyboard scroll in `direction` (-1 up / +1 down) can move anything.
 * Lets the caller avoid swallowing an arrow key (`preventDefault`) on a route
 * that genuinely cannot scroll, so the key is not "dead".
 */
export function canPageScroll(direction: -1 | 1): boolean {
  const el = getScrollContainer();
  if (el) {
    if (direction < 0) return el.scrollTop > 0;
    return el.scrollTop + el.clientHeight + 1 < el.scrollHeight;
  }
  if (!isPageScrollable()) return false;
  const y = window.scrollY;
  if (direction < 0) return y > 0;
  return y + window.innerHeight + 1 < document.documentElement.scrollHeight;
}

/**
 * Scroll the active container by `top` pixels.
 * Always instant — smooth behavior stacks on repeated keydown events
 * (held Up/Down) and causes scroll to freeze/lag. Callers that want smooth
 * scroll (e.g. click-triggered jumps) use pageScrollToY with explicit behavior.
 */
export function pageScrollBy(top: number): void {
  const el = getScrollContainer();
  if (el) el.scrollBy({ top, behavior: 'instant' });
  else window.scrollBy({ top, behavior: 'instant' });
}

/** Scroll the active container (or the window) to absolute `top`. */
export function pageScrollToY(
  top: number,
  behavior: ScrollBehavior = 'instant'
): void {
  const el = getScrollContainer();
  if (el) el.scrollTo({ top, behavior });
  else window.scrollTo({ top, behavior });
}

/** Visible height of the active scroll container (or the viewport). */
export function getPageViewportHeight(): number {
  const el = getScrollContainer();
  return el ? el.clientHeight : window.innerHeight;
}

/** Total scrollable height of the active container (or the document). */
export function getPageScrollMax(): number {
  const el = getScrollContainer();
  if (el) return el.scrollHeight;
  return document.documentElement.scrollHeight;
}

/**
 * Tags/states where typing (or an open overlay) must win over page scrolling:
 * form fields, contenteditable, and anything inside an open dialog/listbox/menu.
 */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return (
    target.closest('[role="dialog"],[role="listbox"],[role="menu"]') !== null
  );
}

/**
 * Tags/states that natively handle the arrow keys themselves and must NOT be
 * hijacked by the page scroller: the interactive board grid (roving focus),
 * range sliders, etc. Identified by `data-arrow-keys="self"` on an ancestor.
 */
export function ownsArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'range') {
    return true;
  }
  return target.closest('[data-arrow-keys="self"]') !== null;
}
