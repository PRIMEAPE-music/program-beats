import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { TRACK_COLORS, DEFAULT_CLIP_COLORS } from '../engine/types';

interface ContextMenuState {
  x: number;
  y: number;
  trackId: string;
  barIndex: number;
  clipId: string;
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

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const bars = Array.from({ length: project.totalBars }, (_, i) => i);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [contextMenu]);

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
        // Create new clip at this position
        const trackDef = project.tracks.find((t) => t.id === trackId);
        const color =
          DEFAULT_CLIP_COLORS[
            Object.keys(project.clips).length % DEFAULT_CLIP_COLORS.length
          ];
        const newClip = {
          id: crypto.randomUUID(),
          name: `${trackDef?.name ?? 'Clip'} ${barIndex + 1}`,
          pattern: '',
          color,
          durationBars: 1,
        };
        addClip(newClip);
        placeClip(trackId, barIndex, newClip.id);
        selectClip(newClip.id);
      }
    },
    [project, selectTrack, selectClip, addClip, placeClip]
  );

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

  return (
    <div className="timeline" ref={timelineRef}>
      <div className="timeline-inner">
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

                return (
                  <div
                    key={bar}
                    className={`track-cell${clip ? ' has-clip' : ''}`}
                    onClick={() => handleCellClick(track.id, bar)}
                    onContextMenu={
                      clip
                        ? (e) => handleContextMenu(e, track.id, bar, clipId!)
                        : undefined
                    }
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
                      >
                        {clip.name}
                      </div>
                    ) : (
                      <div className="empty-cell-plus">+</div>
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
