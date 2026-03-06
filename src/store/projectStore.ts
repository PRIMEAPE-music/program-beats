import { create } from 'zustand';
import type {
  Project,
  Track,
  TrackType,
  TrackEffects,
  MasterEffects,
  ScaleConfig,
  Clip,
  Section,
  ChatMessage,
} from '../engine/types';

const STORAGE_KEY = 'program-beats-project';

function createDefaultTrack(name: string, type: TrackType): Track {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    volume: 0.8,
    muted: false,
    solo: false,
    clips: {},
    effects: { delay: 0, reverb: 0, lpf: 20000, hpf: 20, distortion: 0 },
  };
}

function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    bpm: 120,
    tracks: [
      createDefaultTrack('Drums', 'drums'),
      createDefaultTrack('Bass', 'bass'),
      createDefaultTrack('Melody', 'melody'),
      createDefaultTrack('Chords', 'chords'),
    ],
    clips: {},
    sections: [],
    totalBars: 16,
    masterEffects: { reverb: 0.1, delay: 0, compression: 0.3 },
    scaleConfig: { root: 'C', scale: 'minor' },
  };
}

export interface ProjectState {
  project: Project;
  // Transport state
  isPlaying: boolean;
  currentBar: number;
  // UI state
  selectedTrackId: string | null;
  selectedClipId: string | null;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  // Actions
  setProject: (project: Project) => void;
  setBpm: (bpm: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentBar: (bar: number) => void;
  // Track actions
  addTrack: (name: string, type: TrackType) => void;
  removeTrack: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  // Clip actions
  addClip: (clip: Clip) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  placeClip: (trackId: string, barIndex: number, clipId: string) => void;
  removeClipPlacement: (trackId: string, barIndex: number) => void;
  // Clip duplication
  duplicateClip: (clipId: string, targetTrackId: string, targetBar: number) => void;
  // Move clip
  moveClip: (clipId: string, fromTrackId: string, fromBar: number, toTrackId: string, toBar: number) => void;
  // Fill clip right
  fillClipRight: (trackId: string, startBar: number) => void;
  // Section actions
  addSection: (section: Section) => void;
  removeSection: (sectionId: string) => void;
  // Selection
  selectTrack: (trackId: string | null) => void;
  selectClip: (clipId: string | null) => void;
  // Chat
  addChatMessage: (message: ChatMessage) => void;
  setChatLoading: (loading: boolean) => void;
  // Effects & scale actions
  setTrackEffects: (trackId: string, effects: Partial<TrackEffects>) => void;
  setMasterEffects: (effects: Partial<MasterEffects>) => void;
  setScaleConfig: (config: Partial<ScaleConfig>) => void;
  // Clip variation actions
  addClipVariation: (clipId: string, pattern: string) => void;
  setActiveVariation: (clipId: string, variationIndex: number | undefined) => void;
  // Loop region
  loopRegion: { startBar: number; endBar: number } | null;
  setLoopRegion: (startBar: number, endBar: number) => void;
  clearLoopRegion: () => void;
  // Metronome
  metronomeEnabled: boolean;
  toggleMetronome: () => void;
  // Visualizer
  showVisualizer: boolean;
  toggleVisualizer: () => void;
  // Project management
  saveProject: () => void;
  loadProject: (id: string) => void;
  newProject: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  project: createDefaultProject(),
  isPlaying: false,
  currentBar: 0,
  selectedTrackId: null,
  selectedClipId: null,
  chatMessages: [],
  isChatLoading: false,
  loopRegion: null,
  metronomeEnabled: false,
  showVisualizer: false,

  setProject: (project) => set({ project }),

  setBpm: (bpm) =>
    set((state) => ({
      project: { ...state.project, bpm },
    })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentBar: (bar) => set({ currentBar: bar }),

  // Track actions

  addTrack: (name, type) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: [...state.project.tracks, createDefaultTrack(name, type)],
      },
    })),

  removeTrack: (trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.filter((t) => t.id !== trackId),
      },
      selectedTrackId:
        state.selectedTrackId === trackId ? null : state.selectedTrackId,
    })),

  setTrackVolume: (trackId, volume) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, volume } : t
        ),
      },
    })),

  toggleTrackMute: (trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, muted: !t.muted } : t
        ),
      },
    })),

  toggleTrackSolo: (trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, solo: !t.solo } : t
        ),
      },
    })),

  // Clip actions

  addClip: (clip) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [clip.id]: clip },
      },
    })),

  updateClip: (clipId, updates) =>
    set((state) => {
      const existing = state.project.clips[clipId];
      if (!existing) return state;
      return {
        project: {
          ...state.project,
          clips: {
            ...state.project.clips,
            [clipId]: { ...existing, ...updates },
          },
        },
      };
    }),

  removeClip: (clipId) =>
    set((state) => {
      const { [clipId]: _, ...remainingClips } = state.project.clips;
      // Also remove any placements referencing this clip
      const tracks = state.project.tracks.map((track) => {
        const newClips: Record<number, string> = {};
        for (const [bar, cId] of Object.entries(track.clips)) {
          if (cId !== clipId) {
            newClips[Number(bar)] = cId;
          }
        }
        return { ...track, clips: newClips };
      });
      return {
        project: { ...state.project, clips: remainingClips, tracks },
        selectedClipId:
          state.selectedClipId === clipId ? null : state.selectedClipId,
      };
    }),

  placeClip: (trackId, barIndex, clipId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId
            ? { ...t, clips: { ...t.clips, [barIndex]: clipId } }
            : t
        ),
      },
    })),

  removeClipPlacement: (trackId, barIndex) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const { [barIndex]: _, ...remainingClips } = t.clips;
          return { ...t, clips: remainingClips };
        }),
      },
    })),

  // Clip duplication

  duplicateClip: (clipId, targetTrackId, targetBar) =>
    set((state) => {
      const original = state.project.clips[clipId];
      if (!original) return state;
      const newId = crypto.randomUUID();
      const newClip = { ...original, id: newId, name: original.name + ' (copy)' };
      return {
        project: {
          ...state.project,
          clips: { ...state.project.clips, [newId]: newClip },
          tracks: state.project.tracks.map((t) =>
            t.id === targetTrackId
              ? { ...t, clips: { ...t.clips, [targetBar]: newId } }
              : t
          ),
        },
      };
    }),

  // Move clip

  moveClip: (clipId, fromTrackId, fromBar, toTrackId, toBar) =>
    set((state) => {
      // Remove from old position, place in new position
      const tracks = state.project.tracks.map((t) => {
        let clips = { ...t.clips };
        // Remove from old position
        if (t.id === fromTrackId) {
          const { [fromBar]: _, ...rest } = clips;
          clips = rest;
        }
        // Place in new position
        if (t.id === toTrackId) {
          clips[toBar] = clipId;
        }
        return { ...t, clips };
      });
      return {
        project: { ...state.project, tracks },
      };
    }),

  // Fill clip right

  fillClipRight: (trackId, startBar) =>
    set((state) => {
      const track = state.project.tracks.find((t) => t.id === trackId);
      if (!track) return state;
      const sourceClipId = track.clips[startBar];
      if (!sourceClipId) return state;
      const sourceClip = state.project.clips[sourceClipId];
      if (!sourceClip) return state;

      let newClips = { ...state.project.clips };
      let trackClips = { ...track.clips };

      for (let bar = startBar + 1; bar < state.project.totalBars; bar++) {
        // Stop at the next existing clip
        if (trackClips[bar]) break;
        const newId = crypto.randomUUID();
        const newClip = {
          ...sourceClip,
          id: newId,
          name: `${sourceClip.name} ${bar + 1}`,
        };
        newClips[newId] = newClip;
        trackClips[bar] = newId;
      }

      return {
        project: {
          ...state.project,
          clips: newClips,
          tracks: state.project.tracks.map((t) =>
            t.id === trackId ? { ...t, clips: trackClips } : t
          ),
        },
      };
    }),

  // Section actions

  addSection: (section) =>
    set((state) => ({
      project: {
        ...state.project,
        sections: [...state.project.sections, section],
      },
    })),

  removeSection: (sectionId) =>
    set((state) => ({
      project: {
        ...state.project,
        sections: state.project.sections.filter((s) => s.id !== sectionId),
      },
    })),

  // Selection

  selectTrack: (trackId) => set({ selectedTrackId: trackId }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

  // Chat

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setChatLoading: (loading) => set({ isChatLoading: loading }),

  // Effects & scale actions

  setTrackEffects: (trackId, effects) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, effects: { ...t.effects, ...effects } } : t
        ),
      },
    })),

  setMasterEffects: (effects) =>
    set((state) => ({
      project: {
        ...state.project,
        masterEffects: { ...state.project.masterEffects, ...effects },
      },
    })),

  setScaleConfig: (config) =>
    set((state) => ({
      project: {
        ...state.project,
        scaleConfig: { ...state.project.scaleConfig, ...config },
      },
    })),

  // Clip variation actions

  addClipVariation: (clipId, pattern) =>
    set((state) => {
      const clip = state.project.clips[clipId];
      if (!clip) return state;
      const variations = [...(clip.variations || []), pattern];
      return {
        project: {
          ...state.project,
          clips: {
            ...state.project.clips,
            [clipId]: { ...clip, variations },
          },
        },
      };
    }),

  setActiveVariation: (clipId, variationIndex) =>
    set((state) => {
      const clip = state.project.clips[clipId];
      if (!clip) return state;
      return {
        project: {
          ...state.project,
          clips: {
            ...state.project.clips,
            [clipId]: { ...clip, activeVariation: variationIndex },
          },
        },
      };
    }),

  // Loop region

  setLoopRegion: (startBar, endBar) => set({ loopRegion: { startBar, endBar } }),

  clearLoopRegion: () => set({ loopRegion: null }),

  // Metronome

  toggleMetronome: () => set((state) => ({ metronomeEnabled: !state.metronomeEnabled })),

  // Visualizer

  toggleVisualizer: () => set((state) => ({ showVisualizer: !state.showVisualizer })),

  // Project management

  saveProject: () => {
    const { project } = get();
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '{}'
      ) as Record<string, string>;
      saved[project.id] = JSON.stringify(project);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      console.error('Failed to save project:', e);
    }
  },

  loadProject: (id) => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '{}'
      ) as Record<string, string>;
      const data = saved[id];
      if (data) {
        const project = JSON.parse(data) as Project;
        set({
          project,
          isPlaying: false,
          currentBar: 0,
          selectedTrackId: null,
          selectedClipId: null,
          chatMessages: [],
          isChatLoading: false,
        });
      } else {
        console.warn(`Project with id "${id}" not found in localStorage.`);
      }
    } catch (e) {
      console.error('Failed to load project:', e);
    }
  },

  newProject: () =>
    set({
      project: createDefaultProject(),
      isPlaying: false,
      currentBar: 0,
      selectedTrackId: null,
      selectedClipId: null,
      chatMessages: [],
      isChatLoading: false,
    }),
}));
