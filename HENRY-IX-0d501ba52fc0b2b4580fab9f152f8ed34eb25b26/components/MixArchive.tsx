'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { Play, Pause, X } from 'lucide-react';
import { useAudioStore } from '@/store/audioStore';
import { cn } from '@/lib/utils';
import { LEDEqualizer, RotaryKnob } from '@/components/DJComponents';
import { audioEngine } from '@/lib/AudioEngine';
import { playClick, playTick, playLockoutBlip } from '@/lib/audioUtils';
import { 
  formatTime, 
  formatPlayheadTime, 
  getSessionImage, 
  getTrackDescription, 
  parseTracklist 
} from '@/lib/mixes';
import { VolumeFader } from './VolumeFader';
import { Crossfader } from './Crossfader';
import { VinylStack } from './VinylStack';
import { SingleDeckWaveform } from './SingleDeckWaveform';
import dynamic from 'next/dynamic';

const CDJHardware = dynamic(() => import('./CDJHardware'), { ssr: false });
const AudioVisualizerBackground = dynamic(() => import('./AudioVisualizerBackground'), { ssr: false });

interface MixArchiveProps {
  isDepth: boolean;
  activeView: 'cdj' | 'tracklist';
  setActiveView: React.Dispatch<React.SetStateAction<'cdj' | 'tracklist'>>;
  mixGroups: any[];
  seekDeckToTime: (deckId: number, seekPosSec: number) => void;
}

