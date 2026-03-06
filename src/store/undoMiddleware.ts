import { create } from 'zustand';
import type { Project } from '../engine/types';
import { useProjectStore } from './projectStore';

const MAX_HISTORY = 50;

interface UndoState {
  past: Project[];
  future: Project[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  _trackingEnabled: boolean;
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  _trackingEnabled: true,

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const currentProject = useProjectStore.getState().project;
    const previousProject = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // Disable tracking while we apply the undo
    set({ _trackingEnabled: false });
    useProjectStore.getState().setProject(previousProject);

    set({
      past: newPast,
      future: [currentProject, ...future],
      canUndo: newPast.length > 0,
      canRedo: true,
      _trackingEnabled: true,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const currentProject = useProjectStore.getState().project;
    const nextProject = future[0];
    const newFuture = future.slice(1);

    // Disable tracking while we apply the redo
    set({ _trackingEnabled: false });
    useProjectStore.getState().setProject(nextProject);

    set({
      past: [...past, currentProject],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
      _trackingEnabled: true,
    });
  },
}));

/**
 * Subscribe to projectStore changes and push project snapshots onto the undo stack.
 * Only tracks changes to the `project` field, not UI/transport state.
 */
let lastProjectJson = '';

function initUndoTracking() {
  const initialProject = useProjectStore.getState().project;
  lastProjectJson = JSON.stringify(initialProject);

  useProjectStore.subscribe((state, prevState) => {
    // Only track project changes
    if (state.project === prevState.project) return;

    // Skip if tracking is disabled (during undo/redo)
    if (!useUndoStore.getState()._trackingEnabled) return;

    const newJson = JSON.stringify(state.project);
    if (newJson === lastProjectJson) return;

    lastProjectJson = newJson;

    const { past } = useUndoStore.getState();
    const newPast = [...past, prevState.project];

    // Trim history to max size
    if (newPast.length > MAX_HISTORY) {
      newPast.splice(0, newPast.length - MAX_HISTORY);
    }

    useUndoStore.setState({
      past: newPast,
      future: [], // Clear redo stack on new change
      canUndo: true,
      canRedo: false,
    });
  });
}

// Initialize tracking immediately
initUndoTracking();
