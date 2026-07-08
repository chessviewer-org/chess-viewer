function isScrollableY(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const overflowY = getComputedStyle(el).overflowY;
  return (
    overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
  );
}

function isPageScrollable(): boolean {
  const doc = document.documentElement;
  return (window.innerHeight ?? 0) + 1 < doc.scrollHeight;
}

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

export function pageScrollBy(top: number): void {
  const el = getScrollContainer();
  if (el) el.scrollBy({ top, behavior: 'instant' });
  else window.scrollBy({ top, behavior: 'instant' });
}

export function pageScrollToY(
  top: number,
  behavior: ScrollBehavior = 'instant'
): void {
  const el = getScrollContainer();
  if (el) el.scrollTo({ top, behavior });
  else window.scrollTo({ top, behavior });
}

export function getPageViewportHeight(): number {
  const el = getScrollContainer();
  return el ? el.clientHeight : window.innerHeight;
}

export function getPageScrollMax(): number {
  const el = getScrollContainer();
  if (el) return el.scrollHeight;
  return document.documentElement.scrollHeight;
}

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return (
    target.closest('[role="dialog"],[role="listbox"],[role="menu"]') !== null
  );
}

export function ownsArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'range') {
    return true;
  }
  return target.closest('[data-arrow-keys="self"]') !== null;
}
