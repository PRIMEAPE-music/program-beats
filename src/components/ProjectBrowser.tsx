import React, { useState, useEffect, useCallback } from 'react';
import type { Project } from '../engine/types';
import { exportProjectAsJson, importProjectFromJson } from '../engine/ProjectIO';

const STORAGE_KEY = 'program-beats-project';

export interface ProjectBrowserProps {
  onClose: () => void;
  onLoadProject: (id: string) => void;
}

interface ProjectEntry {
  id: string;
  name: string;
  bpm: number;
  trackCount: number;
  totalBars: number;
  raw: Project;
}

export const ProjectBrowser: React.FC<ProjectBrowserProps> = ({ onClose, onLoadProject }) => {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadProjects = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
      const entries: ProjectEntry[] = [];
      for (const [id, json] of Object.entries(saved)) {
        try {
          const proj = JSON.parse(json) as Project;
          entries.push({
            id,
            name: proj.name,
            bpm: proj.bpm,
            trackCount: proj.tracks?.length ?? 0,
            totalBars: proj.totalBars ?? 0,
            raw: proj,
          });
        } catch {
          // skip corrupt entries
        }
      }
      setProjects(entries);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
      delete saved[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setConfirmDeleteId(null);
      loadProjects();
    } catch {
      // ignore
    }
  };

  const handleRenameStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleRenameConfirm = (id: string) => {
    if (!editName.trim()) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
      if (saved[id]) {
        const proj = JSON.parse(saved[id]) as Project;
        proj.name = editName.trim();
        saved[id] = JSON.stringify(proj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      }
      setEditingId(null);
      loadProjects();
    } catch {
      // ignore
    }
  };

  const handleExport = (entry: ProjectEntry) => {
    exportProjectAsJson(entry.raw);
  };

  const handleImport = async () => {
    try {
      const project = await importProjectFromJson();
      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
      saved[project.id] = JSON.stringify(project);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      loadProjects();
    } catch (e) {
      // User cancelled or bad file - ignore
      if ((e as Error).message && !(e as Error).message.includes('cancelled')) {
        console.error('Import failed:', e);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="project-browser" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Projects</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        <div className="project-browser-actions">
          <button className="btn" onClick={handleImport}>
            Import JSON
          </button>
        </div>

        <div className="project-list">
          {projects.length === 0 && (
            <div className="project-list-empty">No saved projects found.</div>
          )}
          {projects.map((entry) => (
            <div key={entry.id} className="project-item">
              <div className="project-item-info">
                {editingId === entry.id ? (
                  <input
                    className="project-rename-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameConfirm(entry.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleRenameConfirm(entry.id)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="project-item-name"
                    onDoubleClick={() => handleRenameStart(entry.id, entry.name)}
                    title="Double-click to rename"
                  >
                    {entry.name}
                  </span>
                )}
                <span className="project-item-meta">
                  {entry.bpm} BPM | {entry.trackCount} tracks | {entry.totalBars} bars
                </span>
              </div>
              <div className="project-item-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    onLoadProject(entry.id);
                    onClose();
                  }}
                >
                  Load
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleRenameStart(entry.id, entry.name)}
                >
                  Rename
                </button>
                <button className="btn btn-sm" onClick={() => handleExport(entry)}>
                  Export
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(entry.id)}
                >
                  {confirmDeleteId === entry.id ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
