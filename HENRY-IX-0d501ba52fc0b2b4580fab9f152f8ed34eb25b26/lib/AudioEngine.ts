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
import { playClick } from '@/lib/audioUtils';

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

  private analysisWorker: Worker | null = null;
  private workerCallbacks: Record<string, (result: any) => void> = {};
  private lcdRefs: Record<number, HTMLElement | null> = {};
  private dynamicWaveforms: Record<string, number[]> = {};

  private onsetFrameId: number | null = null;
  private lcdFrameId: number | null = null;

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
      this.masterAnalyser = masterAnalyser;
      masterAnalyser.connect(ctx.destination);

      // Start tick loops
      this.startOnsetDetectionLoop();
      this.startLCDTickLoop();

      return ctx;
    } catch (e) {
      console.error('Failed to initialize Web Audio DSP:', e);
      return null;
    }
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
      audio.currentTime = offset;
      
      let newCuePoints = deck?.cuePoints || [];
      if (newCuePoints.length === 0 || Math.abs(newCuePoints[0] - offset) > 0.05) {
        newCuePoints = [offset, ...newCuePoints.filter((c: number) => Math.abs(c - offset) > 0.05)];
      }

      useAudioStore.getState().setDeck(deckId, { 
        duration: audio.duration, 
        isReady: true,
        progress: offset,
        cuePoints: newCuePoints
      });
      
      // Auto-detect onset for unknown tracks
      if (!offset && audio.src && audio.src.startsWith('http') && !audio.src.includes('soundcloud')) {
        const absoluteUrl = new URL(audio.src).href;
        fetch(absoluteUrl, { headers: { Range: 'bytes=0-1500000' } })
          .then(res => { if (res.ok || res.status === 206) return res.arrayBuffer(); else throw new Error(); })
          .then(async buffer => {
            const actx = new OfflineAudioContext(1, 44100 * 30, 44100);
            const audioBuffer = await actx.decodeAudioData(buffer).catch(() => null);
            if (!audioBuffer) return;
            const data = audioBuffer.getChannelData(0);
            const wSize = 256;
            for (let i = 0; i < data.length; i += wSize) {
              let sum = 0;
              for (let j = 0; j < wSize && i + j < data.length; j++) sum += data[i+j] * data[i+j];
              const rms = Math.sqrt(sum / wSize);
              if (rms > 0.012 && (i / 44100) > 0.02) {
                const detected = i / 44100;
                console.log(`[BACKGROUND ONSET] Deck ${deckId} detected at ${detected.toFixed(3)}s`);
                
                const current = useAudioStore.getState().decks[deckId];
                if (current && (!current.firstBeatOffset || current.firstBeatOffset === 0)) {
                  let updatedCue = current.cuePoints || [];
                  if (updatedCue.length === 0 || Math.abs(updatedCue[0] - detected) > 0.05) {
                    updatedCue = [detected, ...updatedCue.filter(c => Math.abs(c - detected) > 0.05)];
                  }
                  useAudioStore.getState().setDeck(deckId, { firstBeatOffset: detected, cuePoints: updatedCue, progress: current.isPlaying ? current.progress : detected });
                  if (!current.isPlaying && audio.currentTime === 0) {
                     audio.currentTime = detected;
                  }
                }
                break;
              }
            }
          }).catch(() => {});
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
      if (now - lastProgressUpdate >= 100) {
        lastProgressUpdate = now;
        useAudioStore.getState().setDeck(deckId, { progress: audio.currentTime });
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

    const clamped = Math.max(0, Math.min(100, value));
    let gain: number;
    if (clamped < 50) {
      gain = -32 * (1 - clamped / 50);
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
    if (clamped < 50) {
      nodes.filterNode.type = 'lowpass';
      const pct = clamped / 50;
      const frequency = 80 + 19920 * Math.pow(pct, 2.5);
      nodes.filterNode.frequency.setTargetAtTime(frequency, this.audioCtx.currentTime, 0.015);
    } else if (clamped > 50) {
      nodes.filterNode.type = 'highpass';
      const pct = (clamped - 50) / 50;
      const frequency = 15 + 5985 * Math.pow(pct, 2.5);
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
   * Compute crossfader multiplier
   */
  computeCrossfaderGain(crossfaderAssign: 'L' | 'R' | 'THRU', crossfaderPosition: number): number {
    if (crossfaderAssign === 'THRU') return 1.0;
    const clamped = Math.max(0, Math.min(100, crossfaderPosition));

    if (crossfaderAssign === 'L') {
      return clamped <= 50 ? 1 : Math.max(0, 1 - (clamped - 50) / 50);
    } else {
      return clamped >= 50 ? 1 : Math.max(0, clamped / 50);
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
   * Align pitch fader rate and phases of syncing decks
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

    const activeBpmA = deckA.bpm * (1 + (deckA.pitch || 0) / 100);
    const targetPitchB = ((activeBpmA / deckB.bpm) - 1) * 100;
    const clampedPitchB = Math.max(-16, Math.min(16, targetPitchB));
    
    useAudioStore.getState().setDeck(targetDeckId, { pitch: clampedPitchB });
    audioB.playbackRate = 1 + clampedPitchB / 100;

    if (deckB.syncMode !== 'BPM') {
      const activeBeatInterval = 60 / activeBpmA;
      const offsetA = deckA.firstBeatOffset || 0;
      const offsetB = deckB.firstBeatOffset || 0;
      
      const elapsedA = Math.max(0, audioA.currentTime - offsetA);
      const phaseA = elapsedA % activeBeatInterval;
      
      const durationB = audioB.duration || deckB.duration || 0;
      const elapsedB = audioB.currentTime - offsetB;
      
      // Snap directly to the nearest beat boundary to align phases
      const nearestBeatIndex = Math.round(elapsedB / activeBeatInterval);
      let targetTimeB = offsetB + nearestBeatIndex * activeBeatInterval + phaseA;

      if (targetTimeB < 0) targetTimeB = 0;
      if (durationB && targetTimeB > durationB) targetTimeB = durationB;
      
      audioB.currentTime = targetTimeB;
      useAudioStore.getState().setDeck(targetDeckId, { progress: targetTimeB });
    }
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
              this.setGain(deckId, freshDeck.volume, cfMult, freshState.isMuted, 0.35);
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
              this.setGain(deckId, freshDeck.volume, cfMult, freshState.isMuted, 0.35);
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
                        this.setGain(deckId, freshDeck2.volume, cfMult, freshState.isMuted, 0.35);
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
   * Load track URL onto specified deck (local/remote or SoundCloud mode)
   */
  playTrack(track: any, targetDeckId?: number) {
    let deckId: 1 | 2 | 3 | 4 = 1;
    if (targetDeckId && [1, 2, 3, 4].includes(targetDeckId)) {
      deckId = targetDeckId as 1 | 2 | 3 | 4;
    } else {
      if (track.id === 'kc-1') deckId = 1;
      else if (track.id === 'kc-2') deckId = 2;
      else if (track.id === 'kc-3') deckId = 3;
      else if (track.id === 'kc-4') deckId = 4;
      else if (track.id.startsWith('rc-')) deckId = 2;
      else if (track.id.startsWith('cnc-')) deckId = 3;
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

    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    const widget = this.widgetRefs[deckId];
    const isLocal = !track.url?.includes('soundcloud.com') && !track.link?.includes('soundcloud.com');

    if (deck.id === track.id) {
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
      return;
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

      const slicedBuffer = await file.slice(0, 4 * 1024 * 1024).arrayBuffer();

      this.workerCallbacks[fileKey] = async ({ bpm, peaks, firstBeatOffset, error }: any) => {
        if (error) { console.error('Analysis worker error:', error); return; }
        useAudioStore.getState().setDeck(deckId, { bpm, waveformPeaks: peaks, firstBeatOffset });
        useAudioStore.getState().setDetectedBpm(fileKey, bpm);
        this.seekToFirstBeatOneOfBar(deckId, firstBeatOffset || 0, bpm);
        await cacheWaveform(fileKey, { bpm, peaks, firstBeatOffset });
      };

      this.analysisWorker.postMessage({ buffer: slicedBuffer, fileKey, numPeaks: 500 }, [slicedBuffer]);
    } catch (err) {
      console.error('Failed to spawn analysis worker:', err);
    }

    playClick(1100, 'sine', 0.1);
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
   * Close and clean up all listeners/contexts on shutdown
   */
  destroy() {
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
