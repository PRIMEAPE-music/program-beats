import React, { useState, useCallback, useRef } from 'react';

interface SampleFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

interface SampleManagerProps {
  onClose: () => void;
}

const ACCEPTED_TYPES = ['.wav', '.mp3', '.ogg'];
const ACCEPTED_MIME = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/x-wav', 'audio/wave'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SampleManager: React.FC<SampleManagerProps> = ({ onClose }) => {
  const [samples, setSamples] = useState<SampleFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newSamples: SampleFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (ACCEPTED_TYPES.includes(ext) || ACCEPTED_MIME.includes(file.type)) {
        newSamples.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          file,
        });
      }
    }
    setSamples((prev) => [...prev, ...newSamples]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files);
      // Reset so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  const handleRemove = useCallback((id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Sample Manager</h2>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          className={`dropzone${isDragOver ? ' active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-icon">&#x1F3B5;</div>
          <div>Drop audio files here or click to browse</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Supports WAV, MP3, OGG
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {samples.length > 0 && (
          <div className="sample-list">
            {samples.map((sample) => (
              <div key={sample.id} className="sample-item">
                <div>
                  <div className="sample-name">{sample.name}</div>
                  <div className="sample-size">{formatSize(sample.size)}</div>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleRemove(sample.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {samples.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 16, fontSize: 12 }}>
            No samples uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};
