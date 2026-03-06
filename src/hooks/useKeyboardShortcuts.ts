import { useEffect } from 'react';

interface KeyboardShortcutDeps {
  togglePlayStop: () => void;
  deleteSelectedClip: () => void;
  undo: () => void;
  redo: () => void;
  duplicateSelectedClip: () => void;
  saveProject: () => void;
  deselectAll: () => void;
}

/**
 * Hook that registers global keyboard shortcuts.
 * Shortcuts are suppressed when the user is typing in an input, textarea, or contentEditable element.
 */
export function useKeyboardShortcuts(deps: KeyboardShortcutDeps): void {
  const {
    togglePlayStop,
    deleteSelectedClip,
    undo,
    redo,
    duplicateSelectedClip,
    saveProject,
    deselectAll,
  } = deps;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable
      ) {
        // Still allow Escape in input fields for deselect
        if (e.key === 'Escape') {
          deselectAll();
          (target as HTMLElement).blur();
          e.preventDefault();
        }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayStop();
          break;

        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelectedClip();
          break;

        case 'z':
        case 'Z':
          if (ctrl && e.shiftKey) {
            e.preventDefault();
            redo();
          } else if (ctrl) {
            e.preventDefault();
            undo();
          }
          break;

        case 'y':
        case 'Y':
          if (ctrl) {
            e.preventDefault();
            redo();
          }
          break;

        case 'd':
        case 'D':
          if (ctrl) {
            e.preventDefault();
            duplicateSelectedClip();
          }
          break;

        case 's':
        case 'S':
          if (ctrl) {
            e.preventDefault();
            saveProject();
          }
          break;

        case 'Escape':
          e.preventDefault();
          deselectAll();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlayStop,
    deleteSelectedClip,
    undo,
    redo,
    duplicateSelectedClip,
    saveProject,
    deselectAll,
  ]);
}
