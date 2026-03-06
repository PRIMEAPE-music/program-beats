import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { TRACK_COLORS, DEFAULT_CLIP_COLORS } from '../engine/types';
import { PresetPicker } from './PresetPicker';
import { SectionManager } from './SectionManager';
import { ClipVisual } from './ClipVisual';
import type { TrackType } from '../engine/types';

interface ContextMenuState {
  x: number;
  y: number;
  trackId: string;
  barIndex: number;
  clipId: string;
}

interface DragData {
  clipId: string;
  fromTrackId: string;
  fromBar: number;
}

interface PresetPickerState {
  trackId: string;
  trackType: TrackType;
  barIndex: number;
}

export const Timeline: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const currentBar = useProjectStore((s) => s.currentBar);
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const selectTrack = useProjectStore((s) => s.selectTrack);
  const selectClip = useProjectStore((s) => s.selectClip);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const removeClipPlacement = useProjectStore((s) => s.removeClipPlacement);
  const removeClip = useProjectStore((s) => s.removeClip);
  const duplicateClip = useProjectStore((s) => s.duplicateClip);
  const moveClip = useProjectStore((s) => s.moveClip);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ trackId: string; bar: number } | null>(null);
  const [presetPicker, setPresetPicker] = useState<PresetPickerState | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<DragData | null>(null);

  const bars = Array.from({ length: project.totalBars }, (_, i) => i);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => {
      setContextMenu(null);
      setPresetPicker(null);
    };
    if (contextMenu || presetPicker) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [contextMenu, presetPicker]);

  // Find section for a given bar
  const getSectionForBar = useCallback(
    (bar: number) => {
      return project.sections.find(
        (s) => bar >= s.startBar && bar <= s.endBar && bar === s.startBar
      );
    },
    [project.sections]
  );

  const handleCellClick = useCallback(
    (trackId: string, barIndex: number) => {
      selectTrack(trackId);

      const track = project.tracks.find((t) => t.id === trackId);
      if (!track) return;

      const existingClipId = track.clips[barIndex];
      if (existingClipId) {
        // Select existing clip
        selectClip(existingClipId);
      } else {
        // Open preset picker for empty cell
        const trackDef = project.tracks.find((t) => t.id === trackId);
        if (trackDef) {
          setPresetPicker({
            trackId,
            trackType: trackDef.type,
            barIndex,
          });
        }
      }
    },
    [project, selectTrack, selectClip]
  );

  const handlePresetSelect = useCallback(
    (pattern: string, name: string) => {
      if (!presetPicker) return;
      const color =
        DEFAULT_CLIP_COLORS[
          Object.keys(project.clips).length % DEFAULT_CLIP_COLORS.length
        ];
      const newClip = {
        id: crypto.randomUUID(),
        name,
        pattern,
        color,
        durationBars: 1,
      };
      addClip(newClip);
      placeClip(presetPicker.trackId, presetPicker.barIndex, newClip.id);
      selectClip(newClip.id);
      setPresetPicker(null);
    },
    [presetPicker, project.clips, addClip, placeClip, selectClip]
  );

  const handleCreateEmptyClip = useCallback(() => {
    if (!presetPicker) return;
    const trackDef = project.tracks.find((t) => t.id === presetPicker.trackId);
    const color =
      DEFAULT_CLIP_COLORS[
        Object.keys(project.clips).length % DEFAULT_CLIP_COLORS.length
      ];
    const newClip = {
      id: crypto.randomUUID(),
      name: `${trackDef?.name ?? 'Clip'} ${presetPicker.barIndex + 1}`,
      pattern: '',
      color,
      durationBars: 1,
    };
    addClip(newClip);
    placeClip(presetPicker.trackId, presetPicker.barIndex, newClip.id);
    selectClip(newClip.id);
    setPresetPicker(null);
  }, [presetPicker, project, addClip, placeClip, selectClip]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, trackId: string, barIndex: number, clipId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, trackId, barIndex, clipId });
    },
    []
  );

  const handleRemoveClip = useCallback(() => {
    if (!contextMenu) return;
    removeClipPlacement(contextMenu.trackId, contextMenu.barIndex);
    // If no other placement references this clip, remove the clip too
    const clipId = contextMenu.clipId;
    const otherPlacements = project.tracks.some((t) =>
      Object.entries(t.clips).some(
        ([bar, cId]) =>
          cId === clipId &&
          !(t.id === contextMenu.trackId && Number(bar) === contextMenu.barIndex)
      )
    );
    if (!otherPlacements) {
      removeClip(clipId);
    }
    if (selectedClipId === clipId) {
      selectClip(null);
    }
    setContextMenu(null);
  }, [contextMenu, project.tracks, removeClipPlacement, removeClip, selectedClipId, selectClip]);

  const handleDuplicateClip = useCallback(() => {
    if (!contextMenu) return;
    const track = project.tracks.find((t) => t.id === contextMenu.trackId);
    if (!track) return;
    // Find next empty bar on same track
    let targetBar = contextMenu.barIndex + 1;
    while (targetBar < project.totalBars && track.clips[targetBar]) {
      targetBar++;
    }
    if (targetBar < project.totalBars) {
      duplicateClip(contextMenu.clipId, contextMenu.trackId, targetBar);
    }
    setContextMenu(null);
  }, [contextMenu, project, duplicateClip]);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, trackId: string, barIndex: number, clipId: string) => {
      dragDataRef.current = { clipId, fromTrackId: trackId, fromBar: barIndex };
      e.dataTransfer.effectAllowed = 'move';
      // Set a minimal drag image text so the browser shows something
      e.dataTransfer.setData('text/plain', clipId);
      // Add dragging class after a tick
      const target = e.currentTarget as HTMLElement;
      requestAnimationFrame(() => target.classList.add('dragging'));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, trackId: string, bar: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverCell({ trackId, bar });
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, trackId: string, bar: number) => {
      e.preventDefault();
      setDragOverCell(null);
      const dragData = dragDataRef.current;
      if (!dragData) return;
      // Don't drop on same cell
      if (dragData.fromTrackId === trackId && dragData.fromBar === bar) return;
      // Don't drop on occupied cell
      const track = project.tracks.find((t) => t.id === trackId);
      if (track && track.clips[bar]) return;
      moveClip(dragData.clipId, dragData.fromTrackId, dragData.fromBar, trackId, bar);
      dragDataRef.current = null;
    },
    [project.tracks, moveClip]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverCell(null);
    dragDataRef.current = null;
  }, []);

  return (
    <div className="timeline" ref={timelineRef}>
      <div className="timeline-inner">
        {/* Section markers above bar headers */}
        <SectionManager />

        {/* Bar number headers */}
        <div className="timeline-bar-headers">
          {bars.map((bar) => {
            const section = getSectionForBar(bar);
            return (
              <div
                key={bar}
                className={`bar-header${section ? ' has-section' : ''}`}
              >
                {bar + 1}
                {section && (
                  <span
                    className="section-label"
                    style={{ color: section.color }}
                  >
                    {section.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Track rows */}
        <div className="timeline-tracks">
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className={`track-row${selectedTrackId === track.id ? ' selected' : ''}`}
            >
              {bars.map((bar) => {
                const clipId = track.clips[bar];
                const clip = clipId ? project.clips[clipId] : null;
                const trackColor = TRACK_COLORS[track.type] || TRACK_COLORS.custom;
                const isDragOver =
                  dragOverCell?.trackId === track.id && dragOverCell?.bar === bar;

                return (
                  <div
                    key={bar}
                    className={`track-cell${clip ? ' has-clip' : ''}${isDragOver && !clip ? ' drag-over' : ''}`}
                    onClick={() => handleCellClick(track.id, bar)}
                    onContextMenu={
                      clip
                        ? (e) => handleContextMenu(e, track.id, bar, clipId!)
                        : undefined
                    }
                    onDragOver={(e) => handleDragOver(e, track.id, bar)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, track.id, bar)}
                  >
                    {clip ? (
                      <div
                        className={`clip${selectedClipId === clipId ? ' selected' : ''}`}
                        style={{
                          backgroundColor: clip.color || trackColor,
                          width:
                            clip.durationBars > 1
                              ? `${clip.durationBars * 100}%`
                              : '100%',
                        }}
                        title={`${clip.name}\n${clip.pattern || '(empty pattern)'}`}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, track.id, bar, clipId!)
                        }
                        onDragEnd={handleDragEnd}
                      >
                        <span className="clip-name">{clip.name}</span>
                        <ClipVisual
                          pattern={clip.pattern}
                          trackType={track.type}
                          color={clip.color || trackColor}
                        />
                      </div>
                    ) : (
                      <div className="empty-cell-plus">+</div>
                    )}

                    {/* Inline preset picker */}
                    {presetPicker &&
                      presetPicker.trackId === track.id &&
                      presetPicker.barIndex === bar && (
                        <div
                          className="preset-picker-anchor"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PresetPicker
                            trackType={presetPicker.trackType}
                            onSelect={handlePresetSelect}
                            onClose={() => setPresetPicker(null)}
                          />
                          <div
                            className="preset-picker-empty-btn"
                            onClick={handleCreateEmptyClip}
                          >
                            Create empty clip
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Playhead */}
          {isPlaying && (
            <div
              className="playhead"
              style={{ left: `${currentBar * 80 + 40}px` }}
            />
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              selectClip(contextMenu.clipId);
              setContextMenu(null);
            }}
          >
            Edit Clip
          </div>
          <div
            className="context-menu-item"
            onClick={handleDuplicateClip}
          >
            Duplicate
          </div>
          <div
            className="context-menu-item danger"
            onClick={handleRemoveClip}
          >
            Remove Clip
          </div>
        </div>
      )}
    </div>
  );
};
