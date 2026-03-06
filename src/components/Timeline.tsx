import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { TRACK_COLORS, DEFAULT_CLIP_COLORS } from '../engine/types';
import { PresetPicker } from './PresetPicker';
import { SectionManager } from './SectionManager';
import { ClipVisual } from './ClipVisual';
import { AutomationLane, AddAutomationDropdown } from './AutomationLane';
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
  isCopy: boolean;
}

interface PresetPickerState {
  trackId: string;
  trackType: TrackType;
  barIndex: number;
}

interface ResizeState {
  clipId: string;
  trackId: string;
  startBar: number;
  originalDuration: number;
  currentDuration: number;
}

interface LoopDragState {
  startBar: number;
  currentBar: number;
}

export const Timeline: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const currentBar = useProjectStore((s) => s.currentBar);
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const loopRegion = useProjectStore((s) => s.loopRegion);
  const selectTrack = useProjectStore((s) => s.selectTrack);
  const selectClip = useProjectStore((s) => s.selectClip);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const removeClipPlacement = useProjectStore((s) => s.removeClipPlacement);
  const removeClip = useProjectStore((s) => s.removeClip);
  const duplicateClip = useProjectStore((s) => s.duplicateClip);
  const moveClip = useProjectStore((s) => s.moveClip);
  const fillClipRight = useProjectStore((s) => s.fillClipRight);
  const updateClip = useProjectStore((s) => s.updateClip);
  const setLoopRegion = useProjectStore((s) => s.setLoopRegion);
  const clearLoopRegion = useProjectStore((s) => s.clearLoopRegion);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ trackId: string; bar: number } | null>(null);
  const [isCopyDrag, setIsCopyDrag] = useState(false);
  const [presetPicker, setPresetPicker] = useState<PresetPickerState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [loopDrag, setLoopDrag] = useState<LoopDragState | null>(null);
  const [automationVisible, setAutomationVisible] = useState<Record<string, boolean>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<DragData | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const loopDragRef = useRef<LoopDragState | null>(null);

  const toggleAutomationVisibility = useCallback((trackId: string) => {
    setAutomationVisible((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  }, []);

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

  // ── Clip resize handlers ─────────────────────────────────────
  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current || !timelineRef.current) return;
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const relativeX = e.clientX - timelineRect.left + scrollLeft;
      const barUnderCursor = Math.floor(relativeX / 80);
      let newDuration = barUnderCursor - resizeRef.current.startBar + 1;
      newDuration = Math.max(1, Math.min(newDuration, project.totalBars - resizeRef.current.startBar));

      // Prevent collision with other clips on the same track
      const track = project.tracks.find((t) => t.id === resizeRef.current!.trackId);
      if (track) {
        for (const [posStr] of Object.entries(track.clips)) {
          const pos = Number(posStr);
          if (pos > resizeRef.current.startBar && pos < resizeRef.current.startBar + newDuration) {
            newDuration = pos - resizeRef.current.startBar;
          }
        }
      }
      newDuration = Math.max(1, newDuration);

      if (newDuration !== resizeRef.current.currentDuration) {
        resizeRef.current = { ...resizeRef.current, currentDuration: newDuration };
        setResizeState({ ...resizeRef.current });
      }
    };

    const handleMouseUp = () => {
      if (resizeRef.current) {
        updateClip(resizeRef.current.clipId, { durationBars: resizeRef.current.currentDuration });
      }
      resizeRef.current = null;
      setResizeState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, project.totalBars, project.tracks, updateClip]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, clipId: string, trackId: string, startBar: number, currentDuration: number) => {
      e.stopPropagation();
      e.preventDefault();
      const state: ResizeState = {
        clipId,
        trackId,
        startBar,
        originalDuration: currentDuration,
        currentDuration,
      };
      resizeRef.current = state;
      setResizeState(state);
    },
    []
  );

  // ── Loop region drag handlers ────────────────────────────────
  useEffect(() => {
    if (!loopDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!loopDragRef.current || !timelineRef.current) return;
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const relativeX = e.clientX - timelineRect.left + scrollLeft;
      const barUnderCursor = Math.max(0, Math.min(Math.floor(relativeX / 80), project.totalBars - 1));

      if (barUnderCursor !== loopDragRef.current.currentBar) {
        loopDragRef.current = { ...loopDragRef.current, currentBar: barUnderCursor };
        setLoopDrag({ ...loopDragRef.current });
      }
    };

    const handleMouseUp = () => {
      if (loopDragRef.current) {
        const s = Math.min(loopDragRef.current.startBar, loopDragRef.current.currentBar);
        const end = Math.max(loopDragRef.current.startBar, loopDragRef.current.currentBar);
        if (s !== end) {
          setLoopRegion(s, end + 1); // endBar is exclusive
        }
      }
      loopDragRef.current = null;
      setLoopDrag(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [loopDrag, project.totalBars, setLoopRegion]);

  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent, bar: number) => {
      e.preventDefault();
      const state: LoopDragState = { startBar: bar, currentBar: bar };
      loopDragRef.current = state;
      setLoopDrag(state);
    },
    []
  );

  const handleRulerDoubleClick = useCallback(() => {
    clearLoopRegion();
  }, [clearLoopRegion]);

  // Compute loop drag range for highlighting
  const loopDragRange = loopDrag
    ? {
        start: Math.min(loopDrag.startBar, loopDrag.currentBar),
        end: Math.max(loopDrag.startBar, loopDrag.currentBar),
      }
    : null;

  // Find section for a given bar
  const getSectionForBar = useCallback(
    (bar: number) => {
      return project.sections.find(
        (s) => bar >= s.startBar && bar <= s.endBar && bar === s.startBar
      );
    },
    [project.sections]
  );

  // Helper: check if a bar is covered by a multi-bar clip starting earlier
  const getMultiBarClipCover = useCallback(
    (track: typeof project.tracks[0], bar: number) => {
      for (const [posStr, cId] of Object.entries(track.clips)) {
        const pos = Number(posStr);
        const clip = project.clips[cId];
        if (!clip) continue;
        if (pos < bar && bar < pos + clip.durationBars) {
          return { clipId: cId, startBar: pos, clip };
        }
      }
      return null;
    },
    [project.clips]
  );

  const handleCellClick = useCallback(
    (trackId: string, barIndex: number) => {
      if (resizeRef.current) return;
      selectTrack(trackId);

      const track = project.tracks.find((t) => t.id === trackId);
      if (!track) return;

      // Check if covered by a multi-bar clip
      const cover = getMultiBarClipCover(track, barIndex);
      if (cover) {
        selectClip(cover.clipId);
        return;
      }

      const existingClipId = track.clips[barIndex];
      if (existingClipId) {
        selectClip(existingClipId);
      } else {
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
    [project, selectTrack, selectClip, getMultiBarClipCover]
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
    let targetBar = contextMenu.barIndex + 1;
    while (targetBar < project.totalBars && track.clips[targetBar]) {
      targetBar++;
    }
    if (targetBar < project.totalBars) {
      duplicateClip(contextMenu.clipId, contextMenu.trackId, targetBar);
    }
    setContextMenu(null);
  }, [contextMenu, project, duplicateClip]);

  const handleFillRight = useCallback(() => {
    if (!contextMenu) return;
    fillClipRight(contextMenu.trackId, contextMenu.barIndex);
    setContextMenu(null);
  }, [contextMenu, fillClipRight]);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, trackId: string, barIndex: number, clipId: string) => {
      if (resizeRef.current) {
        e.preventDefault();
        return;
      }
      const isCopy = e.altKey;
      dragDataRef.current = { clipId, fromTrackId: trackId, fromBar: barIndex, isCopy };
      e.dataTransfer.effectAllowed = isCopy ? 'copy' : 'move';
      e.dataTransfer.setData('text/plain', clipId);
      setIsCopyDrag(isCopy);
      const target = e.currentTarget as HTMLElement;
      requestAnimationFrame(() => target.classList.add('dragging'));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, trackId: string, bar: number) => {
      e.preventDefault();
      const dragData = dragDataRef.current;
      e.dataTransfer.dropEffect = dragData?.isCopy ? 'copy' : 'move';
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
      setIsCopyDrag(false);
      const dragData = dragDataRef.current;
      if (!dragData) return;
      if (dragData.fromTrackId === trackId && dragData.fromBar === bar) return;
      const track = project.tracks.find((t) => t.id === trackId);
      if (track && track.clips[bar]) return;

      if (dragData.isCopy) {
        duplicateClip(dragData.clipId, trackId, bar);
      } else {
        moveClip(dragData.clipId, dragData.fromTrackId, dragData.fromBar, trackId, bar);
      }
      dragDataRef.current = null;
    },
    [project.tracks, moveClip, duplicateClip]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverCell(null);
    setIsCopyDrag(false);
    dragDataRef.current = null;
  }, []);

  return (
    <div className="timeline" ref={timelineRef}>
      <div className="timeline-inner">
        {/* Section markers above bar headers */}
        <SectionManager />

        {/* Loop region ruler */}
        <div className="timeline-ruler" onDoubleClick={handleRulerDoubleClick}>
          {bars.map((bar) => {
            const inLoop = loopRegion && bar >= loopRegion.startBar && bar < loopRegion.endBar;
            const inDrag = loopDragRange && bar >= loopDragRange.start && bar <= loopDragRange.end;
            return (
              <div
                key={bar}
                className={`ruler-cell${inLoop ? ' in-loop' : ''}${inDrag ? ' loop-dragging' : ''}`}
                onMouseDown={(e) => handleRulerMouseDown(e, bar)}
              >
                {bar + 1}
              </div>
            );
          })}
          {/* Loop region overlay on ruler */}
          {loopRegion && (
            <div
              className="loop-region"
              style={{
                left: `${loopRegion.startBar * 80}px`,
                width: `${(loopRegion.endBar - loopRegion.startBar) * 80}px`,
              }}
            />
          )}
        </div>

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
            <div key={track.id} className="track-row-group">
            <div
              className={`track-row${selectedTrackId === track.id ? ' selected' : ''}`}
            >
              {/* Automation toggle button overlaid on left edge */}
              <button
                className={`btn-automation-toggle${automationVisible[track.id] ? ' active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAutomationVisibility(track.id);
                }}
                title="Toggle automation lanes"
              >
                A
              </button>
              {bars.map((bar) => {
                const clipId = track.clips[bar];
                const clip = clipId ? project.clips[clipId] : null;
                const trackColor = TRACK_COLORS[track.type] || TRACK_COLORS.custom;
                const isDragOver =
                  dragOverCell?.trackId === track.id && dragOverCell?.bar === bar;

                // Check if covered by multi-bar clip from an earlier bar
                const multiBarCover = getMultiBarClipCover(track, bar);
                const isCoveredByMultiBar = !!multiBarCover;

                // Display duration (use resize state if actively resizing this clip)
                const displayDuration =
                  resizeState && clip && resizeState.clipId === clipId && resizeState.startBar === bar
                    ? resizeState.currentDuration
                    : clip?.durationBars ?? 1;

                // Is this cell within a resize preview range?
                const isResizePreview =
                  resizeState &&
                  resizeState.trackId === track.id &&
                  bar > resizeState.startBar &&
                  bar < resizeState.startBar + resizeState.currentDuration;

                return (
                  <div
                    key={bar}
                    className={`track-cell${clip ? ' has-clip' : ''}${isDragOver && !clip && !isCoveredByMultiBar ? ' drag-over' : ''}${isDragOver && !clip && isCopyDrag ? ' drag-copy' : ''}${isCoveredByMultiBar ? ' covered-by-multibar' : ''}${isResizePreview ? ' resize-preview' : ''}`}
                    onClick={() => handleCellClick(track.id, bar)}
                    onContextMenu={
                      clip
                        ? (e) => handleContextMenu(e, track.id, bar, clipId!)
                        : isCoveredByMultiBar
                        ? (e) => handleContextMenu(e, track.id, multiBarCover!.startBar, multiBarCover!.clipId)
                        : undefined
                    }
                    onDragOver={(e) => handleDragOver(e, track.id, bar)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, track.id, bar)}
                  >
                    {clip ? (
                      <div
                        className={`clip${selectedClipId === clipId ? ' selected' : ''}${resizeState && resizeState.clipId === clipId ? ' clip-resizing' : ''}`}
                        style={{
                          backgroundColor: clip.color || trackColor,
                          width:
                            displayDuration > 1
                              ? `calc(${displayDuration * 100}% + ${(displayDuration - 1) * 1}px)`
                              : '100%',
                          zIndex: displayDuration > 1 ? 2 : undefined,
                        }}
                        title={`${clip.name}\n${clip.pattern || '(empty pattern)'}\nDuration: ${displayDuration} bar${displayDuration > 1 ? 's' : ''}`}
                        draggable={!resizeRef.current}
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
                        {/* Resize handle on right edge */}
                        <div
                          className="clip-resize-handle"
                          onMouseDown={(e) =>
                            handleResizeStart(e, clipId!, track.id, bar, displayDuration)
                          }
                        />
                      </div>
                    ) : isCoveredByMultiBar ? (
                      null
                    ) : (
                      <div className="empty-cell-plus">+</div>
                    )}
                    {isDragOver && !clip && !isCoveredByMultiBar && isCopyDrag && (
                      <div className="drag-copy-indicator">+</div>
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
            {/* Automation lanes below the track row */}
            {automationVisible[track.id] && (
              <div className="automation-lanes-container">
                {(track.automationLanes || []).map((lane) => (
                  <AutomationLane
                    key={lane.id}
                    lane={lane}
                    trackId={track.id}
                    totalBars={project.totalBars}
                  />
                ))}
                <div className="automation-add-row">
                  <AddAutomationDropdown
                    trackId={track.id}
                    existingParams={(track.automationLanes || []).map((l) => l.parameter)}
                  />
                </div>
              </div>
            )}
            </div>
          ))}

          {/* Playhead */}
          {isPlaying && (
            <div
              className="playhead"
              style={{ left: `${currentBar * 80 + 40}px` }}
            />
          )}

          {/* Loop region overlay on tracks area */}
          {loopRegion && (
            <div
              className="loop-region-tracks"
              style={{
                left: `${loopRegion.startBar * 80}px`,
                width: `${(loopRegion.endBar - loopRegion.startBar) * 80}px`,
              }}
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
            className="context-menu-item"
            onClick={handleFillRight}
          >
            Fill Right
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
