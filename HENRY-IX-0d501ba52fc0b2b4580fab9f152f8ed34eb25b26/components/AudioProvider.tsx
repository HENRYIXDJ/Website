'use client';

import React, { useRef, useEffect, createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { playClick, playLockoutBlip } from '@/lib/audioUtils';
import { trackWaveforms } from '@/app/trackWaveforms';
import { useAudioStore, generateStaticPeaks } from '@/store/audioStore';
import { audioEngine, type DeckDSPNodes } from '@/lib/AudioEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getSessionImage = (title: string) => {
  if (!title) return '/Knight Club Artwork/Session 1.jpg';
  if (title.includes('Royal Court') && title.includes('Session 1')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.png';
  if (title.includes('Royal Court') && title.includes('Session 2')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.png';
  if (title.includes('Corner New Cross') && title.includes('Night 1')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Artwork/CNC%20N1%20Artwork.png';
  if (title.includes('Corner New Cross') && title.includes('Night 2')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Artwork/CNC%20N2%20Artwork.png';
  
  if (title.includes('Session 1')) return '/Knight Club Artwork/Session 1.jpg';
  if (title.includes('Session 2')) return '/Knight Club Artwork/Session 2.jpg';
  if (title.includes('Session 3')) return '/Knight Club Artwork/Session 3.jpg';
  if (title.includes('Session 4')) return '/Knight Club Artwork/Session 4.jpg';
  return '/Knight Club Artwork/Session 1.jpg';
};

// ---------------------------------------------------------------------------
// Context (for non-reactive data: refs, functions, analyserNode getter)
// ---------------------------------------------------------------------------

export const AudioContext = createContext<any>(null);
export const useAudio = () => useContext(AudioContext);

// ---------------------------------------------------------------------------
// AudioProvider
// ---------------------------------------------------------------------------

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // ── Zustand selectors: Use only the specific state needed, not full destructure ──────────
  const preloaderComplete = useAudioStore(s => s.preloaderComplete);
  const setPreloaderComplete = useAudioStore(s => s.setPreloaderComplete);
  const setAudioDSPInitialized = useAudioStore(s => s.setAudioDSPInitialized);
  const setDeck = useAudioStore(s => s.setDeck);
  const setDecks = useAudioStore(s => s.setDecks);
  const isMuted = useAudioStore(s => s.isMuted);
  const setIsMuted = useAudioStore(s => s.setIsMuted);
  const setLeftActiveDeck = useAudioStore(s => s.setLeftActiveDeck);
  const setRightActiveDeck = useAudioStore(s => s.setRightActiveDeck);

  // ── Body scroll lock while preloader active ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!preloaderComplete) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [preloaderComplete]);


  // ── Web Audio persistent DSP routing nodes ──────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  const deckNodesRef = useRef<Record<number, {
    trimNode: GainNode;
    lowShelf: BiquadFilterNode;
    midPeak: BiquadFilterNode;
    highShelf: BiquadFilterNode;
    filterNode: BiquadFilterNode;
    gainNode: GainNode;
  }>>({});

  const audioElementsRef = useRef<Record<number, HTMLAudioElement | null>>({});
  const mediaSourcesRef = useRef<Record<number, MediaElementAudioSourceNode | null>>({});
  const playPendingRef = useRef<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const scratchingRef = useRef<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const loadedUrlsRef = useRef<Record<number, string>>({});

  // ── SoundCloud: only mount iframes when a deck uses SC mode ────────────
  const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({ 1: null, 2: null, 3: null, 4: null });
  const widgetRefs = useRef<Record<number, any>>({});
  const mountedIframeIds = useRef<Set<number>>(new Set());

  // Track which decks need an SC iframe (mount lazily)
  const [mountedDecks, setMountedDecks] = React.useState<number[]>([]);

  // Analysis Web Worker ref
  const analysisWorkerRef = useRef<Worker | null>(null);
  const workerCallbacksRef = useRef<Record<string, (result: any) => void>>({});

  // ── DSP Init ───────────────────────────────────────────────────────────
  const initAudioDSP = () => {
    if (typeof window === 'undefined') return null;
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      return audioContextRef.current;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      setAudioDSPInitialized(true);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const masterAnalyser = ctx.createAnalyser();
      masterAnalyser.fftSize = 256;
      masterAnalyserRef.current = masterAnalyser;
      masterAnalyser.connect(ctx.destination);

      [1, 2, 3, 4].forEach(deckId => {
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

        trimNode.connect(lowShelf);
        lowShelf.connect(midPeak);
        midPeak.connect(highShelf);
        highShelf.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(masterAnalyser);

        deckNodesRef.current[deckId] = { trimNode, lowShelf, midPeak, highShelf, filterNode, gainNode };

        if (typeof window !== 'undefined') {
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          audio.loop = false;
          audio.preload = 'auto';

          // Map initial URLs to pre-cache them
          const state = useAudioStore.getState();
          const deck = state.decks[deckId];
          if (deck?.url) {
            audio.src = new URL(deck.url, window.location.origin).href;
            loadedUrlsRef.current[deckId] = deck.url;
            audio.load();
          }

          audioElementsRef.current[deckId] = audio;

          const source = ctx.createMediaElementSource(audio);
          source.connect(trimNode);
          mediaSourcesRef.current[deckId] = source;

          // Load metadata when available
          audio.addEventListener('loadedmetadata', () => {
            const state = useAudioStore.getState();
            const deck = state.decks[deckId];
            const pitch = deck?.pitch ?? 0;
            audio.playbackRate = 1 + pitch / 100;
            setDeck(deckId, { duration: audio.duration, isReady: true });
          });

          // Keep Zustand in sync with the native audio element state.
          audio.addEventListener('play', () => {
            setDeck(deckId, { isPlaying: true });
          });
          audio.addEventListener('pause', () => {
            setDeck(deckId, { isPlaying: false });
          });
          audio.addEventListener('ended', () => {
            setDeck(deckId, { isPlaying: false, progress: 0 });
          });

          // Update progress from audio element (throttled to avoid excessive state updates)
          let lastProgressUpdate = 0;
          audio.addEventListener('timeupdate', () => {
            const now = performance.now();
            if (now - lastProgressUpdate >= 100) {
              lastProgressUpdate = now;
              setDeck(deckId, { progress: audio.currentTime });
            }
          });

          // Gracefully handle load errors (e.g., file not found, unsupported format)
          audio.addEventListener('error', () => {
            const error = audio.error;
            if (error && error.code !== error.MEDIA_ERR_ABORTED) {
              console.warn(`Audio element ${deckId} load error:`, error.message);
              setDeck(deckId, { isReady: false });
            }
          });
        }
      });

      // ── Initialize the imperative AudioEngine with DSP nodes ─────────────
      audioEngine.init(ctx, deckNodesRef.current);

      // Sync initial DSP parameters from the Zustand store
      const state = useAudioStore.getState();
      [1, 2, 3, 4].forEach(deckId => {
        const deck = state.decks[deckId];
        if (deck) {
          audioEngine.setEQ(deckId, 'low', deck.eqLow);
          audioEngine.setEQ(deckId, 'mid', deck.eqMid);
          audioEngine.setEQ(deckId, 'high', deck.eqHi);
          audioEngine.setFilter(deckId, deck.filter);
          audioEngine.setTrim(deckId, deck.trim ?? 50);
          const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, state.crossfader);
          audioEngine.setGain(deckId, deck.volume, cfMult, state.isMuted);
        }
      });

      return ctx;
    } catch (e) {
      console.error('Failed to initialize Web Audio DSP:', e);
      return null;
    }
  };

  // ── Initialize Audio DSP and preload on mount ────────────────────────────
  useEffect(() => {
    initAudioDSP();

    const unlockAudio = () => {
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
      
      [1, 2, 3, 4].forEach(deckId => {
        const audio = audioElementsRef.current[deckId];
        if (audio) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                audio.pause();
              })
              .catch(() => {});
          }
        }
      });

      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── getQuantizedDelay (Micro-snapping for Quantized Cues/Play) ─────────────
  const getQuantizedDelay = (targetDeckId: number): number => {
    const state = useAudioStore.getState();
    const deckB = state.decks[targetDeckId];
    if (!deckB || !deckB.quantizeEnabled) return 0;

    // Find active master deck (excluding target deck, must be playing)
    const masterDeckId = [1, 2, 3, 4].find(
      id => id !== targetDeckId && state.decks[id]?.isPlaying && !state.decks[id]?.scMode
    );
    if (!masterDeckId) return 0;

    const deckA = state.decks[masterDeckId];
    const audioA = audioElementsRef.current[masterDeckId];
    if (!deckA || !audioA) return 0;

    const beatIntervalA = 60 / deckA.bpm;
    const quantizeInterval = beatIntervalA / 4; // 1/4 beat division snap

    const timeA = audioA.currentTime;
    const currentOffset = timeA % quantizeInterval;
    const timeToNext = quantizeInterval - currentOffset;

    // Real time to next beat division based on master's pitch fader rate
    const realTimeToNext = timeToNext / (1 + (deckA.pitch || 0) / 100);
    return realTimeToNext * 1000; // in milliseconds
  };

  // ── alignSyncPlayback (Direct BPM & Beat Phase Alignment) ──────────────────
  const alignSyncPlayback = (targetDeckId: number) => {
    const state = useAudioStore.getState();
    const deckB = state.decks[targetDeckId];
    const audioB = audioElementsRef.current[targetDeckId];
    if (!deckB || !audioB) return;

    // Find an active playing master deck (excluding target deck, must not be in SoundCloud mode)
    const masterDeckId = [1, 2, 3, 4].find(
      id => id !== targetDeckId && state.decks[id]?.isPlaying && !state.decks[id]?.scMode
    );
    if (!masterDeckId) return;

    const deckA = state.decks[masterDeckId];
    const audioA = audioElementsRef.current[masterDeckId];
    if (!deckA || !audioA) return;

    // 1. Sync BPM: calculate target pitch for Deck B to match Deck A's active BPM
    const activeBpmA = deckA.bpm * (1 + (deckA.pitch || 0) / 100);
    const targetPitchB = ((activeBpmA / deckB.bpm) - 1) * 100;
    const clampedPitchB = Math.max(-16, Math.min(16, targetPitchB));
    
    setDeck(targetDeckId, { pitch: clampedPitchB });
    audioB.playbackRate = 1 + clampedPitchB / 100;

    // 2. Phase alignment (Only if BEAT sync mode is active)
    if (deckB.syncMode !== 'BPM') {
      const beatIntervalA = 60 / deckA.bpm;
      const beatIntervalB = 60 / deckB.bpm;
      const offsetA = deckA.firstBeatOffset || 0;
      const offsetB = deckB.firstBeatOffset || 0;
      
      // Calculate progress relative to the first beat offset of Deck A
      const progressRelA = Math.max(0, audioA.currentTime - offsetA);
      const phaseA = (progressRelA % beatIntervalA) / beatIntervalA;
      
      const durationB = audioB.duration || deckB.duration || 0;
      
      // Calculate target time for Deck B relative to its own first beat offset
      const progressRelB = audioB.currentTime - offsetB;
      let targetTimeB = offsetB + Math.round(progressRelB / beatIntervalB) * beatIntervalB + phaseA * beatIntervalB;
      
      if (targetTimeB < 0) targetTimeB = 0;
      if (durationB && targetTimeB > durationB) targetTimeB = durationB;
      
      audioB.currentTime = targetTimeB;
      setDeck(targetDeckId, { progress: targetTimeB });
    }
  };

  const seekToFirstBeatOneOfBar = (deckId: number, firstBeatOffset: number, bpm: number) => {
    const audio = audioElementsRef.current[deckId];
    if (!audio) return;
    const beatInterval = 60 / bpm;
    let startBeatTime = firstBeatOffset;
    while (startBeatTime < 0) {
      startBeatTime += 4 * beatInterval;
    }
    audio.currentTime = startBeatTime;
    setDeck(deckId, { progress: startBeatTime });
  };

  // ── togglePlayGlobal (React-accessible version) ─────────────────────────
  const togglePlayGlobal = (deckId: number) => {
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (!deck) return;

    const executeToggle = () => {
      playClick(1000, 'sine', 0.03);
      const ctx = initAudioDSP();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

      const widget = widgetRefs.current[deckId];
      if (deck.scMode && widget) {
        try {
          deck.isPlaying ? widget.pause() : widget.play();
        } catch (e) {
          console.warn(`SoundCloud toggle failed on deck ${deckId}:`, e);
          setDeck(deckId, { isPlaying: !deck.isPlaying });
        }
        return;
      }

      const audio = audioElementsRef.current[deckId];
      if (!audio) return;

      if (audio.paused) {
        if (audio.readyState >= 2) {
          if (deck.syncEnabled) {
            alignSyncPlayback(deckId);
          }
          playPendingRef.current[deckId] = true;
          audio.play()
            .then(() => { playPendingRef.current[deckId] = false; })
            .catch(err => {
              playPendingRef.current[deckId] = false;
              if (err.name !== 'AbortError') {
                console.warn(`Play failed on deck ${deckId}:`, err.message);
                setDeck(deckId, { isPlaying: false });
              }
            });
        } else {
          // Attempt synchronous play first to lock in user gesture
          playPendingRef.current[deckId] = true;
          if (deck.syncEnabled) {
            alignSyncPlayback(deckId);
          }
          audio.play()
            .then(() => { playPendingRef.current[deckId] = false; })
            .catch(err => {
              playPendingRef.current[deckId] = false;
              if (err.name !== 'AbortError') {
                console.warn(`Synchronous play attempt failed on deck ${deckId}:`, err.message);
                
                // Fallback to canplay event listener if synchronous play failed
                const playWhenReady = () => {
                  if (audio.readyState >= 2) {
                    const freshDeck = useAudioStore.getState().decks[deckId];
                    if (freshDeck?.syncEnabled) {
                      alignSyncPlayback(deckId);
                    }
                    playPendingRef.current[deckId] = true;
                    audio.play()
                      .then(() => { playPendingRef.current[deckId] = false; })
                      .catch(err2 => {
                        playPendingRef.current[deckId] = false;
                        if (err2.name !== 'AbortError') {
                          console.warn(`Asynchronous fallback play failed on deck ${deckId}:`, err2.message);
                          setDeck(deckId, { isPlaying: false });
                        }
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
        audio.pause();
      }
    };

    // If starting playback, wait for quantization delay
    const audio = audioElementsRef.current[deckId];
    const isStarting = audio ? audio.paused : !deck.isPlaying;
    const delay = isStarting ? getQuantizedDelay(deckId) : 0;

    if (delay > 10) {
      setTimeout(executeToggle, delay);
    } else {
      executeToggle();
    }
  };

  // ── Expose isMuted to non-React code (audioUtils) ──────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).isMuted = isMuted;
    }
  }, [isMuted]);

  // ── Lazy SoundCloud widget initialisation ───────────────────────────────
  const initSCWidget = (deckId: number) => {
    const iframeEl = iframeRefs.current[deckId];
    if (!iframeEl) return;
    if (widgetRefs.current[deckId]) return; // already bound

    const SC = (window as any).SC;
    if (!SC) return;

    const widget = SC.Widget(iframeEl);
    widgetRefs.current[deckId] = widget;

    widget.bind(SC.Widget.Events.READY, () => {
      widget.getDuration((durationMs: number) => {
        setDeck(deckId, { isReady: true, scMode: true, duration: durationMs / 1000 });
      });
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      setDeck(deckId, { isPlaying: true, scMode: true });
    });
    widget.bind(SC.Widget.Events.PAUSE, () => {
      setDeck(deckId, { isPlaying: false });
    });
    widget.bind(SC.Widget.Events.FINISH, () => {
      setDeck(deckId, { isPlaying: false });
    });
    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
      // NOTE: DO NOT update progress to Zustand here!
      // SoundCloud fires this event 10+ times per second.
      // Updating Zustand causes AudioProvider to re-render,
      // which triggers the useEffect with [decks] dependency,
      // which loops through all HTML5 audio tags, burning CPU.
      // Instead, store progress only in DOM elements or refs.
      const currentDur = useAudioStore.getState().decks[deckId]?.duration ?? 0;
      const computedDur = data.relativePosition > 0
        ? data.currentPosition / data.relativePosition / 1000
        : currentDur;
      // Update duration only if it changed significantly
      if (Math.abs((computedDur || currentDur) - currentDur) > 0.5) {
        setDeck(deckId, { duration: computedDur || currentDur || 0, scMode: true });
      }
    });
  };

  // Load SC widget API once on mount, then init any already-mounted iframes
  useEffect(() => {
    const loadAndInit = () => {
      if ((window as any).SC) {
        mountedDecks.forEach(id => initSCWidget(id));
      } else if (!document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.onload = () => mountedDecks.forEach(id => initSCWidget(id));
        document.body.appendChild(script);
      } else {
        setTimeout(loadAndInit, 100);
      }
    };
    loadAndInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountedDecks]);

  // ── SoundCloud iframe cleanup — unmount when deck switches to local mode ──
  useEffect(() => {
    const unsubscribe = useAudioStore.subscribe(
      (state): boolean[] => [1, 2, 3, 4].map(id => state.decks[id]?.scMode ?? false),
      (scModes: boolean[]) => {
        // If a deck was in SC mode but is now local, remove it from mountedDecks
        const newMountedDecks = mountedDecks.filter((deckId) => {
          const state = useAudioStore.getState();
          const isNowLocal = !state.decks[deckId]?.scMode;
          if (isNowLocal) {
            // Clean up widget and iframe refs
            widgetRefs.current[deckId] = undefined as any;
            if (iframeRefs.current[deckId]) {
              iframeRefs.current[deckId]!.remove();
              iframeRefs.current[deckId] = null;
            }
            return false; // Remove from mounted list
          }
          return true; // Keep in mounted list
        });
        if (newMountedDecks.length !== mountedDecks.length) {
          setMountedDecks(newMountedDecks);
        }
      }
    );
    return unsubscribe;
  }, [mountedDecks]);

  // Cached LCD DOM node refs — populated lazily on first tick, never queried again
  const lcdRefsRef = useRef<Record<number, HTMLElement | null>>({});

  // ── DOM-only LCD time display (avoids React state for 60fps counter) ────
  useEffect(() => {
    let frameId: number;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate >= 100) {
        lastUpdate = now;
        [1, 2, 3, 4].forEach(deckId => {
          const audio = audioElementsRef.current[deckId];
          if (audio && audio.src) {
            // Cache the element reference on first access — getElementById inside
            // a 60fps rAF loop was adding unnecessary DOM query overhead every frame.
            if (!lcdRefsRef.current[deckId]) {
              lcdRefsRef.current[deckId] = document.getElementById(`lcd-time-${deckId}`);
            }
            const lcdEl = lcdRefsRef.current[deckId];
            const timeStr = formatTime(audio.currentTime);
            if (lcdEl && lcdEl.innerText !== timeStr) lcdEl.innerText = timeStr;
          }
        });
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // ── Selective EQ / Filter / Gain DSP sync (OPTIMIZED) ────────────────────
  // This effect now only runs when actual DSP parameters change (EQ, filter, volume, crossfader).
  // We use specific selectors instead of subscribing to the entire decks object.
  useEffect(() => {
    // Subscribe to EQ, filter, volume, crossfader changes only
    const unsubscribe = useAudioStore.subscribe(
      (state): [boolean, number] => [state.isMuted, state.crossfader],
      ([newMuted, newCrossfader]) => {
        // When mute or crossfader changes, update all deck gains
        [1, 2, 3, 4].forEach(deckId => {
          const state = useAudioStore.getState();
          const deck = state.decks[deckId];
          if (!deck) return;
          const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, newCrossfader);
          audioEngine.setGain(deckId, deck.volume, cfMult, newMuted);
        });
      }
    );
    return unsubscribe;
  }, []);

  // ── Pitch & PlaybackRate Direct Sync ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = useAudioStore.subscribe(
      state => [
        state.decks[1]?.pitch,
        state.decks[2]?.pitch,
        state.decks[3]?.pitch,
        state.decks[4]?.pitch,
      ],
      ([p1, p2, p3, p4]) => {
        const pitches = [p1, p2, p3, p4];
        [1, 2, 3, 4].forEach(deckId => {
          const audio = audioElementsRef.current[deckId];
          if (audio) {
            const pitch = pitches[deckId - 1] ?? 0;
            const targetRate = 1 + pitch / 100;
            if (audio.playbackRate !== targetRate) {
              audio.playbackRate = targetRate;
            }
          }
        });
      }
    );
    return unsubscribe;
  }, []);

  // ── Synced Decks Pitch Follower Sync ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = useAudioStore.subscribe(
      state => [
        state.decks[1]?.pitch, state.decks[1]?.bpm, state.decks[1]?.isPlaying, state.decks[1]?.syncEnabled,
        state.decks[2]?.pitch, state.decks[2]?.bpm, state.decks[2]?.isPlaying, state.decks[2]?.syncEnabled,
        state.decks[3]?.pitch, state.decks[3]?.bpm, state.decks[3]?.isPlaying, state.decks[3]?.syncEnabled,
        state.decks[4]?.pitch, state.decks[4]?.bpm, state.decks[4]?.isPlaying, state.decks[4]?.syncEnabled,
      ],
      () => {
        const state = useAudioStore.getState();
        [1, 2, 3, 4].forEach(deckId => {
          const deck = state.decks[deckId];
          if (deck && deck.syncEnabled && !deck.scMode) {
            // Find active master deck
            const masterId = [1, 2, 3, 4].find(
              id => id !== deckId && state.decks[id]?.isPlaying && !state.decks[id]?.scMode
            );
            if (masterId) {
              const masterDeck = state.decks[masterId];
              const activeBpmMaster = masterDeck.bpm * (1 + (masterDeck.pitch || 0) / 100);
              const targetPitch = ((activeBpmMaster / deck.bpm) - 1) * 100;
              const clampedPitch = Math.max(-16, Math.min(16, targetPitch));
              if (Math.abs((deck.pitch || 0) - clampedPitch) > 0.01) {
                setDeck(deckId, { pitch: clampedPitch });
              }
            }
          }
        });
      }
    );
    return unsubscribe;
  }, [setDeck]);

  // NOTE: Removed redundant EQ/Filter/Volume subscription.
  // Components now call audioEngine.setEQ/setFilter/setGain directly for zero-latency updates.
  // Zustand is only updated for UI display—no double-dip DSP calls.
  // MIDI or external sources can still update Zustand if needed, but the Controller
  // pattern (direct audioEngine calls) is the primary path.

  // ── Global togglePlayGlobal (window binding for MediaSession) ───────────
  useEffect(() => {
    (window as any).togglePlayGlobal = (deckIdInput?: number) => {
      const { decks: d, leftActiveDeck: lad } = useAudioStore.getState();
      const activeDeck = [1, 2, 3, 4].map(id => d[id]).find(dk => dk.isPlaying) || d[lad] || d[1];
      const deckId = deckIdInput !== undefined ? deckIdInput : ([1, 2, 3, 4].find(id => d[id].id === activeDeck.id) || 1);
      togglePlayGlobal(deckId);
    };
    return () => { delete (window as any).togglePlayGlobal; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── MediaSession API ────────────────────────────────────────────────────
  // Optimized: Only subscribe to isPlaying state for each deck, not entire decks object
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    
    const unsubscribe = useAudioStore.subscribe(
      state => [
        state.decks[1]?.isPlaying, state.decks[1]?.title,
        state.decks[2]?.isPlaying, state.decks[2]?.title,
        state.decks[3]?.isPlaying, state.decks[3]?.title,
        state.decks[4]?.isPlaying, state.decks[4]?.title,
      ],
      () => {
        const state = useAudioStore.getState();
        const activeDeckId = [1, 2, 3, 4].find(id => state.decks[id]?.isPlaying);
        const activeDeck = activeDeckId ? state.decks[activeDeckId] : null;
        if (activeDeck) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: activeDeck.title, artist: 'Henry IX', album: 'DJ Mix Archive',
            artwork: [{ src: getSessionImage(activeDeck.title), sizes: '512x512', type: 'image/jpeg' }],
          });
          navigator.mediaSession.playbackState = 'playing';
        } else {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        const { decks: d, leftActiveDeck: lad } = useAudioStore.getState();
        const playingId = [1, 2, 3, 4].find(id => d[id]?.isPlaying) || lad || 1;
        (window as any).togglePlayGlobal?.(playingId);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        const { decks: d, leftActiveDeck: lad } = useAudioStore.getState();
        const playingId = [1, 2, 3, 4].find(id => d[id]?.isPlaying) || lad || 1;
        (window as any).togglePlayGlobal?.(playingId);
      });
    } catch (e) { console.warn('MediaSession action handler error:', e); }
  }, []);

  // Note: togglePlayGlobal is defined earlier to allow access from window level



  // ── playTrack ─────────────────────────────────────────────────────────
  const playTrack = (track: any, targetDeckId?: number) => {
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

    if (deckId === 1 || deckId === 2) setLeftActiveDeck(deckId as 1 | 2);
    else setRightActiveDeck(deckId as 3 | 4);

    playClick(1000, 'sine', 0.04);
    const ctx = initAudioDSP();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    const widget = widgetRefs.current[deckId];
    const isLocal = !!track.isLocalFile || (track.url && track.url.startsWith('/'));

    // Toggle if same track
    if (deck.id === track.id) {
      const targetPlaying = !deck.isPlaying;
      if (deck.scMode && widget) {
        try { targetPlaying ? widget.play() : widget.pause(); } catch (e) {
          setDeck(deckId, { isPlaying: targetPlaying });
        }
      } else {
        const audio = audioElementsRef.current[deckId];
        if (audio && audio.src) {
          if (targetPlaying) {
            // Improve error handling for play on same track
            if (audio.readyState >= 2) {
              if (deck.syncEnabled) {
                alignSyncPlayback(deckId);
              }
              playPendingRef.current[deckId] = true;
              audio.play()
                .then(() => { playPendingRef.current[deckId] = false; })
                .catch(err => {
                  playPendingRef.current[deckId] = false;
                  if (err.name !== 'AbortError') {
                    console.warn(`Play failed on deck ${deckId}:`, err.message);
                    setDeck(deckId, { isPlaying: false });
                  }
                });
            } else {
              // Attempt synchronous play first to lock in user gesture
              playPendingRef.current[deckId] = true;
              if (deck.syncEnabled) {
                alignSyncPlayback(deckId);
              }
              audio.play()
                .then(() => { playPendingRef.current[deckId] = false; })
                .catch(err => {
                  playPendingRef.current[deckId] = false;
                  if (err.name !== 'AbortError') {
                    console.warn(`Synchronous play attempt failed on deck ${deckId}:`, err.message);
                    
                    // Wait for audio to be ready
                    const playWhenReady = () => {
                      const freshDeck = useAudioStore.getState().decks[deckId];
                      if (freshDeck?.syncEnabled) {
                        alignSyncPlayback(deckId);
                      }
                      playPendingRef.current[deckId] = true;
                      audio.play()
                        .then(() => { playPendingRef.current[deckId] = false; })
                        .catch(err2 => {
                          playPendingRef.current[deckId] = false;
                          if (err2.name !== 'AbortError') setDeck(deckId, { isPlaying: false });
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
        setDeck(deckId, { isPlaying: targetPlaying });
      }
      return;
    }

    // Switch to new track
    const audio = audioElementsRef.current[deckId];
    if (audio) audio.pause();
    if (widget) { try { widget.pause(); } catch (e) {} }

    if (isLocal) {
      if (audio) {
        const absoluteUrl = track.url.startsWith('blob:') || track.url.startsWith('http')
          ? track.url
          : new URL(track.url, window.location.origin).href;
        if (loadedUrlsRef.current[deckId] !== track.url) {
          loadedUrlsRef.current[deckId] = track.url;
          audio.src = absoluteUrl;
          audio.load();
        }
        
        // Attempt synchronous play first
        playPendingRef.current[deckId] = true;
        if (deck.syncEnabled) {
          alignSyncPlayback(deckId);
        }
        audio.play()
          .then(() => { playPendingRef.current[deckId] = false; })
          .catch(err => {
            playPendingRef.current[deckId] = false;
            if (err.name !== 'AbortError') {
              console.warn(`Synchronous play attempt on switch failed on deck ${deckId}:`, err.message);
              
              // Wait for audio to be ready before playing (fixes "no supported sources" error)
              const playWhenReady = () => {
                if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or better
                  const freshDeck = useAudioStore.getState().decks[deckId];
                  if (freshDeck?.syncEnabled) {
                    alignSyncPlayback(deckId);
                  }
                  playPendingRef.current[deckId] = true;
                  audio.play()
                    .then(() => { playPendingRef.current[deckId] = false; })
                    .catch(err2 => {
                      playPendingRef.current[deckId] = false;
                      if (err2.name !== 'AbortError') {
                        console.warn(`Play failed on deck ${deckId}:`, err2.message);
                        setDeck(deckId, { isPlaying: false });
                      }
                    });
                  audio.removeEventListener('canplay', playWhenReady);
                  audio.removeEventListener('error', handlePlayError);
                }
              };
              
              const handlePlayError = () => {
                playPendingRef.current[deckId] = false;
                console.error(`Audio load failed on deck ${deckId}:`, audio.error?.message);
                setDeck(deckId, { isPlaying: false, isReady: false });
                audio.removeEventListener('canplay', playWhenReady);
              };
              
              // If already ready, play immediately
              if (audio.readyState >= 2) {
                playWhenReady();
              } else {
                // Wait for canplay event
                audio.addEventListener('canplay', playWhenReady, { once: true });
                audio.addEventListener('error', handlePlayError, { once: true });
              }
            }
          });
      }
      setDeck(deckId, {
        id: track.id, title: track.title, url: track.url, link: track.link,
        bpm: track.bpm, isPlaying: true, progress: 0, scMode: false, isReady: false,
        waveformPeaks: trackWaveforms[track.id] || generateStaticPeaks(500),
        cuePoints: track.cuePoints,
      });
    } else {
      // SoundCloud mode — lazily mount iframe if not yet done
      if (!mountedIframeIds.current.has(deckId)) {
        mountedIframeIds.current.add(deckId);
        setMountedDecks(prev => [...prev, deckId]);
      }
      setDeck(deckId, {
        id: track.id, title: track.title, url: track.url, link: track.link,
        bpm: track.bpm, isPlaying: true, progress: 0, scMode: true, isReady: false,
        waveformPeaks: trackWaveforms[track.id] || generateStaticPeaks(500),
        cuePoints: track.cuePoints,
      });
      if (widget) {
        try {
          widget.load(track.url, {
            auto_play: true, hide_related: true, show_comments: false,
            show_user: false, show_reposts: false, visual: false,
          });
        } catch (e) {}
      }
    }
  };

  // ── loadLocalFile (via Web Worker) ─────────────────────────────────────
  const loadLocalFile = async (deckId: number, file: File) => {
    initAudioDSP();
    const audio = audioElementsRef.current[deckId];
    if (!audio) return;

    audio.pause();
    const objectUrl = URL.createObjectURL(file);
    loadedUrlsRef.current[deckId] = objectUrl;
    audio.src = objectUrl;
    audio.load();

    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

    // Show loading state immediately with placeholder peaks
    setDeck(deckId, {
      id: 'local',
      title: file.name,
      url: objectUrl,
      isReady: false, isPlaying: false, scMode: false,
      progress: 0, duration: 0, bpm: 128,
      waveformPeaks: generateStaticPeaks(500),
    });

    // Check IndexedDB cache first
    try {
      const cached = await getCachedWaveform(fileKey);
      if (cached) {
        setDeck(deckId, { bpm: cached.bpm, waveformPeaks: cached.peaks, firstBeatOffset: cached.firstBeatOffset });
        seekToFirstBeatOneOfBar(deckId, cached.firstBeatOffset || 0, cached.bpm);
        playClick(1100, 'sine', 0.1);
        return;
      }
    } catch (e) { console.warn('Cache read error:', e); }

    // Spin up Web Worker for analysis (non-blocking)
    try {
      if (!analysisWorkerRef.current) {
        analysisWorkerRef.current = new Worker('/workers/audioAnalysis.worker.js');
        analysisWorkerRef.current.onmessage = (e: MessageEvent) => {
          const { bpm, peaks, firstBeatOffset, fileKey: fk, error } = e.data;
          const cb = workerCallbacksRef.current[fk];
          if (cb) { cb({ bpm, peaks, firstBeatOffset, error }); delete workerCallbacksRef.current[fk]; }
        };
      }

      const slicedBuffer = await file.slice(0, 4 * 1024 * 1024).arrayBuffer();

      workerCallbacksRef.current[fileKey] = async ({ bpm, peaks, firstBeatOffset, error }: any) => {
        if (error) { console.error('Analysis worker error:', error); return; }
        setDeck(deckId, { bpm, waveformPeaks: peaks, firstBeatOffset });
        seekToFirstBeatOneOfBar(deckId, firstBeatOffset || 0, bpm);
        await cacheWaveform(fileKey, { bpm, peaks, firstBeatOffset });
      };

      // Transfer the ArrayBuffer to the worker (zero-copy)
      analysisWorkerRef.current.postMessage({ buffer: slicedBuffer, fileKey, numPeaks: 500 }, [slicedBuffer]);
    } catch (err) {
      console.error('Failed to spawn analysis worker:', err);
    }

    playClick(1100, 'sine', 0.1);
  };

  // ── seekLocalBuffer ───────────────────────────────────────────────────
  const seekLocalBuffer = (deckId: number, seekTime: number) => {
    const audio = audioElementsRef.current[deckId];
    if (audio) {
      audio.currentTime = seekTime;
      setDeck(deckId, { progress: seekTime });
    }
  };

  // ── estimateBPM (kept for backward compat, runs on main thread) ────────
  const estimateBPM = (buffer: AudioBuffer): number => {
    try {
      const data = buffer.getChannelData(0);
      const step = Math.floor(buffer.sampleRate / 10);
      let peaks = 0;
      for (let i = 0; i < data.length; i += step) {
        if (Math.abs(data[i]) > 0.6) peaks++;
      }
      const bpm = Math.round(peaks / (buffer.duration / 60));
      return bpm >= 80 && bpm <= 160 ? bpm : 128;
    } catch (e) { return 128; }
  };

  // ── Context value — useMemo so non-reactive data doesn't cascade ────────
  const contextValue = useMemo(() => (
    {
      // Stable refs — never cause re-renders
      audioElementsRef, playPendingRef, scratchingRef, widgetRefs,
      // Stable functions
      initAudioDSP, loadLocalFile, seekLocalBuffer,
      togglePlayGlobal, playTrack, playLockoutBlip, estimateBPM, alignSyncPlayback,
      // Lightweight UI state (rarely changes)
      isMuted, setIsMuted,
      preloaderComplete, setPreloaderComplete,
      // Deck state — now use getters to fetch fresh data from Zustand,
      // preventing stale closures and unnecessary re-renders
      get decks() { return useAudioStore.getState().decks; },
      setDecks,
      get crossfader() { return useAudioStore.getState().crossfader; },
      setCrossfader: useAudioStore.getState().setCrossfader,
      get leftActiveDeck() { return useAudioStore.getState().leftActiveDeck; },
      setLeftActiveDeck,
      get rightActiveDeck() { return useAudioStore.getState().rightActiveDeck; },
      setRightActiveDeck,
      // NOTE: activeDeckInfo removed from context to prevent getter allocation.
      // Components should use: useAudioStore(useShallow(selectActiveDeckInfo))
      // AnalyserNode getter
      get analyserNode() { return masterAnalyserRef.current; },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [isMuted, preloaderComplete]);
  // NOTE: deck/crossfader state are now getters that fetch fresh Zustand state.
  // Components needing reactive updates should subscribe via useAudioStore() directly.

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
      <FloatingPlayer />
      {/* Lazy SoundCloud iframes — only mounted when deck enters SC mode */}
      {[1, 2, 3, 4].map(deckId =>
        mountedDecks.includes(deckId) ? (
          <iframe
            key={deckId}
            ref={el => { iframeRefs.current[deckId] = el; }}
            className="hidden"
            src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2129822499&auto_play=false`}
            allow="autoplay"
            title={`SoundCloud Player Deck ${deckId}`}
          />
        ) : null
      )}
    </AudioContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// IndexedDB helpers (moved here from provider, keeping them co-located)
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

// ---------------------------------------------------------------------------
// FloatingPlayer
// ---------------------------------------------------------------------------

export function FloatingPlayer() {
  const pathname = usePathname();
  const decks = useAudioStore(s => s.decks);
  const { togglePlayGlobal, playTrack } = useAudio() ?? {};

  const activeDecks = [1, 2, 3, 4].filter(id => decks[id]?.isPlaying);
  const loadedDecks = [1, 2, 3, 4].filter(id => decks[id]?.isReady);
  const displayDecks = activeDecks.length > 0 ? activeDecks : loadedDecks.length > 0 ? [loadedDecks[0]] : [];

  if (pathname === '/mixes' || displayDecks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {displayDecks.map(deckId => {
        const deck = decks[deckId];
        return (
          <div key={deckId} className="flex items-center bg-zinc-950/95 backdrop-blur border border-zinc-800 p-2 rounded-full text-white shadow-lg shadow-black/50 overflow-hidden group">
            <div className="flex flex-col overflow-hidden whitespace-nowrap text-right w-[160px] pr-3">
              <span className="text-[9px] text-primary font-bold font-mono uppercase tracking-widest leading-tight">
                Deck {deckId}
              </span>
              <span className="text-xs font-bold tracking-wide text-zinc-300 truncate">{deck.title}</span>
            </div>
            <button
              onClick={() => togglePlayGlobal ? togglePlayGlobal(deckId) : playTrack?.(deck, deckId)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                deck.isPlaying ? 'bg-primary shadow-[0_0_8px_rgba(216,22,63,0.3)]' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {deck.isPlaying ? (
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
