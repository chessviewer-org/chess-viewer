import { useEffect, useRef } from 'react';

import { isTextEntryTarget } from '@utils';

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
}

/**
 * Editor action shortcuts: F flip · Ctrl/Cmd+Z undo · Ctrl/Cmd+Y (or +Shift+Z)
 * redo · Delete/Backspace remove the selected piece · Escape clear selection.
 * All shortcuts are suppressed while the user is typing in a field or
 * interacting inside a dialog, so editing flows are never hijacked.
 *
 * Page scrolling (Arrow / Page / Home / End) is owned by the app-wide
 * `usePageScrollKeys` layer, not here — this hook only adds the board action
 * keys so a board may be edited entirely from the keyboard.
 *
 * Handlers are read through a ref, so passing fresh callbacks every render does
 * not re-bind the single window listener.
 */
export function useEditorKeyboard(
  actions: EditorKeyboardActions,
  options: EditorKeyboardOptions = {}
): void {
  const { enabled = true } = options;

  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextEntryTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      const a = actionsRef.current;

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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
