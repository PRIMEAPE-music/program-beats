import React, { useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';

interface TransportProps {
  onOpenSamples: () => void;
}

export const Transport: React.FC<TransportProps> = ({ onOpenSamples }) => {
  const project = useProjectStore((s) => s.project);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const currentBar = useProjectStore((s) => s.currentBar);
  const setPlaying = useProjectStore((s) => s.setPlaying);
  const setBpm = useProjectStore((s) => s.setBpm);
  const setProject = useProjectStore((s) => s.setProject);
  const newProject = useProjectStore((s) => s.newProject);
  const saveProject = useProjectStore((s) => s.saveProject);

  const handlePlayStop = useCallback(() => {
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleBpmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0 && val <= 300) {
        setBpm(val);
      }
    },
    [setBpm]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProject({ ...project, name: e.target.value });
    },
    [project, setProject]
  );

  const handleNewProject = useCallback(() => {
    if (window.confirm('Start a new project? Unsaved changes will be lost.')) {
      newProject();
    }
  }, [newProject]);

  return (
    <div className="transport-bar">
      <div className="transport-left">
        <button
          className="btn btn-play btn-icon"
          onClick={handlePlayStop}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '\u23F9' : '\u25B6'}
        </button>
        <div className="bar-display">
          Bar {currentBar + 1}
        </div>
      </div>

      <div className="transport-center">
        <input
          className="project-name"
          type="text"
          value={project.name}
          onChange={handleNameChange}
          title="Project name"
        />
        <div className="bpm-group">
          <label htmlFor="bpm-input">BPM</label>
          <input
            id="bpm-input"
            className="bpm-input"
            type="number"
            min={20}
            max={300}
            value={project.bpm}
            onChange={handleBpmChange}
          />
        </div>
      </div>

      <div className="transport-right">
        <button className="btn btn-sm" onClick={onOpenSamples}>
          Samples
        </button>
        <button className="btn btn-sm" onClick={saveProject}>
          Save
        </button>
        <button className="btn btn-sm" onClick={handleNewProject}>
          New
        </button>
      </div>
    </div>
  );
};
