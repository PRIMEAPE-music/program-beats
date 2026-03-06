import type { Project } from './types';

/**
 * Export a project as a JSON file download.
 */
export function exportProjectAsJson(project: Project): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a project from a JSON file via the file picker.
 * Validates that the loaded data has the required Project fields.
 */
export function importProjectFromJson(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          // Validate required fields
          if (!data.id || typeof data.id !== 'string') {
            throw new Error('Missing or invalid "id" field');
          }
          if (!data.name || typeof data.name !== 'string') {
            throw new Error('Missing or invalid "name" field');
          }
          if (typeof data.bpm !== 'number') {
            throw new Error('Missing or invalid "bpm" field');
          }
          if (!Array.isArray(data.tracks)) {
            throw new Error('Missing or invalid "tracks" field');
          }
          if (!data.clips || typeof data.clips !== 'object') {
            throw new Error('Missing or invalid "clips" field');
          }
          if (typeof data.totalBars !== 'number') {
            throw new Error('Missing or invalid "totalBars" field');
          }

          // Fill in optional fields with defaults if missing
          if (!data.sections) data.sections = [];
          if (!data.masterEffects) {
            data.masterEffects = { reverb: 0.1, delay: 0, compression: 0.3 };
          }
          if (!data.scaleConfig) {
            data.scaleConfig = { root: 'C', scale: 'minor' };
          }

          // Ensure each track has effects
          for (const track of data.tracks) {
            if (!track.effects) {
              track.effects = { delay: 0, reverb: 0, lpf: 20000, hpf: 20, distortion: 0 };
            }
          }

          resolve(data as Project);
        } catch (e) {
          reject(new Error(`Invalid project file: ${(e as Error).message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    // Handle cancel
    input.oncancel = () => reject(new Error('File selection cancelled'));

    input.click();
  });
}
