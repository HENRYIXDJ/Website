/**
 * AudioEngine.ts
 *
 * Imperative audio DSP controller that directly manipulates Web Audio API nodes.
 * Decouples audio processing from React's render cycle, achieving instant
 * latency for EQ, filter, gain, and crossfader adjustments.
 *
 * Implements HTML5 Audio elements, SoundCloud Widgets, Phase/BPM Sync math,
 * Web Worker analysis, and real-time onset detection loops.
 */

import { useAudioStore, generateStaticPeaks } from '@/store/audioStore';
import { playClick, playLockoutBlip } from '@/lib/audioUtils';
import { calculateSyncCorrection } from '@/lib/proBeatgridEngine';

export interface DeckDSPNodes {
  trimNode: GainNode;
  lowShelf: BiquadFilterNode;
  midPeak: BiquadFilterNode;
  highShelf: BiquadFilterNode;
  filterNode: BiquadFilterNode;
  gainNode: GainNode;
  analyserNode: AnalyserNode;
}

// ---------------------------------------------------------------------------
// IndexedDB helpers for Waveform caching
// ---------------------------------------------------------------------------
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('window is undefined')); return; }
    const request = indexedDB.open('HenryIX_Waveforms', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('waveforms')) {
        request.result.createObjectStore('waveforms', { keyPath: 'fileKey' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getCachedWaveform = async (fileKey: string): Promise<{ bpm: number; peaks: number[]; firstBeatOffset?: number } | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('waveforms', 'readonly').objectStore('waveforms').get(fileKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.warn('IndexedDB read error:', e); return null; }
};

const cacheWaveform = async (fileKey: string, data: { bpm: number; peaks: number[]; firstBeatOffset?: number }) => {
  try {
    const db = await openDB();
    db.transaction('waveforms', 'readwrite').objectStore('waveforms').put({ fileKey, ...data });
  } catch (e) { console.warn('IndexedDB write error:', e); }
};

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private deckNodes: Record<number, DeckDSPNodes | null> = { 1: null, 2: null, 3: null, 4: null };

  public audioElements: Record<number, HTMLAudioElement | null> = { 1: null, 2: null, 3: null, 4: null };
  public mediaSources: Record<number, MediaElementAudioSourceNode | null> = { 1: null, 2: null, 3: null, 4: null };
  public playPending: Record<number, boolean> = { 1: false, 2: false, 3: false, 4: false };
  public scratching: Record<number, boolean> = { 1: false, 2: false, 3: false, 4: false };
  public loadedUrls: Record<number, string> = { 1: '', 2: '', 3: '', 4: '' };
  public widgetRefs: Record<number, any> = { 1: null, 2: null, 3: null, 4: null };

  public getDeckAnalyser(deckId: number): AnalyserNode | null {
    return this.deckNodes[deckId]?.analyserNode || null;
  }

  private analysisWorker: Worker | null = null;
  private workerCallbacks: Record<string, (result: any) => void> = {};
  private lcdRefs: Record<number, HTMLElement | null> = {};
  private dynamicWaveforms: Record<string, number[]> = {};

  private onsetFrameId: number | null = null;
  private lcdFrameId: number | null = null;

  // Microphone and real-time DSP analysis buffers
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private prevSpectrum: Float32Array = new Float32Array(256);
  private fluxHistory: number[] = [];

  constructor() {}

  /**
   * Set dynamic track waveforms preloaded by the provider
   */
  setDynamicWaveforms(waveforms: Record<string, number[]>) {
    this.dynamicWaveforms = waveforms;
  }

  /**
   * Initialize Web Audio Context and Master Analyser
   */
  initAudioDSP(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({
        latencyHint: 'playback',
        sampleRate: 44100
      });
      this.audioCtx = ctx;
      useAudioStore.getState().setAudioDSPInitialized(true);

      // Auto-detect and set latency offset in store (combining baseLatency and outputLatency)
      const detectedLatency = Math.round(((ctx.outputLatency || 0) + (ctx.baseLatency || 0)) * 1000) || 45;
      useAudioStore.getState().setVisualLatencyOffset(detectedLatency);

      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const masterAnalyser = ctx.createAnalyser();
      masterAnalyser.fftSize = 256;
      masterAnalyser.smoothingTimeConstant = 0.50; // Fast transient tracking for punchy drums & bass
      masterAnalyser.minDecibels = -75;
      masterAnalyser.maxDecibels = -10;
      this.masterAnalyser = masterAnalyser;

      // Soft-knee master peak limiter (prevents digital clipping across 4 decks)
      const masterLimiter = ctx.createDynamicsCompressor();
      masterLimiter.threshold.value = -0.5;
      masterLimiter.knee.value = 6;
      masterLimiter.ratio.value = 20;
      masterLimiter.attack.value = 0.003;
      masterLimiter.release.value = 0.05;

      masterAnalyser.connect(masterLimiter);
      masterLimiter.connect(ctx.destination);

      // Start tick loops
      this.startOnsetDetectionLoop();
      this.startLCDTickLoop();

      return ctx;
    } catch (e) {
      console.error('Failed to initialize Web Audio DSP:', e);
      return null;
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx || this.initAudioDSP();
  }

  public getMasterGainNode(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  public getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  /**
   * Ensure a specific deck's DSP nodes and audio elements are set up
   */
  ensureDeckInitialized(deckId: number) {
    if (typeof window === 'undefined') return;
    let ctx = this.audioCtx;
    if (!ctx) {
      ctx = this.initAudioDSP();
    }
    if (!ctx) return;
    if (this.deckNodes[deckId]) return; // already initialized

    const trimNode = ctx.createGain();
    trimNode.gain.value = 1.0;

    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 250;
    lowShelf.gain.value = 0;

    const midPeak = ctx.createBiquadFilter();
    midPeak.type = 'peaking';
    midPeak.frequency.value = 1000;
    midPeak.Q.value = 1.0;
    midPeak.gain.value = 0;

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3000;
    highShelf.gain.value = 0;

    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'peaking';
    filterNode.frequency.value = 1000;
    filterNode.Q.value = 1.0;
    filterNode.gain.value = 0;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.50;
    analyserNode.minDecibels = -75;
    analyserNode.maxDecibels = -10;

    trimNode.connect(lowShelf);
    lowShelf.connect(midPeak);
    midPeak.connect(highShelf);
    highShelf.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterAnalyser!);

    this.deckNodes[deckId] = { trimNode, lowShelf, midPeak, highShelf, filterNode, gainNode, analyserNode };

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = false;
    audio.preload = 'none';

    this.audioElements[deckId] = audio;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyserNode);
    analyserNode.connect(trimNode);
    this.mediaSources[deckId] = source;

    // Binds local audio element events to keep Zustand store in sync
    audio.addEventListener('loadedmetadata', () => {
      const state = useAudioStore.getState();
      const deck = state.decks[deckId];
      const pitch = deck?.pitch ?? 0;
      audio.playbackRate = 1 + pitch / 100;
      
      const offset = deck?.firstBeatOffset || 0;
      try {
        audio.currentTime = offset;
      } catch (e) {}
      
      let newCuePoints = deck?.cuePoints || [];
      if (newCuePoints.length === 0 || Math.abs(newCuePoints[0] - offset) > 0.05) {
        newCuePoints = [offset, ...newCuePoints.filter((c: number) => Math.abs(c - offset) > 0.05)];
      }

      useAudioStore.getState().setDeck(deckId, { 
        duration: audio.duration, 
        isReady: true,
        progress: offset,
        mainCue: offset,
        cuePoints: newCuePoints
      });
      
      // Ensure mainCue and playhead position default to firstBeatOffset if stopped
      if (!deck?.isPlaying && (audio.currentTime === 0 || audio.currentTime < offset)) {
        try {
          audio.currentTime = offset;
        } catch (e) {}
      }
    });

    audio.addEventListener('play', () => {
      useAudioStore.getState().setDeck(deckId, { isPlaying: true });
    });
    audio.addEventListener('pause', () => {
      useAudioStore.getState().setDeck(deckId, { isPlaying: false });
    });
    audio.addEventListener('ended', () => {
      useAudioStore.getState().setDeck(deckId, { isPlaying: false, progress: 0 });
    });

    let lastProgressUpdate = 0;
    audio.addEventListener('timeupdate', () => {
      const now = performance.now();
      if (now - lastProgressUpdate >= 80) {
        lastProgressUpdate = now;
        useAudioStore.getState().setDeck(deckId, { progress: audio.currentTime });

        // Auto-mark as played in session history if playing for >= 10s
        if (audio.currentTime >= 10) {
          const currentDeck = useAudioStore.getState().decks[deckId];
          if (currentDeck?.id && currentDeck.id !== 'locked') {
            useAudioStore.getState().addPlayedTrackId(currentDeck.id);
          }
        }

        // Continuous Pro DJ Link phase lock drift corrector
        const currentDeck = useAudioStore.getState().decks[deckId];
        if (currentDeck?.isPlaying && currentDeck?.syncEnabled && currentDeck?.syncMode !== 'BPM') {
          const masterDeckId = [1, 2, 3, 4].find(
            id => id !== deckId && useAudioStore.getState().decks[id]?.isPlaying && useAudioStore.getState().decks[id]?.isMaster
          ) || [1, 2, 3, 4].find(
            id => id !== deckId && useAudioStore.getState().decks[id]?.isPlaying
          );
          if (masterDeckId) {
            const deckA = useAudioStore.getState().decks[masterDeckId];
            const audioA = this.audioElements[masterDeckId];
            if (deckA && audioA && !audioA.paused) {
              const activeBpmA = deckA.bpm * (1 + (deckA.pitch || 0) / 100);
              const activeBpmB = currentDeck.bpm * (1 + (currentDeck.pitch || 0) / 100);
              const beatIntervalA = 60 / activeBpmA;
              const beatIntervalB = 60 / activeBpmB;

              const phaseA = (Math.max(0, audioA.currentTime - (deckA.firstBeatOffset || 0)) % beatIntervalA) / beatIntervalA;
              const phaseB = (Math.max(0, audio.currentTime - (currentDeck.firstBeatOffset || 0)) % beatIntervalB) / beatIntervalB;

              let phaseDiff = Math.abs(phaseA - phaseB);
              if (phaseDiff > 0.5) phaseDiff = 1.0 - phaseDiff;

              // Micro-adjust if drift exceeds ~15ms (0.04 beat)
              if (phaseDiff > 0.04) {
                const currentBeatB = Math.floor(Math.max(0, audio.currentTime - (currentDeck.firstBeatOffset || 0)) / beatIntervalB);
                const correctedTime = (currentDeck.firstBeatOffset || 0) + (currentBeatB + phaseA) * beatIntervalB;
                audio.currentTime = correctedTime;
              }
            }
          }
        }
      }
    });

    audio.addEventListener('error', () => {
      const error = audio.error;
      if (error && error.code !== error.MEDIA_ERR_ABORTED) {
        console.warn(`Audio element ${deckId} load error:`, error.message);
        useAudioStore.getState().setDeck(deckId, { isReady: false });
      }
    });

    // Synchronize initial DSP settings
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (deck) {
      this.setEQ(deckId, 'low', deck.eqLow);
      this.setEQ(deckId, 'mid', deck.eqMid);
      this.setEQ(deckId, 'high', deck.eqHi);
      this.setFilter(deckId, deck.filter);
      this.setTrim(deckId, deck.trim ?? 50);
      const cfMult = this.computeCrossfaderGain(deck.crossfaderAssign, state.crossfader);
      this.setGain(deckId, deck.volume, cfMult, state.isMuted);
    }
  }

  /**
   * Set EQ gain for a specific deck and frequency band
   */
  setEQ(deckId: number, band: 'low' | 'mid' | 'high', value: number) {
    if (!this.audioCtx || !this.deckNodes[deckId]) return;
    const nodes = this.deckNodes[deckId];
    if (!nodes) return;

    const state = useAudioStore.getState();
    const isClassic = state.eqMode === 'CLASSIC';
    const clamped = Math.max(0, Math.min(100, value));
    let gain: number;

    if (clamped <= 5) {
      // Classic Pioneer curve (-26dB) vs Isolator Total Kill (-70dB)
      gain = isClassic ? -26 : -70;
    } else if (clamped < 50) {
      const maxAtten = isClassic ? 26 : 36;
      gain = -maxAtten * Math.pow((50 - clamped) / 45, 1.25);
    } else {
      gain = (band === 'low' ? 12 : 10) * ((clamped - 50) / 50);
    }

    const node = band === 'low' ? nodes.lowShelf : band === 'mid' ? nodes.midPeak : nodes.highShelf;
    node.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.015);
  }

  /**
   * Set filter cutoff/resonance for a specific deck
   */
  setFilter(deckId: number, value: number) {
    if (!this.audioCtx || !this.deckNodes[deckId]) return;
    const nodes = this.deckNodes[deckId];
    if (!nodes) return;

    const clamped = Math.max(0, Math.min(100, value));
    const distFromCenter = Math.abs(clamped - 50) / 50;
    // Smooth Q-taper: gentle 0.707 Q at neutral 12 o'clock, increasing to 2.5 at extreme sweeps
    const dynamicQ = 0.707 + 1.8 * Math.pow(distFromCenter, 1.5);
    nodes.filterNode.Q.setTargetAtTime(dynamicQ, this.audioCtx.currentTime, 0.015);

    if (clamped < 50) {
      nodes.filterNode.type = 'lowpass';
      const pct = clamped / 50;
      const frequency = 60 + 19940 * Math.pow(pct, 2.5);
      nodes.filterNode.frequency.setTargetAtTime(frequency, this.audioCtx.currentTime, 0.015);
    } else if (clamped > 50) {
      nodes.filterNode.type = 'highpass';
      const pct = (clamped - 50) / 50;
      const frequency = 20 + 7980 * Math.pow(pct, 2.5);
      nodes.filterNode.frequency.setTargetAtTime(frequency, this.audioCtx.currentTime, 0.015);
    } else {
      nodes.filterNode.type = 'peaking';
      nodes.filterNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.015);
    }
  }

  /**
   * Set input Trim (pre-fader gain)
   */
  setTrim(deckId: number, value: number) {
    if (!this.audioCtx || !this.deckNodes[deckId]) return;
    const nodes = this.deckNodes[deckId];
    if (!nodes || !nodes.trimNode) return;

    const clamped = Math.max(0, Math.min(100, value));
    let targetGain: number;
    if (clamped <= 50) {
      targetGain = clamped / 50;
    } else {
      targetGain = 1.0 + ((clamped - 50) / 50) * 2.0;
    }
    nodes.trimNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.015);
  }

  /**
   * Set fader volume & crossfader gains
   */
  setGain(deckId: number, faderVolume: number, crossfaderMultiplier: number, isMuted: boolean, fadeDuration = 0.015) {
    if (!this.audioCtx || !this.deckNodes[deckId]) return;
    const nodes = this.deckNodes[deckId];
    if (!nodes) return;

    const faderPct = Math.max(0, Math.min(100, faderVolume)) / 100;
    const targetGain = isMuted ? 0 : faderPct * crossfaderMultiplier;
    nodes.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
    nodes.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, fadeDuration);
  }

  /**
   * Compute crossfader multiplier with selectable curves
   */
  computeCrossfaderGain(crossfaderAssign: 'L' | 'R' | 'THRU', crossfaderPosition: number): number {
    if (crossfaderAssign === 'THRU') return 1.0;
    const clamped = Math.max(0, Math.min(100, crossfaderPosition));
    const curve = useAudioStore.getState().crossfaderCurve;

    if (curve === 'FAST_CUT') {
      // Scratch curve: instant full volume within 4% of fader travel
      if (crossfaderAssign === 'L') {
        return clamped > 96 ? Math.max(0, (100 - clamped) / 4) : 1.0;
      } else {
        return clamped < 4 ? Math.max(0, clamped / 4) : 1.0;
      }
    }

    // Default SMOOTH curve (Equal-Power Cosine / Sine blend)
    const norm = clamped / 100;
    if (crossfaderAssign === 'L') {
      return Math.cos(norm * (Math.PI / 2));
    } else {
      return Math.sin(norm * (Math.PI / 2));
    }
  }

  /**
   * Micro-snapping quantization delay computation
   */
  getQuantizedDelay(targetDeckId: number): number {
    const state = useAudioStore.getState();
    const deckB = state.decks[targetDeckId];
    if (!deckB || !deckB.quantizeEnabled) return 0;

    const masterDeckId = [1, 2, 3, 4].find(
      id => id !== targetDeckId && state.decks[id]?.isPlaying && !state.decks[id]?.scMode
    );
    if (!masterDeckId) return 0;

    const deckA = state.decks[masterDeckId];
    const audioA = this.audioElements[masterDeckId];
    if (!deckA || !audioA) return 0;

    const beatIntervalA = 60 / deckA.bpm;
    const quantizeInterval = beatIntervalA / 4;

    const timeA = audioA.currentTime;
    const currentOffset = timeA % quantizeInterval;
    const timeToNext = quantizeInterval - currentOffset;

    const realTimeToNext = timeToNext / (1 + (deckA.pitch || 0) / 100);
    return realTimeToNext * 1000;
  }

  /**
   * Align pitch fader rate and phases of syncing decks (Rekordbox / CDJ-3000 logic)
   */
  alignSyncPlayback(targetDeckId: number) {
    const state = useAudioStore.getState();
    const deckB = state.decks[targetDeckId];
    const audioB = this.audioElements[targetDeckId];
    if (!deckB || !audioB) return;

    let masterDeckId = [1, 2, 3, 4].find(
      id => id !== targetDeckId && state.decks[id]?.isPlaying && state.decks[id]?.isMaster && !state.decks[id]?.scMode
    );
    if (!masterDeckId) {
      masterDeckId = [1, 2, 3, 4].find(
        id => id !== targetDeckId && state.decks[id]?.isPlaying && !state.decks[id]?.scMode
      );
    }
    if (!masterDeckId) return;

    const deckA = state.decks[masterDeckId];
    const audioA = this.audioElements[masterDeckId];
    if (!deckA || !audioA) return;

    const correction = calculateSyncCorrection(
      audioA.currentTime,
      deckA.bpm || 120,
      deckA.pitch || 0,
      deckA.firstBeatOffset || 0,
      audioB.currentTime,
      deckB.bpm || 120,
      deckB.firstBeatOffset || 0
    );

    // 1. Update pitch to match master tempo
    useAudioStore.getState().setDeck(targetDeckId, { pitch: correction.targetPitch });
    audioB.playbackRate = 1 + correction.targetPitch / 100;

    // 2. Snap phase if not strictly BPM-only sync
    if (deckB.syncMode !== 'BPM') {
      const durationB = audioB.duration || deckB.duration || 0;
      let targetTimeB = audioB.currentTime + correction.timeErrorSeconds;

      if (targetTimeB < 0) targetTimeB = 0;
      if (durationB && targetTimeB > durationB) targetTimeB = durationB;

      audioB.currentTime = targetTimeB;
      useAudioStore.getState().setDeck(targetDeckId, { progress: targetTimeB });
    }
  }

  /**
   * Sample-Accurate Quantized Beat Jump (+1, +2, +4, +8, +16, +32, -4, -8, etc.)
   */
  beatJump(deckId: number, beats: number) {
    const audio = this.audioElements[deckId];
    const deck = useAudioStore.getState().decks[deckId];
    if (!audio || !deck) return;

    const bpm = deck.bpm || 120;
    const timeShift = beats * (60 / bpm);
    const targetTime = Math.max(0, Math.min((deck.duration || audio.duration || 300), audio.currentTime + timeShift));
    
    audio.currentTime = targetTime;
    useAudioStore.getState().setDeck(deckId, { progress: targetTime });
  }

  /**
   * Pitch Bend Nudge (+/- percent) for jogwheel Outer Ring dragging & keyboard nudging
   */
  pitchNudge(deckId: number, nudgePercent: number) {
    const audio = this.audioElements[deckId];
    const deck = useAudioStore.getState().decks[deckId];
    if (!audio || !deck) return;

    const basePitch = deck.pitch || 0;
    const nudgedPitch = basePitch + nudgePercent;
    const playbackRate = Math.max(0.5, Math.min(2.0, 1 + nudgedPitch / 100));

    audio.playbackRate = playbackRate;
  }

  seekToFirstBeatOneOfBar(deckId: number, firstBeatOffset: number, bpm: number) {
    const audio = this.audioElements[deckId];
    if (!audio) return;
    const beatInterval = 60 / bpm;
    let startBeatTime = firstBeatOffset;
    while (startBeatTime < 0) {
      startBeatTime += 4 * beatInterval;
    }
    audio.currentTime = startBeatTime;
    useAudioStore.getState().setDeck(deckId, { progress: startBeatTime });
  }

  /**
   * Trigger Play/Pause with micro-snapping delays and fade-in gain curves
   */
  togglePlayGlobal(deckId: number) {
    this.ensureDeckInitialized(deckId);
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck) return;

    const executeToggle = () => {
      playClick(1000, 'sine', 0.03);
      const ctx = this.initAudioDSP();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

      const widget = this.widgetRefs[deckId];
      if (deck.scMode && widget) {
        try {
          deck.isPlaying ? widget.pause() : widget.play();
        } catch (e) {
          useAudioStore.getState().setDeck(deckId, { isPlaying: !deck.isPlaying });
        }
        return;
      }

      const audio = this.audioElements[deckId];
      if (!audio) return;

      if (audio.paused) {
        const nodes = this.deckNodes[deckId];
        if (nodes && this.audioCtx) {
          nodes.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
          nodes.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        }

        if (audio.readyState >= 2) {
          if (deck.syncEnabled) {
            this.alignSyncPlayback(deckId);
          }
          this.playPending[deckId] = true;
          audio.play()
            .then(() => { 
              this.playPending[deckId] = false; 
              const freshState = useAudioStore.getState();
              const freshDeck = freshState.decks[deckId];
              const cfMult = this.computeCrossfaderGain(freshDeck.crossfaderAssign, freshState.crossfader);
              this.setGain(deckId, freshDeck.volume, cfMult, freshState.isMuted, 0.005);
            })
            .catch(err => {
              this.playPending[deckId] = false;
              if (err.name !== 'AbortError') {
                setDeckStatePaused(deckId);
              }
            });
        } else {
          this.playPending[deckId] = true;
          if (deck.syncEnabled) {
            this.alignSyncPlayback(deckId);
          }
          audio.play()
            .then(() => { 
              this.playPending[deckId] = false; 
              const freshState = useAudioStore.getState();
              const freshDeck = freshState.decks[deckId];
              const cfMult = this.computeCrossfaderGain(freshDeck.crossfaderAssign, freshState.crossfader);
              this.setGain(deckId, freshDeck.volume, cfMult, freshState.isMuted, 0.005);
            })
            .catch(err => {
              this.playPending[deckId] = false;
              if (err.name !== 'AbortError') {
                const playWhenReady = () => {
                  if (audio.readyState >= 2) {
                    const freshDeck = useAudioStore.getState().decks[deckId];
                    if (freshDeck?.syncEnabled) {
                      this.alignSyncPlayback(deckId);
                    }
                    this.playPending[deckId] = true;
                    audio.play()
                      .then(() => { 
                        this.playPending[deckId] = false; 
                        const freshState = useAudioStore.getState();
                        const freshDeck2 = freshState.decks[deckId];
                        const cfMult = this.computeCrossfaderGain(freshDeck2.crossfaderAssign, freshState.crossfader);
                        this.setGain(deckId, freshDeck2.volume, cfMult, freshState.isMuted, 0.005);
                      })
                      .catch(err2 => {
                        this.playPending[deckId] = false;
                        if (err2.name !== 'AbortError') setDeckStatePaused(deckId);
                      });
                    audio.removeEventListener('canplay', playWhenReady);
                  }
                };
                audio.addEventListener('canplay', playWhenReady);
                setTimeout(() => {
                  audio.removeEventListener('canplay', playWhenReady);
                }, 10000);
              }
            });
        }
      } else {
        useAudioStore.getState().setDeck(deckId, { isPlaying: false });
        audio.pause();
        const nodes = this.deckNodes[deckId];
        if (nodes && this.audioCtx) {
          nodes.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
          nodes.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        }
        const freshState = useAudioStore.getState();
        const freshDeck = freshState.decks[deckId];
        const cfMult = this.computeCrossfaderGain(freshDeck.crossfaderAssign, freshState.crossfader);
        this.setGain(deckId, freshDeck.volume, cfMult, freshState.isMuted, 0.002);
      }
    };

    const audio = this.audioElements[deckId];
    const isStarting = audio ? audio.paused : !deck.isPlaying;
    const delay = isStarting ? this.getQuantizedDelay(deckId) : 0;

    if (delay > 10) {
      setTimeout(executeToggle, delay);
    } else {
      executeToggle();
    }
  }

  /**
   * Pioneer CDJ standard CUE button pointer down (Hold-to-preview / Back to Cue)
   */
  handleCueDown(deckId: number) {
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck || deck.id === 'locked') {
      playLockoutBlip();
      return;
    }

    this.initAudioDSP();
    const audio = this.audioElements[deckId];
    const cuePos = deck.mainCue !== undefined ? deck.mainCue : (deck.firstBeatOffset || 0);

    if (deck.isPlaying) {
      // While playing: immediately stop and return to cue point
      if (audio) {
        audio.pause();
        audio.currentTime = cuePos;
      }
      useAudioStore.getState().setDeck(deckId, { isPlaying: false, isCueStuttering: false, progress: cuePos });
      playClick(1100, 'sine', 0.03);
    } else {
      // While paused: start hold-to-preview
      if (audio) {
        audio.currentTime = cuePos;
        this.playPending[deckId] = true;
        audio.play().then(() => {
          this.playPending[deckId] = false;
        }).catch(() => {
          this.playPending[deckId] = false;
        });
      }
      useAudioStore.getState().setDeck(deckId, { isCueStuttering: true, progress: cuePos });
      playClick(1200, 'sine', 0.03);
    }
  }

  /**
   * Pioneer CDJ standard CUE button pointer up (Release preview -> pause & return to cue)
   */
  handleCueUp(deckId: number) {
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck || deck.id === 'locked') return;

    if (deck.isCueStuttering) {
      const audio = this.audioElements[deckId];
      const cuePos = deck.mainCue !== undefined ? deck.mainCue : (deck.firstBeatOffset || 0);
      if (audio) {
        audio.pause();
        audio.currentTime = cuePos;
      }
      useAudioStore.getState().setDeck(deckId, { isPlaying: false, isCueStuttering: false, progress: cuePos });
    }
  }

  /**
   * Set temporary main cue point at current playhead (while paused)
   */
  setTemporaryCue(deckId: number, targetTime?: number) {
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck || deck.id === 'locked') return;

    const audio = this.audioElements[deckId];
    const newCueTime = targetTime !== undefined ? targetTime : (audio ? audio.currentTime : deck.progress);
    useAudioStore.getState().setDeck(deckId, { mainCue: newCueTime });
    playClick(1300, 'sine', 0.03);
  }

  /**
   * Halve active loop length (/2)
   */
  halveLoop(deckId: number) {
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck || deck.id === 'locked') return;

    const audio = this.audioElements[deckId];
    const curTime = audio ? audio.currentTime : deck.progress;
    const loopIn = (deck.loopIn !== null && deck.loopIn !== undefined) ? deck.loopIn : curTime;
    let curLen = (deck.loopOut !== null && deck.loopOut !== undefined) ? (deck.loopOut - loopIn) : (60 / (deck.bpm || 120)) * 4;
    if (curLen <= 0) curLen = (60 / (deck.bpm || 120)) * 4;

    const newLen = Math.max(0.04, curLen / 2);
    useAudioStore.getState().setDeck(deckId, {
      loopIn,
      loopOut: loopIn + newLen,
      isLoopActive: true
    });
    playClick(1000, 'sine', 0.02);
  }

  /**
   * Double active loop length (x2)
   */
  doubleLoop(deckId: number) {
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck || deck.id === 'locked') return;

    const audio = this.audioElements[deckId];
    const curTime = audio ? audio.currentTime : deck.progress;
    const loopIn = (deck.loopIn !== null && deck.loopIn !== undefined) ? deck.loopIn : curTime;
    let curLen = (deck.loopOut !== null && deck.loopOut !== undefined) ? (deck.loopOut - loopIn) : (60 / (deck.bpm || 120)) * 4;
    if (curLen <= 0) curLen = (60 / (deck.bpm || 120)) * 4;

    const newLen = Math.min(deck.duration || 600, curLen * 2);
    useAudioStore.getState().setDeck(deckId, {
      loopIn,
      loopOut: loopIn + newLen,
      isLoopActive: true
    });
    playClick(1100, 'sine', 0.02);
  }

  /**
   * Explicitly load a track onto a target deck in a paused, cued state (Rekordbox / CDJ style).
   */
  loadTrack(track: any, targetDeckId?: number) {
    return this.playTrack(track, targetDeckId, false);
  }

  /**
   * Load and optionally play a track on a target deck.
   * If autoplay is false (default for Crate / Hardware loading), the track is cued in paused state.
   */
  playTrack(track: any, targetDeckId?: number, autoplay: boolean = false) {
    let deckId: 1 | 2 | 3 | 4 = 1;
    if (targetDeckId && [1, 2, 3, 4].includes(targetDeckId)) {
      deckId = targetDeckId as 1 | 2 | 3 | 4;
    } else {
      if (track.id === 'kc-1') deckId = 1;
      else if (track.id === 'kc-2') deckId = 2;
      else if (track.id === 'kc-3') deckId = 3;
      else if (track.id === 'kc-4') deckId = 4;
      else if (track.id?.startsWith('rc-')) deckId = 2;
      else if (track.id?.startsWith('cnc-')) deckId = 3;
    }

    const state = useAudioStore.getState();
    const deck = state.decks[deckId];

    // PLAY LOCK PROTECTION: Prevent loading a NEW track onto a deck while it is currently playing
    if (deck.id !== track.id && deck.isPlaying && state.playLockEnabled) {
      playLockoutBlip();
      return false;
    }

    if (deckId === 1 || deckId === 3) {
      useAudioStore.getState().setLeftActiveDeck(deckId as 1 | 3);
    } else {
      useAudioStore.getState().setRightActiveDeck(deckId as 2 | 4);
    }

    playClick(1000, 'sine', 0.04);
    const ctx = this.initAudioDSP();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    this.ensureDeckInitialized(deckId);

    const widget = this.widgetRefs[deckId];
    const isLocal = !track.url?.includes('soundcloud.com') && !track.link?.includes('soundcloud.com');

    if (deck.id === track.id) {
      if (!autoplay) {
        // Track is already loaded; do NOT auto-toggle playback. Just ensure it's cued to first beat.
        const firstBeatOffset = track.firstBeatOffset || 0.0;
        this.seekToFirstBeatOneOfBar(deckId, firstBeatOffset, deck.bpm || 120);
        return true;
      }

      const targetPlaying = !deck.isPlaying;
      if (deck.scMode && widget) {
        try { targetPlaying ? widget.play() : widget.pause(); } catch (e) {
          useAudioStore.getState().setDeck(deckId, { isPlaying: targetPlaying });
        }
      } else {
        const audio = this.audioElements[deckId];
        if (audio && audio.src) {
          if (targetPlaying) {
            if (audio.readyState >= 2) {
              if (deck.syncEnabled) {
                this.alignSyncPlayback(deckId);
              }
              this.playPending[deckId] = true;
              audio.play()
                .then(() => { this.playPending[deckId] = false; })
                .catch(err => {
                  this.playPending[deckId] = false;
                  if (err.name !== 'AbortError') setDeckStatePaused(deckId);
                });
            } else {
              this.playPending[deckId] = true;
              if (deck.syncEnabled) {
                this.alignSyncPlayback(deckId);
              }
              audio.play()
                .then(() => { this.playPending[deckId] = false; })
                .catch(err => {
                  this.playPending[deckId] = false;
                  if (err.name !== 'AbortError') {
                    const playWhenReady = () => {
                      const freshDeck = useAudioStore.getState().decks[deckId];
                      if (freshDeck?.syncEnabled) {
                        this.alignSyncPlayback(deckId);
                      }
                      this.playPending[deckId] = true;
                      audio.play()
                        .then(() => { this.playPending[deckId] = false; })
                        .catch(err2 => {
                          this.playPending[deckId] = false;
                          if (err2.name !== 'AbortError') setDeckStatePaused(deckId);
                        });
                      audio.removeEventListener('canplay', playWhenReady);
                    };
                    audio.addEventListener('canplay', playWhenReady, { once: true });
                  }
                });
            }
          } else {
            audio.pause();
          }
        }
        useAudioStore.getState().setDeck(deckId, { isPlaying: targetPlaying });
      }
      return true;
    }

    const audio = this.audioElements[deckId];
    if (audio) audio.pause();
    if (widget) { try { widget.pause(); } catch (e) {} }

    const detectedBpm = state.detectedBpms?.[track.id];
    const initialBpm = detectedBpm || track.bpm || 120;

    if (isLocal) {
      const firstBeatOffset = track.firstBeatOffset || 0.0;
      if (audio) {
        const absoluteUrl = track.url.startsWith('blob:') || track.url.startsWith('http')
          ? track.url
          : new URL(track.url, window.location.origin).href;
        if (this.loadedUrls[deckId] !== track.url) {
          this.loadedUrls[deckId] = track.url;
          audio.preload = 'auto';
          audio.src = absoluteUrl;
          audio.load();
        }
        this.seekToFirstBeatOneOfBar(deckId, firstBeatOffset, initialBpm);
      }
      useAudioStore.getState().setDeck(deckId, {
        id: track.id, title: track.title, url: track.url, link: track.link,
        bpm: initialBpm, isPlaying: false, progress: audio ? audio.currentTime : 0, scMode: false, isReady: false,
        waveformPeaks: this.dynamicWaveforms[track.id] || generateStaticPeaks(500),
        cuePoints: track.cuePoints,
        firstBeatOffset: firstBeatOffset,
        artworkUrl: track.artworkUrl,
      });

      if (autoplay && audio) {
        audio.play().then(() => {
          useAudioStore.getState().setDeck(deckId, { isPlaying: true });
        }).catch(() => {});
      }

      // Trigger background BPM analysis for remote files if not already detected
      if (!detectedBpm && track.url && !track.url.startsWith('blob:')) {
        const fileKey = track.id;
        const absoluteUrl = track.url.startsWith('http')
          ? track.url
          : new URL(track.url, window.location.origin).href;
        fetch(absoluteUrl, { headers: { Range: 'bytes=0-4194304' } })
          .then(res => { 
            if (res.ok || res.status === 206) return res.arrayBuffer(); 
            else throw new Error('Range fetch failed'); 
          })
          .then(async buffer => {
            if (!this.analysisWorker) {
              this.analysisWorker = new Worker('/workers/audioAnalysis.worker.js');
              this.analysisWorker.onmessage = (e: MessageEvent) => {
                const { bpm, peaks, firstBeatOffset: fbo, fileKey: fk, error } = e.data;
                const cb = this.workerCallbacks[fk];
                if (cb) { cb({ bpm, peaks, firstBeatOffset: fbo, error }); delete this.workerCallbacks[fk]; }
              };
            }
            this.workerCallbacks[fileKey] = ({ bpm, peaks, firstBeatOffset: fbo, error }: any) => {
              if (error) { console.error('BPM background analysis worker error:', error); return; }
              console.log(`[BACKGROUND ANALYSIS] Auto-detected BPM for ${track.title}: ${bpm}`);
              
              // Save to Zustand
              useAudioStore.getState().setDetectedBpm(track.id, bpm);
              
              // If this track is still loaded on the target deck, update its BPM dynamically
              const currentDeck = useAudioStore.getState().decks[deckId];
              if (currentDeck && currentDeck.id === track.id) {
                useAudioStore.getState().setDeck(deckId, { bpm });
              }
            };
            this.analysisWorker.postMessage({ buffer, fileKey, numPeaks: 500 });
          })
          .catch(err => {
            console.warn('Failed to fetch range for background BPM analysis:', err);
          });
      }
    } else {
      // SoundCloud mode
      const firstBeatOffset = track.firstBeatOffset || 0.0;
      useAudioStore.getState().setDeck(deckId, {
        id: track.id, title: track.title, url: track.url, link: track.link,
        bpm: initialBpm, isPlaying: false, progress: 0, scMode: true, isReady: false,
        waveformPeaks: this.dynamicWaveforms[track.id] || generateStaticPeaks(500),
        cuePoints: track.cuePoints,
        firstBeatOffset: firstBeatOffset,
        artworkUrl: track.artworkUrl,
      });
      if (widget) {
        try {
          widget.load(track.url, {
            auto_play: false, hide_related: true, show_comments: false,
            show_user: false, show_reposts: false, visual: false,
          });
        } catch (e) {}
      }
    }
  }

  /**
   * Load local file onto deck, using worker analysis
   */
  async loadLocalFile(deckId: number, file: File) {
    this.ensureDeckInitialized(deckId);
    const audio = this.audioElements[deckId];
    if (!audio) return;

    audio.pause();
    const objectUrl = URL.createObjectURL(file);
    this.loadedUrls[deckId] = objectUrl;
    audio.src = objectUrl;
    audio.load();

    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

    useAudioStore.getState().setDeck(deckId, {
      id: 'local',
      title: file.name,
      url: objectUrl,
      isReady: false, isPlaying: false, scMode: false,
      progress: 0, duration: 0, bpm: 128,
      waveformPeaks: generateStaticPeaks(500),
    });

    try {
      const cached = await getCachedWaveform(fileKey);
      if (cached) {
        useAudioStore.getState().setDeck(deckId, { bpm: cached.bpm, waveformPeaks: cached.peaks, firstBeatOffset: cached.firstBeatOffset });
        useAudioStore.getState().setDetectedBpm(fileKey, cached.bpm);
        this.seekToFirstBeatOneOfBar(deckId, cached.firstBeatOffset || 0, cached.bpm);
        playClick(1100, 'sine', 0.1);
        return;
      }
    } catch (e) { console.warn('Cache read error:', e); }

    try {
      if (!this.analysisWorker) {
        this.analysisWorker = new Worker('/workers/audioAnalysis.worker.js');
        this.analysisWorker.onmessage = (e: MessageEvent) => {
          const { bpm, peaks, firstBeatOffset, fileKey: fk, error } = e.data;
          const cb = this.workerCallbacks[fk];
          if (cb) { cb({ bpm, peaks, firstBeatOffset, error }); delete this.workerCallbacks[fk]; }
        };
      }

      const fullBuffer = await file.arrayBuffer();

      this.workerCallbacks[fileKey] = async ({ bpm, peaks, firstBeatOffset, error }: any) => {
        if (error) { console.error('Analysis worker error:', error); return; }
        const offset = firstBeatOffset && isFinite(firstBeatOffset) ? Math.max(0, firstBeatOffset) : 0;
        useAudioStore.getState().setDeck(deckId, { 
          bpm, 
          waveformPeaks: peaks, 
          firstBeatOffset: offset,
          mainCue: offset,
          progress: offset
        });
        useAudioStore.getState().setDetectedBpm(fileKey, bpm);
        this.seekLocalBuffer(deckId, offset);
        await cacheWaveform(fileKey, { bpm, peaks, firstBeatOffset: offset });
      };

      this.analysisWorker.postMessage({ buffer: fullBuffer, fileKey, numPeaks: 500 }, [fullBuffer]);
    } catch (err) {
      console.error('Failed to spawn analysis worker:', err);
    }

    playClick(1100, 'sine', 0.1);
  }

  setPitch(deckId: number, pitchPct: number) {
    this.ensureDeckInitialized(deckId);
    const audio = this.audioElements[deckId];
    if (audio) {
      audio.playbackRate = 1 + pitchPct / 100;
    }
  }

  seekLocalBuffer(deckId: number, seekTime: number) {
    this.ensureDeckInitialized(deckId);
    const audio = this.audioElements[deckId];
    if (audio && isFinite(seekTime) && !isNaN(seekTime)) {
      audio.currentTime = seekTime;
      useAudioStore.getState().setDeck(deckId, { progress: seekTime });
    }
  }

  /**
   * Bind SoundCloud Widget Event listeners
   */
  initSCWidget(deckId: number, iframeEl: HTMLIFrameElement) {
    if (!iframeEl) return;
    if (this.widgetRefs[deckId]) return;

    const SC = (window as any).SC;
    if (!SC) return;

    const widget = SC.Widget(iframeEl);
    this.widgetRefs[deckId] = widget;

    widget.bind(SC.Widget.Events.READY, () => {
      widget.getDuration((durationMs: number) => {
        useAudioStore.getState().setDeck(deckId, { isReady: true, scMode: true, duration: durationMs / 1000 });
      });
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      useAudioStore.getState().setDeck(deckId, { isPlaying: true, scMode: true });
    });
    widget.bind(SC.Widget.Events.PAUSE, () => {
      useAudioStore.getState().setDeck(deckId, { isPlaying: false });
    });
    widget.bind(SC.Widget.Events.FINISH, () => {
      useAudioStore.getState().setDeck(deckId, { isPlaying: false });
    });
    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
      const currentDur = useAudioStore.getState().decks[deckId]?.duration ?? 0;
      const computedDur = data.relativePosition > 0
        ? data.currentPosition / data.relativePosition / 1000
        : currentDur;
      if (Math.abs((computedDur || currentDur) - currentDur) > 0.5) {
        useAudioStore.getState().setDeck(deckId, { duration: computedDur || currentDur || 0, scMode: true });
      }
    });
  }

  /**
   * Start onset detector requestAnimationFrame loop
   */
  private startOnsetDetectionLoop() {
    if (this.onsetFrameId) return;

    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const checkOnset = () => {
      const state = useAudioStore.getState();
      [1, 2, 3, 4].forEach(deckId => {
        const deck = state.decks[deckId];
        const audio = this.audioElements[deckId];
        const nodes = this.deckNodes[deckId];

        if (
          deck &&
          deck.isPlaying &&
          !deck.scMode &&
          audio &&
          nodes &&
          nodes.analyserNode &&
          (!deck.firstBeatOffset || deck.firstBeatOffset === 0)
        ) {
          const analyser = nodes.analyserNode;
          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / bufferLength);

          if (rms > 0.012 && audio.currentTime > 0.02) {
            const detectedOffset = audio.currentTime;
            console.log(`[ONSET] Dynamic sound onset detected for Deck ${deckId} at ${detectedOffset.toFixed(3)}s`);
            
            const currentCuePoints = deck.cuePoints || [];
            let newCuePoints = currentCuePoints;
            if (currentCuePoints.length === 0 || Math.abs(currentCuePoints[0] - detectedOffset) > 0.05) {
              newCuePoints = [detectedOffset, ...currentCuePoints.filter((c: number) => Math.abs(c - detectedOffset) > 0.05)];
            }
            
            useAudioStore.getState().setDeck(deckId, { 
              firstBeatOffset: detectedOffset,
              cuePoints: newCuePoints,
              progress: detectedOffset
            });
            audio.currentTime = detectedOffset;
          }
        }
      });
      this.onsetFrameId = requestAnimationFrame(checkOnset);
    };

    this.onsetFrameId = requestAnimationFrame(checkOnset);
  }

  /**
   * Start 60fps LCD playhead updater loop (runs outside React state)
   */
  private startLCDTickLoop() {
    if (this.lcdFrameId) return;

    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate >= 100) {
        lastUpdate = now;

        // Auto-audit latency changes (e.g. plugging in Bluetooth or external device mid-session)
        if (this.audioCtx) {
          const currentLatency = Math.round(((this.audioCtx.outputLatency || 0) + (this.audioCtx.baseLatency || 0)) * 1000) || 45;
          if (useAudioStore.getState().visualLatencyOffset !== currentLatency) {
            useAudioStore.getState().setVisualLatencyOffset(currentLatency);
          }
        }

        [1, 2, 3, 4].forEach(deckId => {
          const audio = this.audioElements[deckId];
          if (audio && audio.src) {
            if (!this.lcdRefs[deckId]) {
              this.lcdRefs[deckId] = document.getElementById(`lcd-time-${deckId}`);
            }
            const lcdEl = this.lcdRefs[deckId];
            const timeStr = formatTime(audio.currentTime);
            if (lcdEl && lcdEl.innerText !== timeStr) {
              lcdEl.innerText = timeStr;
            }
          }
        });
      }
      this.lcdFrameId = requestAnimationFrame(tick);
    };
    this.lcdFrameId = requestAnimationFrame(tick);
  }

  /**
   * Get master analyser node
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  /**
   * Get specific deck analyser nodes
   */
  getDeckAnalysers() {
    return {
      1: this.deckNodes[1]?.analyserNode || null,
      2: this.deckNodes[2]?.analyserNode || null,
      3: this.deckNodes[3]?.analyserNode || null,
      4: this.deckNodes[4]?.analyserNode || null,
    };
  }

  /**
   * Extract 7 Logarithmic Frequency Bands (Human Hearing Scale)
   * Sub-Bass (20-60Hz), Bass (60-250Hz), Low-Mid (250-500Hz), Mid (500-2kHz),
   * High-Mid (2k-4kHz), Presence (4k-8kHz), Brilliance (8k-20kHz)
   */
  getLogFrequencyBands(customAnalyser?: AnalyserNode | null) {
    const analyser = customAnalyser !== undefined ? customAnalyser : this.masterAnalyser;
    if (!analyser) {
      return {
        subBass: 0,
        bass: 0,
        lowMid: 0,
        mid: 0,
        highMid: 0,
        presence: 0,
        brilliance: 0,
        kickPunch: 0,
        snareSnap: 0,
        rawBands: [0, 0, 0, 0, 0, 0, 0],
        energy: 0,
      };
    }

    const bufferLength = analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);

    const nyquist = (this.audioCtx?.sampleRate || 44100) / 2;
    const hzPerBin = nyquist / bufferLength;

    const getAverage = (startHz: number, endHz: number) => {
      const startBin = Math.max(0, Math.floor(startHz / hzPerBin));
      const endBin = Math.min(bufferLength - 1, Math.ceil(endHz / hzPerBin));
      if (startBin >= endBin) return (freqData[startBin] || 0) / 255;
      let sum = 0;
      let count = 0;
      for (let b = startBin; b <= endBin; b++) {
        sum += freqData[b] || 0;
        count++;
      }
      return count > 0 ? sum / (count * 255) : 0;
    };

    const rawSub = getAverage(20, 60);
    const rawBass = getAverage(60, 250);
    const rawLowMid = getAverage(250, 500);
    const rawMid = getAverage(500, 2000);
    const rawHighMid = getAverage(2000, 4000);
    const rawPres = getAverage(4000, 8000);
    const rawBrill = getAverage(8000, 20000);

    // Dynamic non-linear expansion calibrated for punchy bass & drums
    const subBass = Math.min(1.0, Math.pow(rawSub, 1.1) * 1.65);
    const bass = Math.min(1.0, Math.pow(rawBass, 1.1) * 1.55);
    const lowMid = Math.min(1.0, Math.pow(rawLowMid, 1.15) * 1.3);
    const mid = Math.min(1.0, Math.pow(rawMid, 1.2) * 1.25);
    const highMid = Math.min(1.0, Math.pow(rawHighMid, 1.2) * 1.35);
    const presence = Math.min(1.0, Math.pow(rawPres, 1.2) * 1.4);
    const brilliance = Math.min(1.0, Math.pow(rawBrill, 1.2) * 1.45);

    // Dedicated drum isolators
    const kickPunch = Math.min(1.0, Math.pow(getAverage(45, 120), 1.1) * 1.7);
    const snareSnap = Math.min(1.0, Math.pow(getAverage(1500, 3500), 1.2) * 1.5);

    const rawBands = [subBass, bass, lowMid, mid, highMid, presence, brilliance];
    const energy = rawBands.reduce((acc, v) => acc + v, 0) / rawBands.length;

    return {
      subBass,
      bass,
      lowMid,
      mid,
      highMid,
      presence,
      brilliance,
      kickPunch,
      snareSnap,
      rawBands,
      energy,
    };
  }

  /**
   * Spectral Flux Onset & Transient Beat Tracker
   * Measures the rate of positive energy change across spectrum bins specifically isolating kick drums and snare snaps
   */
  getSpectralFluxTransient(customAnalyser?: AnalyserNode | null): {
    isBeat: boolean;
    isKick: boolean;
    isSnare: boolean;
    flux: number;
    kickFlux: number;
    snareFlux: number;
    confidence: number;
  } {
    const analyser = customAnalyser !== undefined ? customAnalyser : this.masterAnalyser;
    if (!analyser) return { isBeat: false, isKick: false, isSnare: false, flux: 0, kickFlux: 0, snareFlux: 0, confidence: 0 };

    const bufferLength = Math.min(128, analyser.frequencyBinCount);
    const freqData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);

    let flux = 0;
    let kickFlux = 0;
    let snareFlux = 0;

    for (let i = 0; i < bufferLength; i++) {
      const current = freqData[i] / 255.0;
      const previous = this.prevSpectrum[i] || 0;
      const diff = current - previous;
      if (diff > 0) {
        flux += diff;
        if (i < 8) kickFlux += diff;       // Low frequencies (20-700Hz)
        else if (i >= 8 && i <= 32) snareFlux += diff; // Mid/High frequencies (700-3000Hz)
      }
      this.prevSpectrum[i] = current;
    }
    flux /= bufferLength;
    kickFlux /= 8;
    snareFlux /= 24;

    // Track rolling history (last 30 frames ~ 0.5s)
    this.fluxHistory.push(flux);
    if (this.fluxHistory.length > 30) this.fluxHistory.shift();

    const avgFlux = this.fluxHistory.reduce((a, b) => a + b, 0) / this.fluxHistory.length;
    const threshold = avgFlux * 1.35 + 0.015;
    const isBeat = flux > threshold;
    const isKick = kickFlux > threshold * 1.25;
    const isSnare = snareFlux > threshold * 1.15;
    const confidence = Math.min(1, flux / (threshold + 0.001));

    return { isBeat, isKick, isSnare, flux, kickFlux, snareFlux, confidence };
  }

  /**
   * Microphone Input Capture for Live Venue Visuals
   */
  async enableMicrophoneInput(): Promise<AnalyserNode | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;
    try {
      this.initAudioDSP();
      if (!this.audioCtx) return null;

      if (this.micStream) {
        return this.micAnalyser;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micStream = stream;
      this.micSourceNode = this.audioCtx.createMediaStreamSource(stream);

      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      this.micSourceNode.connect(analyser);
      this.micAnalyser = analyser;

      return analyser;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return null;
    }
  }

  disableMicrophoneInput() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      try { this.micSourceNode.disconnect(); } catch (_) {}
      this.micSourceNode = null;
    }
    this.micAnalyser = null;
  }

  getMicAnalyser(): AnalyserNode | null {
    return this.micAnalyser;
  }

  /**
   * Close and clean up all listeners/contexts on shutdown
   */
  destroy() {
    this.disableMicrophoneInput();
    if (this.onsetFrameId) cancelAnimationFrame(this.onsetFrameId);
    if (this.lcdFrameId) cancelAnimationFrame(this.lcdFrameId);
    if (this.audioCtx) this.audioCtx.close().catch(() => {});
    if (this.analysisWorker) this.analysisWorker.terminate();
    this.audioCtx = null;
    this.masterAnalyser = null;
    this.deckNodes = { 1: null, 2: null, 3: null, 4: null };
    this.audioElements = { 1: null, 2: null, 3: null, 4: null };
  }
}

const setDeckStatePaused = (deckId: number) => {
  useAudioStore.getState().setDeck(deckId, { isPlaying: false });
};

// Global singleton instance
export const audioEngine = new AudioEngine();
