import React, { useCallback, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { TRACK_COLORS } from '../engine/types';
import type { Track as TrackData } from '../engine/types';
import { EffectsPanel } from './EffectsPanel';
import '../styles/production.css';

interface TrackProps {
  track: TrackData;
}

export const Track: React.FC<TrackProps> = ({ track }) => {
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const selectTrack = useProjectStore((s) => s.selectTrack);
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume);
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute);
  const toggleTrackSolo = useProjectStore((s) => s.toggleTrackSolo);
  const removeTrack = useProjectStore((s) => s.removeTrack);

  const [showFx, setShowFx] = useState(false);

  const isSelected = selectedTrackId === track.id;
  const trackColor = TRACK_COLORS[track.type] || TRACK_COLORS.custom;

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTrackVolume(track.id, parseFloat(e.target.value));
    },
    [track.id, setTrackVolume]
  );

  const handleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTrackMute(track.id);
    },
    [track.id, toggleTrackMute]
  );

  const handleSolo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTrackSolo(track.id);
    },
    [track.id, toggleTrackSolo]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`Delete track "${track.name}"?`)) {
        removeTrack(track.id);
      }
    },
    [track.id, track.name, removeTrack]
  );

  return (
    <div
      className={`track-header${isSelected ? ' selected' : ''}`}
      onClick={() => selectTrack(track.id)}
      style={{ opacity: track.muted ? 0.5 : 1 }}
    >
      <div className="track-top">
        <div className="track-name">
          <span className="track-type-dot" style={{ backgroundColor: trackColor }} />
          {track.name}
        </div>
        <div className="track-controls">
          <button
            className={`btn-mute${track.muted ? ' active' : ''}`}
            onClick={handleMute}
            title="Mute"
          >
            M
          </button>
          <button
            className={`btn-solo${track.solo ? ' active' : ''}`}
            onClick={handleSolo}
            title="Solo"
          >
            S
          </button>
          <button
            className={`btn-fx${showFx ? ' active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowFx((v) => !v);
            }}
            title="Toggle effects"
          >
            FX
          </button>
          <button
            className="btn-delete-track"
            onClick={handleDelete}
            title="Delete track"
          >
            &#x2715;
          </button>
        </div>
      </div>
      <div className="track-bottom">
        <input
          className="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={track.volume}
          onChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
          title={`Volume: ${Math.round(track.volume * 100)}%`}
        />
      </div>
      {showFx && <EffectsPanel trackId={track.id} effects={track.effects} />}
    </div>
  );
};
