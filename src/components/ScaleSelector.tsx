import React, { useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import '../styles/production.css';

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const SCALES = [
  'major',
  'minor',
  'dorian',
  'mixolydian',
  'pentatonic',
  'blues',
  'harmonic minor',
  'phrygian',
];

export const ScaleSelector: React.FC = () => {
  const scaleConfig = useProjectStore((s) => s.project.scaleConfig);
  const setScaleConfig = useProjectStore((s) => s.setScaleConfig);

  const handleRootChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setScaleConfig({ root: e.target.value });
    },
    [setScaleConfig]
  );

  const handleScaleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setScaleConfig({ scale: e.target.value });
    },
    [setScaleConfig]
  );

  return (
    <div className="scale-selector">
      <label>Key</label>
      <select value={scaleConfig.root} onChange={handleRootChange}>
        {ROOT_NOTES.map((note) => (
          <option key={note} value={note}>
            {note}
          </option>
        ))}
      </select>
      <select value={scaleConfig.scale} onChange={handleScaleChange}>
        {SCALES.map((scale) => (
          <option key={scale} value={scale}>
            {scale}
          </option>
        ))}
      </select>
      <span className="scale-display">
        {scaleConfig.root} {scaleConfig.scale}
      </span>
    </div>
  );
};
