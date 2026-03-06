import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { strudelEngine } from '../engine/StrudelEngine';

type VisualizerMode = 'waveform' | 'spectrum';

export const Visualizer: React.FC = () => {
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const [mode, setMode] = useState<VisualizerMode>('waveform');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Set up AnalyserNode
  useEffect(() => {
    const audioContext = strudelEngine.getAudioContext();
    if (!audioContext) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Connect to the audio destination to capture output
    audioContext.destination.connect(analyser);

    analyserRef.current = analyser;

    return () => {
      try {
        audioContext.destination.disconnect(analyser);
      } catch {
        // ignore if already disconnected
      }
      analyserRef.current = null;
    };
  }, [isPlaying]);

  // Draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (mode === 'waveform') {
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2ecc71';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    } else {
      // Spectrum mode
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        // Gradient: low=blue, mid=green, high=red
        const ratio = i / bufferLength;
        let r: number, g: number, b: number;
        if (ratio < 0.33) {
          // Blue to green
          const t = ratio / 0.33;
          r = 0;
          g = Math.floor(t * 200);
          b = Math.floor((1 - t) * 255);
        } else if (ratio < 0.66) {
          // Green to yellow
          const t = (ratio - 0.33) / 0.33;
          r = Math.floor(t * 200);
          g = 200;
          b = 0;
        } else {
          // Yellow to red
          const t = (ratio - 0.66) / 0.34;
          r = 200 + Math.floor(t * 55);
          g = Math.floor((1 - t) * 200);
          b = 0;
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
        if (x > width) break;
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [mode]);

  // Start/stop animation with playback
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      animFrameRef.current = requestAnimationFrame(draw);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      // Clear canvas when stopped
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0d0d1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, draw]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'waveform' ? 'spectrum' : 'waveform'));
  }, []);

  return (
    <div className="visualizer-panel">
      <div className="visualizer-header">
        <span className="visualizer-title">Audio</span>
        <button
          className={`btn btn-sm btn-visualizer-mode`}
          onClick={toggleMode}
          title={`Switch to ${mode === 'waveform' ? 'Spectrum' : 'Waveform'}`}
        >
          {mode === 'waveform' ? 'Wave' : 'Spec'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="visualizer-canvas"
        width={280}
        height={80}
      />
    </div>
  );
};
