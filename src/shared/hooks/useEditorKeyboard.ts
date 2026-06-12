import { useEffect, useRef } from 'react';

/** Action callbacks wired to editor keyboard shortcuts. All optional. */
export interface EditorKeyboardActions {
  /** Flip board orientation (default: F). */
  onFlip?: (() => void) | undefined;
  /** Undo the last board edit (default: Ctrl/Cmd+Z). */
  onUndo?: (() => void) | undefined;
  /** Redo a reverted board edit (default: Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z). */
  onRedo?: (() => void) | undefined;
  /** Delete the piece on the selected square (default: Delete / Backspace). */
  onDelete?: (() => void) | undefined;
  /** Clear the active square selection (default: Escape). */
  onEscape?: (() => void) | undefined;
}

/** Tunables for the editor keyboard layer. */
export interface EditorKeyboardOptions {
  /** Master switch; when false no listener is attached. Default true. */
  enabled?: boolean;
  /**
   * Pixels scrolled per arrow-key press. PageUp/PageDown use ~90% of the
   * viewport height; Home/End jump to the document extremes. Default 80.
   */
  scrollStep?: number;
}

/**
 * The element that actually scrolls. On desktop the shell locks the page and
 * `#main-content` owns the scroll (`lg:overflow-y-auto`); on mobile the document
 * scrolls. Returning the right one keeps Arrow/Page/Home/End working in both
 * layouts — scrolling `window` does nothing when the overflow lives on `<main>`.
 */
function getScrollContainer(): HTMLElement | null {
  const main = document.getElementById('main-content');
  if (main && main.scrollHeight > main.clientHeight) return main;
  return null;
}

function scrollBy(top: number): void {
  const el = getScrollContainer();
  if (el) el.scrollBy({ top, behavior: 'smooth' });
  else window.scrollBy({ top, behavior: 'smooth' });
}

function scrollToY(top: number): void {
  const el = getScrollContainer();
  if (el) el.scrollTo({ top, behavior: 'smooth' });
  else window.scrollTo({ top, behavior: 'smooth' });
}

function getViewportHeight(): number {
  const el = getScrollContainer();
  return el ? el.clientHeight : window.innerHeight;
}

function getScrollMax(): number {
  const el = getScrollContainer();
  if (el) return el.scrollHeight;
  return document.documentElement.scrollHeight;
}

/** Tags/states where typing must win over editor shortcuts. */
function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // Inside an open dialog/listbox (e.g. a modal or combobox) the page-level
  // shortcuts and document scroll should not hijack keys.
  return target.closest('[role="dialog"],[role="listbox"]') !== null;
}

/**
 * Global keyboard layer for the board editor: action shortcuts (flip / undo /
 * redo / delete / escape) plus document scrolling via Arrow / Page / Home /
 * End. All shortcuts are suppressed while the user is typing in a field or
 * interacting inside a dialog, so editing flows are never hijacked.
 *
 * Handlers are read through a ref, so passing fresh callbacks every render does
 * not re-bind the single window listener.
 */
export function useEditorKeyboard(
  actions: EditorKeyboardActions,
  options: EditorKeyboardOptions = {}
): void {
  const { enabled = true, scrollStep = 80 } = options;

  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const typing = isTextEntryTarget(e.target);
      const mod = e.ctrlKey || e.metaKey;
      const a = actionsRef.current;

      // ----- Action shortcuts (skipped entirely while typing) -----
      if (!typing) {
        // Undo / Redo — Ctrl/Cmd+Z, with Shift (or Ctrl/Cmd+Y) for redo.
        if (mod && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          if (e.shiftKey) a.onRedo?.();
          else a.onUndo?.();
          return;
        }
        if (mod && (e.key === 'y' || e.key === 'Y')) {
          e.preventDefault();
          a.onRedo?.();
          return;
        }

        // Non-modifier single-key actions.
        if (!mod && !e.altKey) {
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            a.onFlip?.();
            return;
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            a.onDelete?.();
            return;
          }
          if (e.key === 'Escape') {
            a.onEscape?.();
            return;
          }
        }
      }

      // ----- Document scrolling (also skipped while typing / in dialogs) -----
      if (typing || mod || e.altKey) return;

      const viewport = getViewportHeight();
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          scrollBy(scrollStep);
          break;
        case 'ArrowUp':
          e.preventDefault();
          scrollBy(-scrollStep);
          break;
        case 'PageDown':
          e.preventDefault();
          scrollBy(viewport * 0.9);
          break;
        case 'PageUp':
          e.preventDefault();
          scrollBy(-viewport * 0.9);
          break;
        case 'Home':
          e.preventDefault();
          scrollToY(0);
          break;
        case 'End':
          e.preventDefault();
          scrollToY(getScrollMax());
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, scrollStep]);
}
