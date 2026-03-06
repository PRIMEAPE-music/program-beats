import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { exporter } from '../engine/Exporter';
import { strudelEngine } from '../engine/StrudelEngine';
import { Scheduler } from '../engine/Scheduler';

interface ExportDialogProps {
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose }) => {
  const project = useProjectStore((s) => s.project);
  const [status, setStatus] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  // Calculate total duration in seconds
  const beatsPerBar = 4;
  const totalDurationSec = (project.totalBars * beatsPerBar * 60) / project.bpm;

  const handleStartRecording = useCallback(async () => {
    cancelledRef.current = false;
    setStatus('recording');
    setProgress(0);
    setErrorMsg('');

    try {
      const audioContext = strudelEngine.getAudioContext();
      if (!audioContext) {
        throw new Error('Audio engine not initialized. Please play something first.');
      }

      // Start recording using the MediaStreamDestination approach
      const streamDest = exporter.startRecordingWithNode(audioContext);

      // Connect the audio context destination to the stream
      // We need a gain node to tap into the audio
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(streamDest);
      gainNode.connect(audioContext.destination);

      // Build and play the arrangement
      const arrangementPattern = Scheduler.buildArrangementPattern(project);
      if (!arrangementPattern || arrangementPattern === 'silence') {
        exporter.cancelRecording();
        throw new Error('No patterns to export. Add some clips first.');
      }

      strudelEngine.playPatternString(arrangementPattern);

      // Update progress
      const startTime = Date.now();
      const totalMs = totalDurationSec * 1000;

      timerRef.current = window.setInterval(() => {
        if (cancelledRef.current) return;

        const elapsed = Date.now() - startTime;
        const pct = Math.min(elapsed / totalMs, 1);
        setProgress(pct);

        if (pct >= 1) {
          // Recording complete
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          strudelEngine.stop();

          exporter.stopRecording().then((recordedBlob) => {
            // Disconnect the tap node
            try {
              gainNode.disconnect(streamDest);
              gainNode.disconnect(audioContext.destination);
            } catch { /* ignore */ }

            setBlob(recordedBlob);
            setStatus('done');
          }).catch((err) => {
            setErrorMsg(err.message);
            setStatus('error');
          });
        }
      }, 100);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, [project, totalDurationSec]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    exporter.cancelRecording();
    strudelEngine.stop();
    setStatus('idle');
    setProgress(0);
  }, []);

  const handleDownload = useCallback(() => {
    if (!blob) return;
    const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'export';
    exporter.downloadWav(blob, `${safeName}.webm`);
  }, [blob, project.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (exporter.isRecording()) {
        exporter.cancelRecording();
      }
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-dialog modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Export Audio</h2>

        <div className="export-info">
          <div className="export-info-row">
            <span className="export-label">Project:</span>
            <span className="export-value">{project.name}</span>
          </div>
          <div className="export-info-row">
            <span className="export-label">BPM:</span>
            <span className="export-value">{project.bpm}</span>
          </div>
          <div className="export-info-row">
            <span className="export-label">Duration:</span>
            <span className="export-value">
              {project.totalBars} bars ({totalDurationSec.toFixed(1)}s)
            </span>
          </div>
        </div>

        {status === 'recording' && (
          <div className="export-progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="export-progress-text">
              Recording... {Math.round(progress * 100)}%
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="export-error">
            {errorMsg}
          </div>
        )}

        <div className="export-actions">
          {status === 'idle' && (
            <>
              <button className="btn btn-accent" onClick={handleStartRecording}>
                Start Recording
              </button>
              <button className="btn" onClick={onClose}>
                Cancel
              </button>
            </>
          )}

          {status === 'recording' && (
            <button className="btn btn-danger" onClick={handleCancel}>
              Cancel Recording
            </button>
          )}

          {status === 'done' && (
            <>
              <button className="btn btn-accent" onClick={handleDownload}>
                Download
              </button>
              <button className="btn" onClick={onClose}>
                Close
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <button className="btn btn-accent" onClick={handleStartRecording}>
                Retry
              </button>
              <button className="btn" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
