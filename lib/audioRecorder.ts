'use client';

import { audioEngine } from '@/lib/AudioEngine';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
  format: 'wav' | 'mp3' | 'webm';
}

class SetRecorderEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private currentDuration = 0;
  private stateListeners: Set<(state: RecordingState) => void> = new Set();
  private streamDestination: MediaStreamAudioDestinationNode | null = null;

  private currentState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    recordedBlob: null,
    format: 'wav',
  };

  /**
   * Start recording live master output from AudioEngine master gain
   */
  public startRecording(format: 'wav' | 'mp3' | 'webm' = 'wav'): boolean {
    try {
      const ctx = audioEngine.getAudioContext();
      const masterNode = audioEngine.getMasterGainNode();

      if (!ctx || !masterNode) {
        console.error('AudioContext or MasterGainNode not available');
        return false;
      }

      // Tap master output stream
      this.streamDestination = ctx.createMediaStreamDestination();
      masterNode.connect(this.streamDestination);

      if (!this.streamDestination) {
        return false;
      }

      const mimeType = 
        format === 'mp3' && MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';

      this.mediaRecorder = new MediaRecorder(this.streamDestination.stream, mimeType ? { mimeType } : undefined);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const rawBlob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
        this.updateState({
          isRecording: false,
          isPaused: false,
          recordedBlob: rawBlob,
          format,
        });
      };

      this.mediaRecorder.start(100);
      this.startTime = Date.now();
      this.currentDuration = 0;

      this.timerInterval = setInterval(() => {
        this.currentDuration = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateState({ duration: this.currentDuration });
      }, 500);

      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        recordedBlob: null,
        format,
      });

      return true;
    } catch (err) {
      console.error('Failed to start set recording:', err);
      return false;
    }
  }

  /**
   * Stop recording and compile final audio blob
   */
  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (this.timerInterval) clearInterval(this.timerInterval);

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const rawBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          this.updateState({
            isRecording: false,
            isPaused: false,
            recordedBlob: rawBlob,
          });
          resolve(rawBlob);
        };
        this.mediaRecorder.stop();
      } else {
        resolve(this.currentState.recordedBlob);
      }
    });
  }

  /**
   * Download recorded set to DJ's computer / USB drive
   */
  public downloadRecordedSet(filename = 'HENRY_IX_LIVE_SET'): void {
    if (!this.currentState.recordedBlob) return;

    const ext = this.currentState.format === 'wav' ? 'wav' : this.currentState.format === 'mp3' ? 'mp3' : 'webm';
    const url = URL.createObjectURL(this.currentState.recordedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  public subscribe(listener: (state: RecordingState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => this.stateListeners.delete(listener);
  }

  private updateState(partial: Partial<RecordingState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.stateListeners.forEach(l => l(this.currentState));
  }

  public getState(): RecordingState {
    return this.currentState;
  }
}

export const setRecorder = new SetRecorderEngine();
