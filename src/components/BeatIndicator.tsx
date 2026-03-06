import React from 'react';

interface BeatIndicatorProps {
  bpm: number;
  isPlaying: boolean;
}

export const BeatIndicator: React.FC<BeatIndicatorProps> = ({ bpm, isPlaying }) => {
  const beatDuration = 60 / bpm;

  return (
    <div
      className={`beat-indicator${isPlaying ? ' beat-active' : ''}`}
      style={
        isPlaying
          ? { animationDuration: `${beatDuration}s` }
          : undefined
      }
    />
  );
};
