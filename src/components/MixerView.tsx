import React, { useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { TRACK_COLORS } from '../engine/types';
import type { Track as TrackType, MasterEffects } from '../engine/types';

/* ---- helpers ---- */

function volumeToDb(v: number): string {
  if (v <= 0) return '-inf';
  const db = 20 * Math.log10(v);
  return db.toFixed(1);
}

function pctLabel(v: number): string {
  return Math.round(v * 100).toString();
}

/* ---- Rotary Knob ---- */

interface KnobProps {
  value: number;       // 0-1
  onChange: (v: number) => void;
  label: string;
  color?: string;
  size?: number;
}

const Knob: React.FC<KnobProps> = ({ value, onChange, label, color = 'var(--accent)', size = 36 }) => {
  const startAngle = -135;
  const endAngle = 135;
  const angle = startAngle + value * (endAngle - startAngle);
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const rad = (angle * Math.PI) / 180;
  const ix = cx + r * 0.6 * Math.sin(rad);
  const iy = cy - r * 0.6 * Math.cos(rad);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startVal = value;
      const onMove = (ev: MouseEvent) => {
        const delta = (startY - ev.clientY) / 120;
        const next = Math.min(1, Math.max(0, startVal + delta));
        onChange(next);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [value, onChange]
  );

  return (
    <div className="mixer-knob-wrapper">
      <svg
        width={size}
        height={size}
        className="mixer-knob"
        onMouseDown={handleMouseDown}
      >
        {/* track arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        {/* value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${value * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={2 * Math.PI * r * 0.375}
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* center dot */}
        <circle cx={cx} cy={cy} r={r - 6} fill="rgba(0,0,0,0.5)" />
        {/* indicator line */}
        <line x1={cx} y1={cy} x2={ix} y2={iy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      </svg>
      <span className="mixer-knob-label">{label}</span>
      <span className="mixer-knob-value">{pctLabel(value)}</span>
    </div>
  );
};

/* ---- Channel Strip ---- */

interface ChannelStripProps {
  track: TrackType;
}

const ChannelStrip: React.FC<ChannelStripProps> = ({ track }) => {
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume);
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute);
  const toggleTrackSolo = useProjectStore((s) => s.toggleTrackSolo);
  const setTrackPan = useProjectStore((s) => s.setTrackPan);
  const setTrackEffects = useProjectStore((s) => s.setTrackEffects);

  const trackColor = TRACK_COLORS[track.type] || '#888';
  const pan = track.pan ?? 0.5;

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTrackVolume(track.id, parseFloat(e.target.value));
    },
    [track.id, setTrackVolume]
  );

  const handlePanChange = useCallback(
    (v: number) => setTrackPan(track.id, v),
    [track.id, setTrackPan]
  );

  const handleDelaySend = useCallback(
    (v: number) => setTrackEffects(track.id, { delay: v }),
    [track.id, setTrackEffects]
  );

  const handleReverbSend = useCallback(
    (v: number) => setTrackEffects(track.id, { reverb: v }),
    [track.id, setTrackEffects]
  );

  return (
    <div className="mixer-channel">
      <div className="mixer-channel-label" style={{ borderTopColor: trackColor }}>
        <span className="mixer-channel-name">{track.name}</span>
        <span className="mixer-channel-type">{track.type}</span>
      </div>

      <div className="mixer-sends">
        <Knob value={track.effects.delay} onChange={handleDelaySend} label="DLY" color="#3498db" size={32} />
        <Knob value={track.effects.reverb} onChange={handleReverbSend} label="REV" color="#9b59b6" size={32} />
      </div>

      <Knob value={pan} onChange={handlePanChange} label="PAN" color="#f39c12" size={38} />

      <div className="mixer-fader-area">
        <div className="mixer-db">{volumeToDb(track.volume)} dB</div>
        <div className="mixer-fader-track">
          <input
            type="range"
            className="mixer-fader"
            min={0}
            max={1}
            step={0.01}
            value={track.volume}
            onChange={handleVolumeChange}
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
          <div
            className="mixer-fader-fill"
            style={{ height: `${track.volume * 100}%`, background: trackColor }}
          />
        </div>
      </div>

      <div className="mixer-buttons">
        <button
          className={`mixer-btn mixer-mute${track.muted ? ' active' : ''}`}
          onClick={() => toggleTrackMute(track.id)}
          title="Mute"
        >
          M
        </button>
        <button
          className={`mixer-btn mixer-solo${track.solo ? ' active' : ''}`}
          onClick={() => toggleTrackSolo(track.id)}
          title="Solo"
        >
          S
        </button>
      </div>
    </div>
  );
};

/* ---- Master Strip ---- */

const MasterStrip: React.FC = () => {
  const masterEffects = useProjectStore((s) => s.project.masterEffects);
  const setMasterEffects = useProjectStore((s) => s.setMasterEffects);

  const handleChange = useCallback(
    (key: keyof MasterEffects, v: number) => setMasterEffects({ [key]: v }),
    [setMasterEffects]
  );

  // Use a pseudo master volume derived from compression (or just show controls)
  return (
    <div className="mixer-channel mixer-master">
      <div className="mixer-channel-label mixer-master-label">
        <span className="mixer-channel-name">MASTER</span>
        <span className="mixer-channel-type">bus</span>
      </div>

      <div className="mixer-sends mixer-master-sends">
        <Knob value={masterEffects.delay} onChange={(v) => handleChange('delay', v)} label="DLY" color="#3498db" size={32} />
        <Knob value={masterEffects.reverb} onChange={(v) => handleChange('reverb', v)} label="REV" color="#9b59b6" size={32} />
      </div>

      <Knob
        value={masterEffects.compression}
        onChange={(v) => handleChange('compression', v)}
        label="COMP"
        color="#e74c3c"
        size={38}
      />

      <div className="mixer-fader-area">
        <div className="mixer-db mixer-master-db">Master</div>
        <div className="mixer-fader-track mixer-master-fader-track">
          <div className="mixer-master-meter">
            <div className="mixer-master-meter-fill" style={{ height: `${(1 - masterEffects.compression) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="mixer-buttons">
        {/* No mute/solo for master, just a spacer */}
      </div>
    </div>
  );
};

/* ---- MixerView ---- */

export const MixerView: React.FC = () => {
  const tracks = useProjectStore((s) => s.project.tracks);
  const showMixer = useProjectStore((s) => s.showMixer);
  const toggleMixer = useProjectStore((s) => s.toggleMixer);

  if (!showMixer) return null;

  return (
    <div className="mixer-panel">
      <div className="mixer-header">
        <span className="mixer-title">MIXER</span>
        <button className="btn btn-sm mixer-close-btn" onClick={toggleMixer} title="Close Mixer">
          X
        </button>
      </div>
      <div className="mixer-channels">
        {tracks.map((track) => (
          <ChannelStrip key={track.id} track={track} />
        ))}
        <div className="mixer-master-divider" />
        <MasterStrip />
      </div>
    </div>
  );
};