export default function MixArchive({ 
  isDepth, 
  activeView,
  setActiveView,
  mixGroups,
  seekDeckToTime
}: MixArchiveProps) {
  // Read state directly from Zustand to avoid parent-driven renders
  const decks = useAudioStore(s => s.decks);
  const setDecks = useAudioStore(s => s.setDecks);
  const crossfader = useAudioStore(s => s.crossfader);
  const setCrossfader = useAudioStore(s => s.setCrossfader);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);

  // Map local references and bindings directly to global audioEngine singleton
  const playTrack = audioEngine.playTrack.bind(audioEngine);
  const togglePlayGlobal = audioEngine.togglePlayGlobal.bind(audioEngine);
  const initAudioDSP = audioEngine.initAudioDSP.bind(audioEngine);
  const loadLocalFile = audioEngine.loadLocalFile.bind(audioEngine);
  const seekLocalBuffer = audioEngine.seekLocalBuffer.bind(audioEngine);
  const alignSyncPlayback = audioEngine.alignSyncPlayback.bind(audioEngine);
  const getQuantizedDelay = audioEngine.getQuantizedDelay.bind(audioEngine);

  const audioElementsRef = { current: audioEngine.audioElements };
  const widgetRefs = { current: audioEngine.widgetRefs };

  const decksRef = useRef(decks);
  useEffect(() => { decksRef.current = decks; }, [decks]);

  const archiveRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [deckCount, setDeckCount] = useState<2 | 4>(4);
  const [isBrowserCollapsed, setIsBrowserCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeDeckIds = (deckCount === 2 ? [1, 2] : [3, 1, 2, 4]) as readonly (1 | 2 | 3 | 4)[];

  const isStacked = useAudioStore(s => s.isStacked);
  const setStacked = useAudioStore(s => s.setStacked);
  const visualLatencyOffset = useAudioStore(s => s.visualLatencyOffset);
  const setVisualLatencyOffset = useAudioStore(s => s.setVisualLatencyOffset);

  useEffect(() => {
    const handleResize = () => {
      const isWindowStacked = window.innerWidth < 1536;
      setStacked(isWindowStacked);
      
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setDeckCount(2);
      }
      
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setStacked]);

  const getBrowserArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'browserL' : 'browserR';
    }
    return `browser${id}`;
  };

  const getWaveArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'waveL' : 'waveR';
    }
    return `wave${id}`;
  };

  const getControlArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'controlL' : 'controlR';
    }
    return `control${id}`;
  };

  // --- Visualizer and Keyboard Modal states ---
  const [visualizerMode] = useState<'ambient' | 'circular' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('henryix_visualizer_mode') as 'ambient' | 'circular' | 'grid';
      if (saved && ['ambient', 'circular', 'grid'].includes(saved)) {
        return saved;
      }
    }
    return 'ambient';
  });
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // --- Virtual USB Drag and Drop states ---
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [dragTargetDeck, setDragTargetDeck] = useState<number | null>(null);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDraggingFile(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // --- Keyboard Shortcuts System ---
  const triggerCueDown = (deckId: number) => {
    const deck = useAudioStore.getState().decks[deckId];
    if (!deck || deck.id === 'locked') return;

    playClick(720, 'sine', 0.015);
    const audioEl = audioElementsRef?.current?.[deckId];
    if (!audioEl) return;

    const mainCueTime = deck.mainCue || 0;
    const currentProgress = deck.progress || 0;

    if (deck.isPlaying) {
      audioEl.pause();
      if (seekLocalBuffer) seekLocalBuffer(deckId, mainCueTime);
      useAudioStore.getState().setDeck(deckId, { isPlaying: false, isCueStuttering: false });
    } else {
      if (Math.abs(currentProgress - mainCueTime) > 0.08) {
        const bpm = deck.bpm || 120;
        const pitch = deck.pitch || 0;
        const currentBpm = bpm * (1 + pitch / 100);
        const beatInterval = 60 / currentBpm;
        const offset = deck.firstBeatOffset || 0;
        const elapsed = currentProgress - offset;
        const closestBeatIndex = Math.round(elapsed / beatInterval);
        const snappedTime = Math.max(0, offset + closestBeatIndex * beatInterval);

        useAudioStore.getState().setDeck(deckId, { mainCue: snappedTime });
      } else {
        useAudioStore.getState().setDeck(deckId, { isPlaying: true, isCueStuttering: true });
        audioEl.play().catch((err: any) => {
          if (err.name !== 'AbortError') {
            useAudioStore.getState().setDeck(deckId, { isPlaying: false, isCueStuttering: false });
          }
        });
      }
    }
  };

  const triggerCueUp = (deckId: number) => {
    const deck = useAudioStore.getState().decks[deckId];
    if (!deck || deck.id === 'locked') return;

    if (deck.isCueStuttering) {
      const audioEl = audioElementsRef?.current?.[deckId];
      if (audioEl) {
        audioEl.pause();
      }
      if (seekLocalBuffer) seekLocalBuffer(deckId, deck.mainCue || 0);
      useAudioStore.getState().setDeck(deckId, { isPlaying: false, isCueStuttering: false });
    }
  };

  const triggerPadHotCue = (deckId: number, pad: string) => {
    const deck = useAudioStore.getState().decks[deckId];
    if (!deck || deck.id === 'locked') return;

    const currentProgress = deck.progress || 0;
    const savedTime = deck.hotCues?.[pad];

    if (savedTime === null || savedTime === undefined) {
      const bpm = deck.bpm || 120;
      const pitch = deck.pitch || 0;
      const currentBpm = bpm * (1 + pitch / 100);
      const beatInterval = 60 / currentBpm;
      const offset = deck.firstBeatOffset || 0;
      const elapsed = currentProgress - offset;
      const closestBeatIndex = Math.round(elapsed / beatInterval);
      const snappedTime = Math.max(0, offset + closestBeatIndex * beatInterval);

      playClick(880, 'sine', 0.02);
      useAudioStore.getState().setDeck(deckId, {
        hotCues: {
          ...deck.hotCues,
          [pad]: snappedTime
        }
      });
    } else {
      playClick(960, 'sine', 0.015);
      if (seekLocalBuffer) seekLocalBuffer(deckId, savedTime);

      const audioEl = audioElementsRef?.current?.[deckId];
      if (audioEl) {
        if (!deck.isPlaying) {
          useAudioStore.getState().setDeck(deckId, { isPlaying: true });
          if (deck.syncEnabled && alignSyncPlayback) {
            alignSyncPlayback(deckId);
          }
          audioEl.play().catch((err: any) => {
            if (err.name !== 'AbortError') {
              useAudioStore.getState().setDeck(deckId, { isPlaying: false });
            }
          });
        }
      }
    }
  };

  const pressedKeysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (pressedKeysRef.current[key]) return;
      pressedKeysRef.current[key] = true;

      const state = useAudioStore.getState();
      const leftId = state.leftActiveDeck;
      const rightId = state.rightActiveDeck;

      // --- Left Deck Controls ---
      if (key === ' ' || key === 'a') {
        e.preventDefault();
        if (togglePlayGlobal) togglePlayGlobal(leftId);
      } else if (key === 'q') {
        e.preventDefault();
        triggerCueDown(leftId);
      } else if (key === '1') {
        e.preventDefault();
        triggerPadHotCue(leftId, 'A');
      } else if (key === '2') {
        e.preventDefault();
        triggerPadHotCue(leftId, 'B');
      } else if (key === '3') {
        e.preventDefault();
        triggerPadHotCue(leftId, 'C');
      } else if (key === '4') {
        e.preventDefault();
        triggerPadHotCue(leftId, 'D');
      } else if (key === 'z') {
        e.preventDefault();
        const deck = state.decks[leftId];
        if (deck && deck.id !== 'locked') {
          useAudioStore.getState().setDeck(leftId, { pitchBend: -2.5 });
          playClick(600, 'sine', 0.01);
        }
      } else if (key === 'x') {
        e.preventDefault();
        const deck = state.decks[leftId];
        if (deck && deck.id !== 'locked') {
          useAudioStore.getState().setDeck(leftId, { pitchBend: 2.5 });
          playClick(900, 'sine', 0.01);
        }
      }

      // --- Right Deck Controls ---
      else if (key === 'enter' || key === 's') {
        e.preventDefault();
        if (togglePlayGlobal) togglePlayGlobal(rightId);
      } else if (key === 'e') {
        e.preventDefault();
        triggerCueDown(rightId);
      } else if (key === '7') {
        e.preventDefault();
        triggerPadHotCue(rightId, 'A');
      } else if (key === '8') {
        e.preventDefault();
        triggerPadHotCue(rightId, 'B');
      } else if (key === '9') {
        e.preventDefault();
        triggerPadHotCue(rightId, 'C');
      } else if (key === '0') {
        e.preventDefault();
        triggerPadHotCue(rightId, 'D');
      } else if (key === 'n') {
        e.preventDefault();
        const deck = state.decks[rightId];
        if (deck && deck.id !== 'locked') {
          useAudioStore.getState().setDeck(rightId, { pitchBend: -2.5 });
          playClick(600, 'sine', 0.01);
        }
      } else if (key === 'm') {
        e.preventDefault();
        const deck = state.decks[rightId];
        if (deck && deck.id !== 'locked') {
          useAudioStore.getState().setDeck(rightId, { pitchBend: 2.5 });
          playClick(900, 'sine', 0.01);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      pressedKeysRef.current[key] = false;

      const state = useAudioStore.getState();
      const leftId = state.leftActiveDeck;
      const rightId = state.rightActiveDeck;

      if (key === 'q') {
        e.preventDefault();
        triggerCueUp(leftId);
      } else if (key === 'e') {
        e.preventDefault();
        triggerCueUp(rightId);
      } else if (key === 'z' || key === 'x') {
        e.preventDefault();
        useAudioStore.getState().setDeck(leftId, { pitchBend: 0 });
      } else if (key === 'n' || key === 'm') {
        e.preventDefault();
        useAudioStore.getState().setDeck(rightId, { pitchBend: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlayGlobal, seekLocalBuffer, alignSyncPlayback]);

  // --- Active Loop Roll states ---
  const [activeRoll] = useState<Record<number, { division: number; startTime: number; virtualTime: number } | null>>({
    1: null, 2: null, 3: null, 4: null
  });
  const activeRollRef = useRef(activeRoll);
  useEffect(() => { activeRollRef.current = activeRoll; }, [activeRoll]);

  // --- Scratch physics and visual rotation refs ---
  const scratchStateRef = useRef<Record<number, {
    isScratching: boolean;
    lastAngle: number;
    centerX: number;
    centerY: number;
    wasPlaying: boolean;
    velocity: number;
    platterAngle: number;
    lastTime: number;
  }>>({
    1: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 },
    2: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 },
    3: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 },
    4: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 }
  });

  const platterRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // --- Fader Update Batching refs ---
  const pendingCrossfaderRef = useRef<number | null>(null);
  const crossfaderFrameScheduledRef = useRef(false);
  
  const pendingVolumesRef = useRef<Record<number, number>>({});
  const volumesFrameScheduledRef = useRef(false);

  const handleCrossfaderChange = (val: number) => {
    // 1. Instant audio DSP update (zero latency)
    const state = useAudioStore.getState();
    [1, 2, 3, 4].forEach(deckId => {
      const deck = state.decks[deckId];
      if (deck) {
        const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, val);
        audioEngine.setGain(deckId, deck.volume, cfMult, state.isMuted);
      }
    });

    // 2. Queue Zustand/React state update
    pendingCrossfaderRef.current = val;
    if (!crossfaderFrameScheduledRef.current) {
      crossfaderFrameScheduledRef.current = true;
      requestAnimationFrame(() => {
        crossfaderFrameScheduledRef.current = false;
        if (pendingCrossfaderRef.current !== null) {
          setCrossfader(pendingCrossfaderRef.current);
          pendingCrossfaderRef.current = null;
        }
      });
    }
  };

  const handleVolumeChange = (deckId: number, val: number) => {
    // 1. Instant audio DSP update (zero latency)
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (deck) {
      const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, state.crossfader);
      audioEngine.setGain(deckId, val, cfMult, state.isMuted);
    }

    // 2. Queue Zustand/React state update
    pendingVolumesRef.current[deckId] = val;
    if (!volumesFrameScheduledRef.current) {
      volumesFrameScheduledRef.current = true;
      requestAnimationFrame(() => {
        volumesFrameScheduledRef.current = false;
        const updates = { ...pendingVolumesRef.current };
        pendingVolumesRef.current = {};
        
        setDecks((prev: any) => {
          const next = { ...prev };
          Object.entries(updates).forEach(([idStr, v]) => {
            const id = Number(idStr);
            if (next[id]) {
              next[id] = { ...next[id], volume: v };
            }
          });
          return next;
        });
      });
    }
  };

  // --- Global Deck Controls for hotkeys and platters ---


  const triggerHotCue = React.useCallback((deckId: number, percentage: number, cueIndex?: number) => {
    const deck = decks[deckId];
    const isLocked = deck?.id === 'locked';
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    const executeCue = () => {
      initAudioDSP();
      const widget = widgetRefs.current[deckId];
      playClick(1200, 'sine', 0.02);

      const duration = deck.duration || 300;
      let seekPosSec = percentage * duration;

      // Use absolute custom cue point if defined
      if (deck.cuePoints && cueIndex !== undefined && deck.cuePoints[cueIndex] !== undefined) {
        seekPosSec = deck.cuePoints[cueIndex];
      }

      if (deck.scMode && widget) {
        try {
          widget.seekTo(seekPosSec * 1000);
        } catch (e) {
          setDecks((prev: any) => ({
            ...prev,
            [deckId]: { ...prev[deckId], progress: seekPosSec }
          }));
        }
      } else {
        if (seekLocalBuffer) {
          seekLocalBuffer(deckId, seekPosSec);
        }

        setDecks((prev: any) => ({
          ...prev,
          [deckId]: { ...prev[deckId], progress: seekPosSec }
        }));
      }
    };

    const delay = getQuantizedDelay(deckId);
    if (delay > 10) {
      setTimeout(executeCue, delay);
    } else {
      executeCue();
    }
  }, [decks, playLockoutBlip, initAudioDSP, widgetRefs, seekLocalBuffer, setDecks, getQuantizedDelay]);

  // --- Platter Physics & Loop Roll Tick useEffect ---
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const updateTick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      [1, 2, 3, 4].forEach((deckId) => {
        const state = scratchStateRef.current[deckId];
        const deck = decksRef.current[deckId];
        const el = platterRefs.current[deckId];
        if (!state || !deck) return;

        const audio = audioElementsRef?.current?.[deckId];
        const isActuallyPlaying = deck.scMode ? deck.isPlaying : (audio ? !audio.paused : deck.isPlaying);

        // 1. Scratch / Platter Physics
        if (state.isScratching) {
          if (el) {
            el.style.transform = `rotate(${state.platterAngle}rad)`;
          }
        } else if (Math.abs(state.velocity) > 0.001) {
          state.velocity *= 0.95; // Platter friction
          state.platterAngle += state.velocity;
          
          if (!deck.scMode && audio && isFinite(audio.duration) && audio.duration > 0) {
            const timeDelta = (state.velocity / (2 * Math.PI)) * 2.5; // 2.5s per full rotation
            let nextTime = audio.currentTime + timeDelta;
            if (nextTime < 0) nextTime = 0;
            if (nextTime > audio.duration) nextTime = audio.duration;
            if (isFinite(nextTime) && !isNaN(nextTime)) {
              audio.currentTime = nextTime;
            }
          }
          
          if (el) {
            el.style.transform = `rotate(${state.platterAngle}rad)`;
          }
        } else {
          if (isActuallyPlaying) {
            const pitchModifier = 1 + (deck.pitch || 0) / 100;
            const rotSpeed = ((2 * Math.PI) / 3.0) * pitchModifier; // 3 seconds per rotation
            state.platterAngle += rotSpeed * dt;
          }
          if (el) {
            el.style.transform = `rotate(${state.platterAngle}rad)`;
          }
        }

        // 2. Loop Roll Sweeping
        const roll = activeRollRef.current[deckId];
        if (roll && audio && !audio.paused) {
          const pitchModifier = 1 + (deck.pitch || 0) / 100;
          roll.virtualTime += dt * pitchModifier;
          
          const currentBpm = deck.bpm * pitchModifier;
          const beatDuration = 60 / currentBpm;
          const rollDuration = beatDuration * roll.division;
          
          if (audio.currentTime >= roll.startTime + rollDuration) {
            audio.currentTime = roll.startTime;
          }
        }
        
        // 3. Manual Loop Sweeping
        if (deck.isLoopActive && 
            typeof deck.loopIn === 'number' && isFinite(deck.loopIn) && !isNaN(deck.loopIn) &&
            typeof deck.loopOut === 'number' && isFinite(deck.loopOut) && !isNaN(deck.loopOut) && 
            audio && !audio.paused) {
          if (audio.currentTime >= deck.loopOut) {
            audio.currentTime = deck.loopIn;
          }
        }
      });

      frameId = requestAnimationFrame(updateTick);
    };

    frameId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(frameId);
  }, [audioElementsRef]);

  // --- Keyboard DJ Hotkeys useEffect ---
  const togglePlayGlobalRef = useRef(togglePlayGlobal);
  useEffect(() => { togglePlayGlobalRef.current = togglePlayGlobal; }, [togglePlayGlobal]);

  const alignSyncPlaybackRef = useRef(alignSyncPlayback);
  useEffect(() => { alignSyncPlaybackRef.current = alignSyncPlayback; }, [alignSyncPlayback]);

  const triggerHotCueRef = useRef(triggerHotCue);
  useEffect(() => { triggerHotCueRef.current = triggerHotCue; }, [triggerHotCue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      // Read state dynamically from Zustand to avoid re-binding keydown listener on slider drag/deck changes
      const state = useAudioStore.getState();
      const leftDeckId = state.leftActiveDeck;
      const rightDeckId = state.rightActiveDeck;
      const currentCrossfader = state.crossfader;

      // Left Deck controls
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        togglePlayGlobalRef.current?.(leftDeckId);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        triggerHotCueRef.current?.(leftDeckId, 0.0, 0);
      } else if (e.key === '1') {
        e.preventDefault();
        triggerHotCueRef.current?.(leftDeckId, 0.0, 0);
      } else if (e.key === '2') {
        e.preventDefault();
        triggerHotCueRef.current?.(leftDeckId, 0.25, 1);
      } else if (e.key === '3') {
        e.preventDefault();
        triggerHotCueRef.current?.(leftDeckId, 0.5, 2);
      } else if (e.key === '4') {
        e.preventDefault();
        triggerHotCueRef.current?.(leftDeckId, 0.75, 3);
      }

      // Right Deck controls
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePlayGlobalRef.current?.(rightDeckId);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        triggerHotCueRef.current?.(rightDeckId, 0.0, 0);
      } else if (e.key === '7') {
        e.preventDefault();
        triggerHotCueRef.current?.(rightDeckId, 0.0, 0);
      } else if (e.key === '8') {
        e.preventDefault();
        triggerHotCueRef.current?.(rightDeckId, 0.25, 1);
      } else if (e.key === '9') {
        e.preventDefault();
        triggerHotCueRef.current?.(rightDeckId, 0.5, 2);
      } else if (e.key === '0') {
        e.preventDefault();
        triggerHotCueRef.current?.(rightDeckId, 0.75, 3);
      }

      // Mixer Arrow crossfader controls
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCrossfader(Math.max(0, currentCrossfader - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCrossfader(Math.min(100, currentCrossfader + 5));
      }

      // SYNC triggers
      else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        // Read directly from decksRef to avoid stale closures
        const d1 = decksRef.current[leftDeckId];
        const d2 = decksRef.current[rightDeckId];
        if (d1 && d2 && d1.id !== 'locked') {
          playClick(800, 'sine', 0.02);
          const isBothPlaying = d1.isPlaying && d2.isPlaying;
          const nextSyncState = isBothPlaying ? true : !d1.syncEnabled;
          setDecks((prev: any) => ({
            ...prev,
            [leftDeckId]: { ...prev[leftDeckId], syncEnabled: nextSyncState }
          }));
          if (isBothPlaying && alignSyncPlaybackRef.current) {
            alignSyncPlaybackRef.current(leftDeckId);
          }
        }
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        const d1 = decksRef.current[rightDeckId];
        const d2 = decksRef.current[leftDeckId];
        if (d1 && d2 && d1.id !== 'locked') {
          playClick(800, 'sine', 0.02);
          const isBothPlaying = d1.isPlaying && d2.isPlaying;
          const nextSyncState = isBothPlaying ? true : !d1.syncEnabled;
          setDecks((prev: any) => ({
            ...prev,
            [rightDeckId]: { ...prev[rightDeckId], syncEnabled: nextSyncState }
          }));
          if (isBothPlaying && alignSyncPlaybackRef.current) {
            alignSyncPlaybackRef.current(rightDeckId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCrossfader, setDecks]);

  // Average the parameters of all playing decks for the central mixer display
  const playingDecks = Object.values(decks).filter((d: any) => d.isPlaying);
  let activeBpm = 120;
  let activeEqHi = 50;
  let activeEqMid = 50;
  let activeEqLow = 50;
  
  if (playingDecks.length > 0) {
    activeBpm = playingDecks.reduce((sum: number, d: any) => sum + (d.bpm * (1 + (d.pitch || 0) / 100)), 0) / playingDecks.length;
    activeEqHi = playingDecks.reduce((sum: number, d: any) => sum + d.eqHi, 0) / playingDecks.length;
    activeEqMid = playingDecks.reduce((sum: number, d: any) => sum + d.eqMid, 0) / playingDecks.length;
    activeEqLow = playingDecks.reduce((sum: number, d: any) => sum + d.eqLow, 0) / playingDecks.length;
  } else {
    // If no deck is playing, track the active selected left deck's EQs/BPM
    const leftDeck = decks[leftActiveDeck] || decks[1];
    activeBpm = leftDeck.bpm * (1 + (leftDeck.pitch || 0) / 100);
    activeEqHi = leftDeck.eqHi;
    activeEqMid = leftDeck.eqMid;
    activeEqLow = leftDeck.eqLow;
  }

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // Helper to determine active playing deck for background visualizer
  const getActiveVisualizerState = () => {
    const active = Object.values(decks).find((d: any) => d.isPlaying);
    return active ? { isPlaying: true } : { isPlaying: false };
  };

  const activeVisualizer = getActiveVisualizerState();

  const [browserFolders, setBrowserFolders] = useState<Record<number, string>>({
    1: 'all', 2: 'all', 3: 'all', 4: 'all'
  });

  const renderDeckBrowser = (deckId: 1 | 2 | 3 | 4) => {
    const deck = decks[deckId];
    const isLocked = deck?.id === 'locked';
    const activeFolder = browserFolders[deckId] || 'all';
    
    const themeColor = 
      deckId === 1 ? 'rgba(211,15,49,1)' : // red
      deckId === 2 ? 'rgba(34,211,238,1)' : // cyan
      deckId === 3 ? 'rgba(16,185,129,1)' : // green
      'rgba(234,179,8,1)'; // yellow

    if (isLocked) {
      // We still get tracks for when it's not locked, but let's define folderMixGroups and tracks
    }
    const folderMixGroups = mixGroups || [];
    let tracks: any[] = [];
    if (activeFolder === 'all') {
      tracks = folderMixGroups.flatMap(g => g.mixes || []);
    } else {
      const matchedGroup = folderMixGroups.find(g => g.title.toLowerCase() === activeFolder.toLowerCase());
      tracks = matchedGroup ? (matchedGroup.mixes || []) : [];
    }

    return (
      <div 
        className={cn(
          "rounded-xl border border-zinc-900 bg-zinc-950/90 flex flex-col text-zinc-300 font-mono text-[9px] select-none h-full overflow-hidden shadow-2xl relative transition-all duration-300",
          isBrowserCollapsed ? "min-h-0" : "min-h-[180px]"
        )}
        style={{ borderTop: `2px solid ${themeColor}` }}
      >
        {/* Rekordbox Playlist Browser Header */}
        <div className="flex justify-between items-center bg-black/60 border-b border-zinc-900 px-3 py-1.5 shrink-0 text-[8px] text-zinc-500 tracking-wider uppercase font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <span>BROWSER // DECK {deckId}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsBrowserCollapsed(!isBrowserCollapsed);
                playClick(700, 'sine', 0.03);
              }}
              className="ml-2 px-1 hover:text-white transition-colors cursor-pointer text-[10px] leading-none text-zinc-500 hover:text-zinc-300 active:scale-95"
              title={isBrowserCollapsed ? "Expand Browser" : "Collapse Browser"}
            >
              {isBrowserCollapsed ? '▼' : '▲'}
            </button>
          </div>
          <span>USB1 // PLAYLISTS</span>
        </div>

        {/* Directory & Tracks Split Grid */}
        {!isBrowserCollapsed && (
          isLocked ? (
            <div className="flex-grow flex flex-col justify-center items-center p-4 text-center min-h-[120px]">
              <span className="text-yellow-500 font-bold tracking-widest text-[11px] uppercase">
                DECK LOCKED // COMING SOON
              </span>
              <span className="text-zinc-600 text-[8px] mt-2 tracking-wider">
                ACCESS_DENIED // REQUIRE_RELEASE
              </span>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 w-full">
              {/* Left Column: Playlist Folders Tree */}
              <div className="w-[35%] border-r border-zinc-900 bg-black/25 flex flex-col p-1.5 gap-1 shrink-0 overflow-y-auto custom-scrollbar min-w-0">
                <span className="text-[6.5px] text-zinc-600 uppercase font-black tracking-widest px-1 mb-1">Source</span>
                <button
                  onClick={() => {
                    setBrowserFolders(prev => ({ ...prev, [deckId]: 'all' }));
                    playClick(800, 'sine', 0.02);
                  }}
                  className={cn(
                    "w-full text-left py-1 px-1.5 rounded transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer hover:bg-zinc-900/40 text-[8.5px] uppercase font-bold",
                    activeFolder === 'all' ? "bg-zinc-900 text-white border-l-2" : "text-zinc-500 hover:text-zinc-300"
                  )}
                  style={{ borderLeftColor: activeFolder === 'all' ? themeColor : 'transparent' }}
                >
                  📂 ALL MIXES
                </button>
                {folderMixGroups.map(group => (
                  <button
                    key={group.title}
                    onClick={() => {
                      setBrowserFolders(prev => ({ ...prev, [deckId]: group.title }));
                      playClick(800, 'sine', 0.02);
                    }}
                    className={cn(
                      "w-full text-left py-1 px-1.5 rounded transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer hover:bg-zinc-900/40 text-[8.5px] uppercase font-bold",
                      activeFolder === group.title ? "bg-zinc-900 text-white border-l-2" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    style={{ borderLeftColor: activeFolder === group.title ? themeColor : 'transparent' }}
                  >
                    📂 {group.title}
                  </button>
                ))}
                
                {/* Custom upload helper in sidebar */}
                <div className="mt-auto border-t border-zinc-900/60 pt-1.5">
                  <button
                    onClick={() => {
                      const fileInput = fileInputRefs.current[deckId];
                      if (fileInput) fileInput.click();
                    }}
                    className="w-full text-center py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-[7px] tracking-widest font-black transition-colors uppercase cursor-pointer"
                  >
                    📁 CUSTOM LOAD
                  </button>
                  <input
                    type="file"
                    ref={el => { fileInputRefs.current[deckId] = el; }}
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && loadLocalFile) {
                        loadLocalFile(deckId, file);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Right Column: Track Table List */}
              <div className="flex-1 flex flex-col min-w-0 bg-black/10 overflow-hidden">
                {/* Table Headers */}
                <div className="grid grid-cols-[12%_63%_25%] border-b border-zinc-900/80 px-2 py-1 text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest bg-black/30 shrink-0">
                  <span>#</span>
                  <span>Track Title</span>
                  <span className="text-right">BPM</span>
                </div>

                {/* Table Rows */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5 min-h-0">
                  {tracks.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-zinc-600 text-[8px] italic py-4">
                      No tracks available
                    </div>
                  ) : (
                    tracks.map((mix, index) => {
                      const isLoaded = deck.id === mix.id;
                      const idxStr = (index + 1).toString().padStart(3, '0');
                      
                      return (
                        <div 
                          key={mix.id}
                          onClick={() => {
                            playTrack(mix, deckId);
                          }}
                          className={cn(
                            "grid grid-cols-[12%_63%_25%] items-center px-1.5 py-1.5 rounded cursor-pointer transition-colors duration-200 hover:bg-zinc-900/30 select-none group border border-transparent",
                            isLoaded 
                              ? "bg-zinc-900 text-white font-black" 
                              : "text-zinc-400 hover:text-zinc-200"
                          )}
                          style={{ 
                            borderColor: isLoaded ? `${themeColor}20` : 'transparent',
                            color: isLoaded ? themeColor : undefined 
                          }}
                        >
                          <span className={cn("text-[7.5px]", isLoaded ? "text-white" : "text-zinc-600 font-bold")}>
                            {idxStr}
                          </span>
                          <span className="truncate pr-1 uppercase tracking-wide text-[8.5px]">
                            🎵 {mix.title}
                          </span>
                          <span className="text-right text-[8.5px] font-bold text-zinc-500 font-mono">
                            {mix.bpm || 120}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  const renderStackedWaveform = (deckId: 1 | 2 | 3 | 4) => {
    const deck = decks[deckId];
    const isPlaying = deck.isPlaying;
    const isLocked = deck.id === 'locked';
    const themeColor = 
      deckId === 1 ? 'rgba(211,15,49,1)' : // red
      deckId === 2 ? 'rgba(34,211,238,1)' : // cyan
      deckId === 3 ? 'rgba(16,185,129,1)' : // green
      'rgba(234,179,8,1)'; // yellow

    return (
      <div 
        className="w-full flex items-stretch bg-zinc-950 border border-zinc-900/60 rounded-xl overflow-hidden shadow-lg h-full min-h-[48px] max-h-[80px]"
        style={{ borderLeft: `3px solid ${themeColor}` }}
      >
        {/* Left Info Panel */}
        <div className="w-[100px] border-r border-zinc-900 bg-black/40 flex flex-col justify-between p-1.5 shrink-0 select-none text-left">
          <div className="flex justify-between items-center">
            <span className="text-[7.5px] font-black uppercase font-mono tracking-wider" style={{ color: themeColor }}>
              DECK {deckId}
            </span>
            <span className="text-[6.5px] text-zinc-600 font-bold font-mono">USB1</span>
          </div>
          <div className="text-[8.5px] font-bold text-zinc-300 font-mono truncate leading-none uppercase">
            {isLocked ? "LOCKED" : deck.title || "EMPTY"}
          </div>
          <div className="flex justify-between items-center text-[7px] text-zinc-500 font-mono">
            <span>KEY: --</span>
            <span>{isLocked ? "--:--" : formatTime(deck.progress || 0)}</span>
          </div>
        </div>

        {/* Scrolling Waveform Canvas */}
        <div className="flex-1 min-w-0 flex items-center justify-center p-1 bg-black">
          <div className="w-full h-full relative flex items-center justify-center">
            <SingleDeckWaveform
              deckId={deckId}
              deck={deck}
              isDepth={isDepth}
            />
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-[60px] border-l border-zinc-900 bg-black/40 flex flex-col justify-center items-center p-1.5 shrink-0 select-none text-center">
          <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-black leading-none mb-0.5">BPM</span>
          <span className="font-black text-zinc-400 font-mono text-[9px] tracking-wide">
            {isLocked ? "130.00" : (deck.bpm * (1 + (deck.pitch || 0) / 100)).toFixed(1)}
          </span>
          <span className={cn(
            "text-[6.5px] font-bold mt-1 px-1 rounded",
            isPlaying ? "bg-primary/10 text-primary animate-pulse" : "text-zinc-600"
          )} style={{ color: isPlaying ? themeColor : undefined }}>
            {isPlaying ? "ACTIVE" : "STANDBY"}
          </span>
        </div>
      </div>
    );
  };

  const renderDeckControls = (deckId: 1 | 2 | 3 | 4) => {
    return (
      <div style={{ touchAction: 'none' }} className="w-full h-full select-none">
        <CDJHardware deckId={deckId} />
      </div>
    );
  };

  const renderMixer = () => {
    return (
      <div className={cn(
        "rounded-xl p-2.5 px-3 flex flex-col justify-between bg-zinc-950 border min-h-[180px] h-full flex-grow relative transition-all duration-300 shadow-2xl z-10 w-full",
        isDepth ? "border-zinc-900" : "border-black/10"
      )}>
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none z-0" style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }} />

        {/* Mixer plate tag */}
        <div className="w-full flex justify-between items-center border-b border-zinc-900/60 pb-1 z-10 shrink-0 select-none">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[8px] text-primary tracking-[0.2em] font-bold">
              MIXER CORE v4.1 // TB-303
            </span>
          </div>
          <span className="font-mono text-[6px] text-zinc-600 tracking-[0.1em] font-bold">
            UK PATENT_PEND
          </span>
        </div>

        {/* LED EQ screen */}
        <div className="w-full my-0.5 z-10 shrink-0">
          <LEDEqualizer 
            isPlaying={Object.values(decks).some((d: any) => d.isPlaying)} 
            bpm={activeBpm} 
            eqHi={activeEqHi}
            eqMid={activeEqMid}
            eqLow={activeEqLow}
            leftDeckId={leftActiveDeck}
            rightDeckId={rightActiveDeck}
            leftPlaying={decks[leftActiveDeck]?.isPlaying}
            rightPlaying={decks[rightActiveDeck]?.isPlaying}
          />
        </div>

        {/* Mixer Channels Grid */}
        <div className={cn(
          "grid gap-1.5 md:gap-2.5 my-2 items-stretch justify-center z-10 flex-grow min-h-0 select-none",
          deckCount === 2 ? "grid-cols-2" : "grid-cols-4"
        )}>
          {(deckCount === 2 ? [1, 2] : [3, 1, 2, 4]).map(id => {
            const deck = decks[id];
            const isLocked = deck?.id === 'locked';
            const isActive = (id <= 2 ? leftActiveDeck === id : rightActiveDeck === id);
            
            const channelColor = 
              id === 1 ? 'rgba(211,15,49,1)' : // red
              id === 2 ? 'rgba(34,211,238,1)' : // cyan
              id === 3 ? 'rgba(16,185,129,1)' : // green
              'rgba(234,179,8,1)'; // yellow

            return (
              <div 
                key={id}
                style={{ containerType: 'inline-size' }}
                className={cn(
                  "w-full flex flex-col items-center justify-between gap-2 py-2 px-1 rounded-xl transition-all border h-full min-h-0",
                  isActive ? "bg-zinc-900/30 border-zinc-800/80" : "border-transparent opacity-60 hover:opacity-90"
                )}
              >
                <span 
                  className="font-mono text-[7.5px] font-black tracking-widest uppercase leading-none"
                  style={{ color: channelColor }}
                >
                  CH {id}
                </span>

                <div className="flex flex-col gap-2 w-full">
                  <RotaryKnob 
                    label="TRIM"
                    value={deck.trim ?? 50}
                    size="flex"
                    onChange={(val) => {
                      audioEngine.setTrim(id, val);
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], trim: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="HI"
                    value={deck.eqHi}
                    size="flex"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setEQ(id, 'high', val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], eqHi: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="MID"
                    value={deck.eqMid}
                    size="flex"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setEQ(id, 'mid', val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], eqMid: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="LOW"
                    value={deck.eqLow}
                    size="flex"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setEQ(id, 'low', val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], eqLow: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="FLT"
                    value={deck.filter}
                    size="flex"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setFilter(id, val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], filter: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                </div>

                {/* Vertical Fader */}
                <div className="flex flex-col items-center gap-1 mt-1 relative w-[50cqw] max-w-[40px] min-w-[20px] flex-grow min-h-0 h-full">
                  <span className="text-[min(8px,max(5.5px,7cqw))] text-zinc-500 font-mono uppercase tracking-widest leading-none font-bold shrink-0">
                    VOL
                  </span>
                  
                  <VolumeFader
                    deckId={id}
                    volume={deck.volume}
                    isLocked={isLocked}
                    channelColor={channelColor}
                    onChange={(val) => handleVolumeChange(id, val)}
                    onLockout={playLockoutBlip}
                  />
                </div>

                {/* headphones cue fader assign */}
                <button
                  onClick={() => {
                    if (isLocked) {
                      playLockoutBlip();
                      return;
                    }
                    playClick(750, 'sine', 0.02);
                    const nextAssign = 
                      deck.crossfaderAssign === 'L' ? 'R' :
                      deck.crossfaderAssign === 'R' ? 'THRU' : 'L';
                    
                    // 1. Instant audio DSP update (zero latency)
                    const state = useAudioStore.getState();
                    const cfMult = audioEngine.computeCrossfaderGain(nextAssign, state.crossfader);
                    audioEngine.setGain(id, deck.volume, cfMult, state.isMuted);

                    // 2. Update Zustand for UI display
                    setDecks((prev: any) => ({
                      ...prev,
                      [id]: { ...prev[id], crossfaderAssign: nextAssign }
                    }));
                  }}
                  className={cn(
                    "mt-2 px-2 py-0.5 rounded text-[7.5px] font-mono font-bold tracking-widest border transition-colors cursor-pointer leading-none",
                    isLocked
                      ? "bg-zinc-950 border-zinc-900/50 text-zinc-800 cursor-not-allowed"
                      : deck.crossfaderAssign === 'L' ? "bg-primary/20 border-primary/30 text-primary"
                      : deck.crossfaderAssign === 'R' ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  {deck.crossfaderAssign}
                </button>
              </div>
            );
          })}
        </div>

        {/* Master Crossfader */}
        <div className="w-full flex flex-col items-center gap-0.5 border-t border-zinc-900/80 pt-1 z-10 shrink-0 select-none">
          <div className="flex justify-between w-full text-[6px] text-zinc-500 font-mono tracking-wider px-1 uppercase font-bold">
            <span>A/B DECK</span>
            <span>CROSSFADER</span>
            <span>C/D DECK</span>
          </div>

          <Crossfader
            value={crossfader}
            onChange={handleCrossfaderChange}
          />
        </div>
      </div>
    );
  };

  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  const renderTracklist = () => {
    if (expandedFamily) {
      const group = mixGroups.find(g => g.title === expandedFamily);
      if (!group) {
        setExpandedFamily(null);
        return null;
      }
      
      return (
        <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-zinc-900 pb-4">
            <button 
              onClick={() => { setExpandedFamily(null); playClick(900, 'sine', 0.02); }}
              onMouseEnter={() => playTick()}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] uppercase tracking-widest font-black rounded-md border border-zinc-800 transition-colors flex items-center gap-2 active:scale-95"
            >
              <span className="text-primary">&lt;</span> BACK TO ARCHIVE
            </button>
            <h2 className="text-2xl md:text-4xl font-sans font-bold text-primary tracking-widest uppercase glitch" data-text={group.title}>{group.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {group.mixes.map((track: any) => {
              const isPlaying = activeVisualizer.isPlaying && (
                decks[leftActiveDeck]?.title === track.title || 
                decks[rightActiveDeck]?.title === track.title
              );
              const playingOnDecks: number[] = [];
              if (decks[1]?.title === track.title && decks[1]?.isPlaying) playingOnDecks.push(1);
              if (decks[2]?.title === track.title && decks[2]?.isPlaying) playingOnDecks.push(2);
              if (decks[3]?.title === track.title && decks[3]?.isPlaying) playingOnDecks.push(3);
              if (decks[4]?.title === track.title && decks[4]?.isPlaying) playingOnDecks.push(4);

              return (
                <div 
                  key={track.id}
                  onMouseEnter={() => playTick()}
                  className={cn(
                    "group flex flex-col gap-4 p-4 rounded-xl border bg-zinc-950/80 hover:bg-zinc-900/60 transition-all duration-300",
                    playingOnDecks.length > 0 ? "border-primary/40 shadow-[0_0_20px_rgba(216,22,63,0.1)]" : "border-zinc-800"
                  )}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-800/80 shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getSessionImage(track.title, track.artworkUrl)} 
                      alt={track.title}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
                        playingOnDecks.length > 0 && "animate-[pulse_4s_ease-in-out_infinite]"
                      )}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Detached Play Button */}
                    <div 
                      onClick={() => {
                        if (isPlaying && playingOnDecks.length > 0) {
                          playingOnDecks.forEach(id => togglePlayGlobal(id));
                        } else {
                          playTrack(track, leftActiveDeck);
                        }
                        playClick(1000, 'sine', 0.04);
                      }}
                      className={cn(
                        "absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-xl backdrop-blur-md transition-all duration-300 border-2",
                        isPlaying 
                          ? "bg-primary text-black border-primary/20 scale-110 shadow-[0_0_15px_rgba(216,22,63,0.5)]" 
                          : "bg-black/40 text-white border-white/10 hover:bg-white hover:text-black hover:scale-110"
                      )}
                    >
                      {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 px-1">
                    <h3 className="font-bold text-lg md:text-xl text-white uppercase tracking-wide truncate">{track.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
                        {track.isLocalFile ? "Local Wave / M4A" : "SoundCloud Stream"}
                      </span>
                      {playingOnDecks.length > 0 && (
                        <span className="text-primary font-bold animate-pulse text-[10px] tracking-widest">
                          LIVE [D{playingOnDecks.join(', ')}]
                        </span>
                      )}
                    </div>
                    {track.tracklist ? (
                      <div className="mt-3 border-t border-zinc-900 pt-3 max-h-36 overflow-y-auto custom-scrollbar flex flex-col gap-1 z-20 relative">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-1 select-none">
                          Tracklist (Click to Seek)
                        </span>
                        {parseTracklist(track.tracklist).map((item, idx) => (
                          <div key={idx} className="text-[10px] text-zinc-400 font-mono flex gap-2 items-center leading-normal">
                            {item.isTimestamp ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const playingDeckId = playingOnDecks[0] || leftActiveDeck;
                                  seekDeckToTime(playingDeckId, item.seconds);
                                }}
                                className="text-primary hover:text-red-400 cursor-pointer font-bold select-none hover:underline shrink-0"
                              >
                                {item.timestampText}
                              </button>
                            ) : null}
                            <span className="truncate select-text">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 mt-2 line-clamp-2">
                        {getTrackDescription(track.title, track.isLocalFile)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-12">
        <h2 className="text-2xl md:text-4xl font-sans font-bold text-primary tracking-widest uppercase glitch" data-text="01 / MIX ARCHIVE">01 / MIX ARCHIVE</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16 md:gap-24 px-4 pb-12 pt-8">
          {mixGroups.map((group: any) => (
            <VinylStack 
              key={group.title} 
              group={group} 
              onClick={() => { setExpandedFamily(group.title); playClick(900, 'sine', 0.02); }}
              playTick={playTick}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="vault" className={cn(
      "w-full flex-1 relative pt-2 pb-2 px-2 md:px-4 mx-auto flex flex-col justify-start md:justify-center @container",
      activeView === 'cdj' ? "overflow-hidden" : "overflow-y-auto"
    )}>
      {activeView === 'cdj' && (
        <AudioVisualizerBackground
          isDepth={isDepth}
          mouseX={mouseX}
          mouseY={mouseY}
          isPlaying={activeVisualizer.isPlaying}
          mode={visualizerMode}
        />
      )}

      <div 
        ref={archiveRef} 
        onMouseMove={handleMouseMove}
        className={cn(
          "relative w-full rounded-xl border border-dashed flex flex-col gap-2 p-2 md:p-2.5 h-full",
          activeView === 'cdj' ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
          isDepth ? "border-zinc-800 bg-zinc-950/40" : "border-black/20"
        )}
      >

        {/* Forced Landscape Overlay */}
        <AnimatePresence>
          {isMobile && isPortrait && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center mb-6 animate-pulse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-200 mb-2 font-mono uppercase tracking-widest">Rotate to Landscape</h2>
              <p className="text-sm text-zinc-500 font-mono">The CDJ layout requires a landscape orientation on mobile devices.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Hamburger Menu Toggle */}
        {isMobile && (
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="absolute top-4 left-4 z-40 p-2 bg-zinc-950/80 border border-zinc-900 rounded-md text-zinc-400 hover:text-white backdrop-blur shadow-xl"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}

        {/* Mobile Slide-out Menu */}
        <AnimatePresence>
          {isMobile && isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-900 z-50 p-4 flex flex-col gap-6 shadow-2xl"
              >
                <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
                  <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                    HENRY IX // CDJ
                  </span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {(['cdj', 'tracklist'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        if (setActiveView && activeView !== view) {
                          setActiveView(view);
                          playClick(800, 'sine', 0.02);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "p-3 rounded-md font-mono text-xs tracking-widest font-black uppercase transition-colors text-left relative overflow-hidden",
                        activeView === view ? "bg-primary text-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <span className="relative z-10">{view === 'cdj' ? 'DECK VIEW' : 'TRACKLIST VIEW'}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Persistent Retro-Futuristic Header with Toggle Button (Hidden on Mobile) */}
        {!isMobile && (
          <div className="w-full relative flex justify-center items-center z-30 font-mono select-none px-3 py-2 shrink-0 border-b border-zinc-900 bg-black/60 backdrop-blur rounded-lg mb-1">
            <div className="absolute left-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#D8163F]" />
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
                HENRY IX // CDJ PORTFOLIO
              </span>
            </div>
            <div className="relative flex p-1 bg-zinc-950/80 border border-zinc-900/80 rounded-lg backdrop-blur-md">
              {(['cdj', 'tracklist'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    if (setActiveView && activeView !== view) {
                      setActiveView(view);
                      playClick(800, 'sine', 0.02);
                    }
                  }}
                  className={cn(
                    "relative px-4 py-1.5 rounded-md font-mono text-[9px] md:text-[10px] tracking-widest font-black uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 w-32 md:w-36",
                    activeView === view ? "text-black" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {activeView === view && (
                    <motion.div
                      layoutId="view-toggle-highlight"
                      className="absolute inset-0 bg-primary rounded-md shadow-[0_0_10px_rgba(216,22,63,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{view === 'cdj' ? 'DECK VIEW' : 'TRACKLIST VIEW'}</span>
                </button>
              ))}
            </div>

            {/* Control Panel in Header */}
            <div className="absolute right-3 flex items-center gap-1.5 md:gap-2">
              {/* Decks selection */}
              {activeView === 'cdj' && (
                <>
                  <span className="text-[7px] md:text-[8px] text-zinc-500 font-bold uppercase tracking-wider select-none">
                    DECKS:
                  </span>
                  <div className="relative flex p-0.5 bg-zinc-950/80 border border-zinc-900 rounded-md backdrop-blur-md">
                    {([2, 4] as const).map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          setDeckCount(count);
                          playClick(800, 'sine', 0.02);
                        }}
                        className={cn(
                          "relative px-2 py-0.5 rounded font-mono text-[7.5px] md:text-[8px] font-black uppercase transition-colors cursor-pointer flex items-center justify-center w-6 md:w-8 h-5",
                          deckCount === count ? "text-zinc-950 font-black" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {deckCount === count && (
                          <motion.div
                            layoutId="deck-count-highlight"
                            className="absolute inset-0 bg-primary rounded shadow-[0_0_8px_rgba(216,22,63,0.3)]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                        <span className="relative z-10">{count}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}



              {/* Keyboard Shortcuts Trigger */}
              {activeView === 'cdj' && (
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => {
                      setIsShortcutsModalOpen(true);
                      playClick(900, 'sine', 0.02);
                    }}
                    className="px-2 py-1 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-[7.5px] md:text-[8px] font-bold"
                  >
                    <span>⌨️</span> KEYBOARD
                  </button>


                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'cdj' ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: `
              .dj-grid-container {
                display: grid;
                gap: 12px;
                width: 100%;
                height: 100%;
              }
              
              /* Mobile Mode (Screens < 1024px) */
              @media (max-width: 1023px) {
                .dj-grid-container {
                  gap: 4px;
                  grid-template-columns: ${isBrowserCollapsed ? '1fr 1.2fr 1fr' : '2fr 1.5fr 2fr'};
                  grid-template-rows: ${isBrowserCollapsed ? 'auto 1fr 2fr' : 'auto auto 1fr'};
                  grid-template-areas: ${isBrowserCollapsed ? `
                    "browserL mixer browserR"
                    "waveL     mixer waveR"
                    "controlL   mixer controlR"
                  ` : `
                    "browserL waveL  browserR"
                    "browserL waveR  browserR"
                    "controlL mixer  controlR"
                  `};
                }
              }

              /* Performance Mode (Screens 1024px - 1535px) */
              @media (min-width: 1024px) and (max-width: 1535px) {
                .dj-grid-container {
                  gap: 12px;
                  grid-template-columns: ${isBrowserCollapsed ? '1fr 1.2fr 1fr' : '2fr 1.8fr 2fr'};
                  grid-template-rows: ${isBrowserCollapsed ? 'auto 1.5fr 2.5fr' : 'auto auto 1fr'};
                  grid-template-areas: ${isBrowserCollapsed ? `
                    "browserL mixer browserR"
                    "waveL     mixer waveR"
                    "controlL   mixer controlR"
                  ` : `
                    "browserL waveL  browserR"
                    "browserL waveR  browserR"
                    "controlL mixer  controlR"
                  `};
                }
              }
              
              /* Standard Mode (Screens >= 1536px) */
              @media (min-width: 1536px) {
                .dj-grid-container {
                  ${deckCount === 2 ? `
                    grid-template-columns: ${isBrowserCollapsed ? '1.8fr minmax(280px, 1.2fr) 1.8fr' : 'minmax(0, 1.8fr) minmax(280px, 1.2fr) minmax(0, 1.8fr)'};
                    grid-template-rows: ${isBrowserCollapsed ? 'auto' : 'minmax(130px, 1.2fr)'} minmax(50px, auto) minmax(220px, 2fr);
                    grid-template-areas: 
                      "browser1 mixer browser2"
                      "wave1    mixer wave2"
                      "control1 mixer control2";
                  ` : `
                    grid-template-columns: ${isBrowserCollapsed ? '1fr 1fr minmax(280px, 1.2fr) 1fr 1fr' : 'minmax(0, 1fr) minmax(0, 1fr) minmax(280px, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)'};
                    grid-template-rows: ${isBrowserCollapsed ? 'auto' : 'minmax(130px, 1.2fr)'} minmax(50px, auto) minmax(220px, 2fr);
                    grid-template-areas: 
                      "browser3 browser1 mixer browser2 browser4"
                      "wave3    wave1    mixer wave2    wave4"
                      "control3 control1 mixer control2 control4";
                  `}
                }
              }
            `}} />

            <div className="dj-grid-container select-none flex-grow min-h-0 h-full overflow-y-auto 2xl:overflow-hidden p-1">
              
              {/* Browsers */}
              {activeDeckIds.map(id => {
                const isLeft = (id === 1 || id === 3);
                const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
                return (
                  <div 
                    key={`browser-container-${id}`}
                    style={{ gridArea: getBrowserArea(id) }} 
                    className={cn(
                      "browser-module min-h-0 h-full", 
                      (isActive || !isStacked) ? "block" : "hidden"
                    )}
                  >
                    {renderDeckBrowser(id)}
                  </div>
                );
              })}

              {/* Waveforms */}
              {activeDeckIds.map(id => {
                const isLeft = (id === 1 || id === 3);
                const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
                const deck = decks[id];
                const isLocked = deck?.id === 'locked';
                const themeColor = 
                  id === 1 ? 'rgba(211,15,49,1)' : // red
                  id === 2 ? 'rgba(34,211,238,1)' : // cyan
                  id === 3 ? 'rgba(16,185,129,1)' : // green
                  'rgba(234,179,8,1)'; // yellow
                  
                return (
                  <div 
                    key={`wave-container-${id}`}
                    style={{ gridArea: getWaveArea(id) }} 
                    className={cn(
                      "wave-module min-h-0 h-full flex flex-col justify-center", 
                      (isActive || !isStacked) ? "block" : "hidden"
                    )}
                  >
                    {isStacked ? renderStackedWaveform(id) : (
                      <div 
                        className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-2 md:p-2.5 flex flex-col gap-2 w-full shadow-md border-l-2 select-none" 
                        style={{ borderLeftColor: themeColor }}
                      >
                        {/* LCD State Log Info Header (combined) */}
                        <div className="w-full flex flex-col gap-1 font-mono text-[9px]">
                          {/* LCD Status Indicators */}
                          <div className="flex items-center justify-between text-zinc-500 text-[6.5px] tracking-widest border-b border-zinc-900 pb-1 uppercase font-black">
                            <span>DECK_{id} STATE LOG</span>
                            <span style={{ color: isLocked ? 'rgb(234,179,8)' : deck?.isPlaying ? themeColor : 'rgb(113,113,122)' }}>
                              {isLocked ? "ACCESS_LOCKED" : deck?.isPlaying ? "● PLAYING" : "■ PAUSED"}
                            </span>
                          </div>

                          {/* Track Name */}
                          <div className="flex flex-col mt-0.5">
                            <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-black mb-0.5 leading-none">TRACK NAME</span>
                            <span className="font-black truncate tracking-wider text-zinc-300 font-mono uppercase text-[9.5px] leading-none">
                              {isLocked ? "LOCKED DECK (PREVIEW ONLY)" : deck?.title || "NO TRACK LOADED"}
                            </span>
                          </div>

                          {/* Tempo, Playhead and Sync values */}
                          <div className="grid grid-cols-3 gap-2 mt-1 border-t border-zinc-900/50 pt-1 select-none">
                            <div className="flex flex-col">
                              <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold leading-none mb-0.5">SPEED</span>
                              <span className="font-bold text-zinc-400 text-[8.5px] leading-none">
                                {isLocked ? "130.00 BPM" : `${(deck?.bpm * (1 + (deck?.pitch || 0) / 100)).toFixed(2)} BPM`}
                              </span>
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold leading-none mb-0.5">PLAYHEAD</span>
                              <span className="font-bold text-zinc-400 font-mono text-[8.5px] leading-none">
                                {isLocked ? "LOCKED" : formatPlayheadTime(deck?.progress || 0)}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold leading-none mb-0.5">SYNC STATUS</span>
                              <span className={cn(
                                "font-black text-mono tracking-wide uppercase transition-colors duration-300 text-[8.5px] leading-none",
                                deck?.syncEnabled ? "text-emerald-400" : "text-zinc-600"
                              )}>
                                {deck?.syncEnabled ? "SYNCED" : "OFF"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Scrolling Waveform */}
                        <div className="w-full relative bg-black/40 rounded p-1 border border-zinc-900/50 flex flex-col justify-center items-center">
                          <div 
                            className="text-[6.5px] font-mono tracking-widest font-black uppercase self-start mb-0.5 px-0.5"
                            style={{ color: themeColor }}
                          >
                            WAVE DISPLAY
                          </div>
                          <SingleDeckWaveform 
                            deckId={id} 
                            deck={deck} 
                            isDepth={isDepth} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Controls / Jogwheels */}
              {activeDeckIds.map(id => {
                const isLeft = (id === 1 || id === 3);
                const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
                return (
                  <div 
                    key={`control-container-${id}`}
                    style={{ gridArea: getControlArea(id) }} 
                    className={cn(
                      "control-module min-h-0 h-full", 
                      (isActive || !isStacked) ? "block" : "hidden"
                    )}
                  >
                    {renderDeckControls(id)}
                  </div>
                );
              })}

              {/* Central Mixer Panel */}
              <div 
                style={{ gridArea: 'mixer' }} 
                className="mixer-module block h-full min-h-0"
              >
                {renderMixer()}
              </div>

            </div>
          </>
        ) : (
          renderTracklist()
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {isShortcutsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShortcutsModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg border border-zinc-900 bg-zinc-950/95 rounded-2xl p-6 shadow-2xl font-mono text-zinc-300 z-10 select-none"
            >
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-primary text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase border-b border-zinc-900 pb-3 mb-5 flex items-center gap-2">
                <span>⌨️</span> KEYBOARD SHORTCUTS INTERFACE
              </h3>

              <div className="grid grid-cols-2 gap-6 text-[10px] tracking-wide mb-4">
                <div className="flex flex-col gap-4 border-r border-zinc-900/60 pr-4">
                  <span className="text-zinc-500 font-bold tracking-widest text-[8px] uppercase">Left Active Deck</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Play / Pause</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-primary font-bold">Space / A</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Cue Stutter</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-primary font-bold">Q (Hold)</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Hot Cues A-D</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-primary font-bold">1 - 4</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Pitch Bend - / +</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-primary font-bold">Z / X</kbd></div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pl-2">
                  <span className="text-zinc-500 font-bold tracking-widest text-[8px] uppercase">Right Active Deck</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Play / Pause</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold">Enter / S</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Cue Stutter</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold">E (Hold)</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Hot Cues A-D</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold">7 - 0</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-400">Pitch Bend - / +</span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold">N / M</kbd></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-900 pt-4 text-center text-[7px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                SHORTCUTS ARE SCALED AND ENABLED GLOBALLY. CLICK OR DRAG DECKS TO MIX SIMULTANEOUSLY.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skeuomorphic Virtual USB Drag-and-Drop Overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center font-mono p-6"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingFile(false);
              
              const files = e.dataTransfer?.files;
              if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac)$/i.test(file.name)) {
                  const leftId = useAudioStore.getState().leftActiveDeck;
                  if (loadLocalFile) loadLocalFile(leftId, file);
                } else {
                  playLockoutBlip && playLockoutBlip();
                }
              }
            }}
          >
            {/* USB Enclosure Card */}
            <div className="w-full max-w-xl bg-zinc-950 border-2 border-dashed border-zinc-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden">
              
              {/* Spinning Pioneer Record visual indicator */}
              <div className="w-20 h-20 rounded-full border-2 border-zinc-800 flex items-center justify-center relative animate-[spin_6s_linear_infinite]">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-center">
                <span className="text-primary font-black text-lg md:text-xl tracking-[0.25em] uppercase animate-pulse">
                  INSERT VIRTUAL USB
                </span>
                <span className="text-zinc-500 text-[10px] tracking-widest uppercase">
                  DROP AUDIO FILE (.mp3, .wav, .m4a) ONTO A DECK DROPZONE
                </span>
              </div>

              {/* Target Dropzones Grid */}
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                {[
                  { label: 'LOAD TO DECK LEFT', id: leftActiveDeck, name: 'LEFT' },
                  { label: 'LOAD TO DECK RIGHT', id: rightActiveDeck, name: 'RIGHT' }
                ].map(target => (
                  <div
                    key={target.name}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragTargetDeck(target.id);
                    }}
                    onDragLeave={() => setDragTargetDeck(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingFile(false);
                      setDragTargetDeck(null);
                      
                      const files = e.dataTransfer?.files;
                      if (files && files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac)$/i.test(file.name)) {
                          if (loadLocalFile) loadLocalFile(target.id, file);
                        } else {
                          playLockoutBlip && playLockoutBlip();
                        }
                      }
                    }}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer h-36 text-center select-none",
                      dragTargetDeck === target.id
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(216,22,63,0.25)] scale-[1.02]"
                        : "bg-black/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    <span className="text-[9px] font-black tracking-widest uppercase">
                      {target.label}
                    </span>
                    <span className="text-[12px] font-bold text-white uppercase truncate max-w-[150px]">
                      {target.name === 'LEFT' ? `DECK ${leftActiveDeck}` : `DECK ${rightActiveDeck}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bezel footer details */}
              <span className="text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest border-t border-zinc-900/60 w-full pt-4 text-center mt-2 leading-none">
                PIONEER VIRTUAL LINK // FILE_LOADER_PORT
              </span>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
