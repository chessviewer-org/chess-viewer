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

      const viewport = window.innerHeight;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          window.scrollBy({ top: scrollStep, behavior: 'smooth' });
          break;
        case 'ArrowUp':
          e.preventDefault();
          window.scrollBy({ top: -scrollStep, behavior: 'smooth' });
          break;
        case 'PageDown':
          e.preventDefault();
          window.scrollBy({ top: viewport * 0.9, behavior: 'smooth' });
          break;
        case 'PageUp':
          e.preventDefault();
          window.scrollBy({ top: -viewport * 0.9, behavior: 'smooth' });
          break;
        case 'Home':
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, scrollStep]);
}
