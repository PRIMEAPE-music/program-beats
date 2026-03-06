import React, { useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { TrackEffects } from '../engine/types';
import '../styles/production.css';

interface EffectsPanelProps {
  trackId: string;
  effects: TrackEffects;
}

/**
 * Converts a linear slider value (0-1) to a logarithmic frequency (20-20000 Hz).
 */
function linearToLog(value: number): number {
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);
  return Math.round(Math.pow(10, minLog + value * (maxLog - minLog)));
}

/**
 * Converts a frequency (20-20000 Hz) to a linear slider value (0-1).
 */
function logToLinear(freq: number): number {
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);
  return (Math.log10(freq) - minLog) / (maxLog - minLog);
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ trackId, effects }) => {
  const setTrackEffects = useProjectStore((s) => s.setTrackEffects);

  const handleChange = useCallback(
    (key: keyof TrackEffects, value: number) => {
      setTrackEffects(trackId, { [key]: value });
    },
    [trackId, setTrackEffects]
  );

  return (
    <div className="effects-panel">
      <div className="effects-panel-title">Effects</div>

      {/* Delay */}
      <div className="effect-row">
        <span className="effect-label">Delay</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effects.delay}
          onChange={(e) => handleChange('delay', parseFloat(e.target.value))}
        />
        <span className="effect-value">{effects.delay.toFixed(2)}</span>
      </div>

      {/* Reverb */}
      <div className="effect-row">
        <span className="effect-label">Reverb</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effects.reverb}
          onChange={(e) => handleChange('reverb', parseFloat(e.target.value))}
        />
        <span className="effect-value">{effects.reverb.toFixed(2)}</span>
      </div>

      {/* Low Pass Filter */}
      <div className="effect-row">
        <span className="effect-label">LPF</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={logToLinear(effects.lpf)}
          onChange={(e) => handleChange('lpf', linearToLog(parseFloat(e.target.value)))}
        />
        <span className="effect-value">{effects.lpf} Hz</span>
      </div>

      {/* High Pass Filter */}
      <div className="effect-row">
        <span className="effect-label">HPF</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={logToLinear(effects.hpf)}
          onChange={(e) => handleChange('hpf', linearToLog(parseFloat(e.target.value)))}
        />
        <span className="effect-value">{effects.hpf} Hz</span>
      </div>

      {/* Distortion */}
      <div className="effect-row">
        <span className="effect-label">Distortion</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effects.distortion}
          onChange={(e) => handleChange('distortion', parseFloat(e.target.value))}
        />
        <span className="effect-value">{effects.distortion.toFixed(2)}</span>
      </div>
    </div>
  );
};
