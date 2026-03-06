import React, { useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { MasterEffects as MasterEffectsType } from '../engine/types';
import '../styles/production.css';

export const MasterEffects: React.FC = () => {
  const masterEffects = useProjectStore((s) => s.project.masterEffects);
  const setMasterEffects = useProjectStore((s) => s.setMasterEffects);

  const handleChange = useCallback(
    (key: keyof MasterEffectsType, value: number) => {
      setMasterEffects({ [key]: value });
    },
    [setMasterEffects]
  );

  return (
    <div className="master-effects">
      <div className="master-effects-title">Master Effects</div>

      <div className="effect-row">
        <span className="effect-label">Reverb</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterEffects.reverb}
          onChange={(e) => handleChange('reverb', parseFloat(e.target.value))}
        />
        <span className="effect-value">{masterEffects.reverb.toFixed(2)}</span>
      </div>

      <div className="effect-row">
        <span className="effect-label">Delay</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterEffects.delay}
          onChange={(e) => handleChange('delay', parseFloat(e.target.value))}
        />
        <span className="effect-value">{masterEffects.delay.toFixed(2)}</span>
      </div>

      <div className="effect-row">
        <span className="effect-label">Compression</span>
        <input
          className="effect-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterEffects.compression}
          onChange={(e) => handleChange('compression', parseFloat(e.target.value))}
        />
        <span className="effect-value">{masterEffects.compression.toFixed(2)}</span>
      </div>
    </div>
  );
};
