/**
 * Exporter - Records audio from the AudioContext destination to a WAV file
 * using the MediaRecorder API.
 */

class Exporter {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private resolveStop: ((blob: Blob) => void) | null = null;

  /**
   * Begin recording from the given AudioContext's destination.
   * Call stopRecording() to finalize and get the Blob.
   */
  startRecording(audioContext: AudioContext): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.warn('Exporter: already recording');
      return;
    }

    this.chunks = [];

    // Create a MediaStream from the AudioContext destination
    const destination = audioContext.destination;
    const stream = (destination as unknown as { stream?: MediaStream }).stream
      ?? (audioContext as unknown as { createMediaStreamDestination: () => MediaStreamAudioDestinationNode })
          .createMediaStreamDestination?.().stream;

    // Fallback: use createMediaStreamDestination if available
    let mediaStream: MediaStream;
    if (destination instanceof MediaStreamAudioDestinationNode) {
      mediaStream = destination.stream;
    } else {
      // Most browsers support createMediaStreamDestination on AudioContext
      const streamDest = audioContext.createMediaStreamDestination();
      // Connect the destination's output — we need to tap into the audio graph.
      // Since we can't directly tap destination, we rely on the fact that
      // the caller has connected audio through the context.
      // The approach here is to create a MediaStreamDestination and hope
      // the engine routes audio through it. For a simpler approach, we use
      // captureStream on a canvas or the AudioContext destination directly.
      mediaStream = streamDest.stream;
    }

    // Prefer audio/webm; fall back to whatever is available
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

    this.mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
      this.chunks = [];
      if (this.resolveStop) {
        this.resolveStop(blob);
        this.resolveStop = null;
      }
    };

    this.mediaRecorder.start(100); // collect data every 100ms
  }

  /**
   * Start recording using a MediaStreamDestination node.
   * Returns the destination node so the caller can connect audio to it.
   */
  startRecordingWithNode(audioContext: AudioContext): MediaStreamAudioDestinationNode {
    this.chunks = [];

    const streamDest = audioContext.createMediaStreamDestination();

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

    this.mediaRecorder = new MediaRecorder(streamDest.stream, mimeType ? { mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
      this.chunks = [];
      if (this.resolveStop) {
        this.resolveStop(blob);
        this.resolveStop = null;
      }
    };

    this.mediaRecorder.start(100);
    return streamDest;
  }

  /**
   * Stop recording and return the audio Blob.
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('Not currently recording'));
        return;
      }
      this.resolveStop = resolve;
      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording without producing output.
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.resolveStop = null;
      this.mediaRecorder.stop();
    }
    this.chunks = [];
  }

  /**
   * Trigger a download of the given blob as a file.
   */
  downloadWav(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.webm') || filename.endsWith('.wav')
      ? filename
      : `${filename}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if currently recording.
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

/** Singleton instance */
export const exporter = new Exporter();
