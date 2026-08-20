'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Search, Lock, Upload } from 'lucide-react';
import { useAudioStore } from '@/store/audioStore';
import { cn } from '@/lib/utils';
import { RotaryKnob } from '@/components/DJComponents';
import { audioEngine } from '@/lib/AudioEngine';
import { midiEngine } from '@/lib/midiEngine';
import { MIDILearnModal } from './MIDILearnModal';
import { useUsbLibrary } from '@/lib/useUsbLibrary';
import { setRecorder, RecordingState } from '@/lib/audioRecorder';
import { playClick, playTick, playLockoutBlip, playNeedleDrop } from '@/lib/audioUtils';
import { 
  formatTime, 
  formatPlayheadTime, 
  getSessionImage, 
  getTrackDescription, 
  parseTracklist 
} from '@/lib/mixes';
import { VolumeFader } from './VolumeFader';
import { ChannelVUMeter } from './ChannelVUMeter';
import { Crossfader } from './Crossfader';
import { VinylStack } from './VinylStack';
import { SingleDeckWaveform } from './SingleDeckWaveform';
import { DeckToolbar } from './DeckToolbar';
import { DeckBrowserPanel } from './DeckBrowserPanel';
import { DeckBadge } from './DeckBadge';
import { UsbDropzoneOverlay } from './UsbDropzoneOverlay';
import { HardwareControllerView } from './HardwareControllerView';
import { calculateSyncCorrection } from '@/lib/proBeatgridEngine';
import dynamic from 'next/dynamic';

const MobileDJDecks = dynamic(() => import('./MobileDJDecks').then(mod => mod.MobileDJDecks), { ssr: false });
const CDJHardware = dynamic(() => import('./CDJHardware'), { ssr: false });
const AudioVisualizerBackground = dynamic(() => import('./AudioVisualizerBackground'), { ssr: false });
const StageVisualizerModal = dynamic(() => import('./StageVisualizerModal').then(m => m.StageVisualizerModal), { ssr: false });
const SetRecordingModal = dynamic(() => import('./SetRecordingModal').then(m => m.SetRecordingModal), { ssr: false });
const TrackIdLiveHUD = dynamic(() => import('./TrackIdLiveHUD').then(m => m.TrackIdLiveHUD), { ssr: false });
const RhythmAccentPads = dynamic(() => import('./RhythmAccentPads').then(m => m.RhythmAccentPads), { ssr: false });

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
  const setDeck = useAudioStore(s => s.setDeck);
  const setDecks = useAudioStore(s => s.setDecks);
  const crossfader = useAudioStore(s => s.crossfader);
  const setCrossfader = useAudioStore(s => s.setCrossfader);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const setLeftActiveDeck = useAudioStore(s => s.setLeftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);
  const setRightActiveDeck = useAudioStore(s => s.setRightActiveDeck);
  const detectedBpms = useAudioStore(s => s.detectedBpms || {});
  const setIsCDJView = useAudioStore(s => s.setIsCDJView);
  const eqMode = useAudioStore(s => s.eqMode);
  const setEqMode = useAudioStore(s => s.setEqMode);
  const crossfaderCurve = useAudioStore(s => s.crossfaderCurve);
  const setCrossfaderCurve = useAudioStore(s => s.setCrossfaderCurve);
  const isSplitCue = useAudioStore(s => s.isSplitCue);
  const setIsSplitCue = useAudioStore(s => s.setIsSplitCue);

  // Map local references and bindings directly to global audioEngine singleton
  const playTrack = audioEngine.playTrack.bind(audioEngine);
  const togglePlayGlobal = audioEngine.togglePlayGlobal.bind(audioEngine);
  const initAudioDSP = audioEngine.initAudioDSP.bind(audioEngine);
  const loadLocalFile = audioEngine.loadLocalFile.bind(audioEngine);
  const seekLocalBuffer = audioEngine.seekLocalBuffer.bind(audioEngine);
  const alignSyncPlayback = audioEngine.alignSyncPlayback.bind(audioEngine);
  const getQuantizedDelay = audioEngine.getQuantizedDelay.bind(audioEngine);

  const audioElementsRef = useRef(audioEngine.audioElements);
  const widgetRefs = useRef(audioEngine.widgetRefs);

  useEffect(() => {
    audioElementsRef.current = audioEngine.audioElements;
    widgetRefs.current = audioEngine.widgetRefs;
  });

  const decksRef = useRef(decks);
  useEffect(() => { decksRef.current = decks; }, [decks]);

  const archiveRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [deckCount, setDeckCount] = useState<2 | 4>(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTracklistDeckId, setActiveTracklistDeckId] = useState<number | null>(null);

  const [isMIDIOpen, setIsMIDIOpen] = useState(false);
  const [midiDeviceName, setMIDIDeviceName] = useState<string>('');
  const [isGlitching, setIsGlitching] = useState(false);

  const [masterBrowserFolder, setMasterBrowserFolder] = useState<string>('all');
  const [isMasterCrateExpanded, setIsMasterCrateExpanded] = useState<boolean>(false);
  const [isCrateCollapsed, setIsCrateCollapsed] = useState<boolean>(true);

  const [isStageVisualizerOpen, setIsStageVisualizerOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const { connectUsbDrive, usbTracks, usbFolderName, isLoading: isUsbLoading } = useUsbLibrary();
  const [recordingState, setRecordingState] = useState<RecordingState>(setRecorder.getState());

  const effectiveMixGroups = useMemo(() => {
    if (!usbTracks || usbTracks.length === 0) return mixGroups;
    const usbGroup = {
      title: `📁 USB: ${usbFolderName || 'LOCAL MUSIC'}`,
      mixes: usbTracks,
    };
    return [...mixGroups, usbGroup];
  }, [mixGroups, usbTracks, usbFolderName]);

  useEffect(() => {
    return setRecorder.subscribe(setRecordingState);
  }, []);

  const handleDeckCountChange = (count: 2 | 4) => {
    if (deckCount === count) return;
    setIsGlitching(true);
    setDeckCount(count);
    playClick(800, 'sine', 0.02);
    setTimeout(() => setIsGlitching(false), 280);
  };

  useEffect(() => {
    midiEngine.init();
    const unsub = midiEngine.subscribeDevices((devs) => {
      if (devs.length > 0) {
        setMIDIDeviceName(devs[0].name);
      } else {
        setMIDIDeviceName('');
      }
    });
    return () => unsub();
  }, []);
  const activeDeckIds = (deckCount === 2 ? [1, 2] : [3, 1, 2, 4]) as readonly (1 | 2 | 3 | 4)[];

  const isStacked = useAudioStore(s => s.isStacked);
  const setStacked = useAudioStore(s => s.setStacked);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setDeckCount(2);
        setStacked(true);
      }
      
      setIsPortrait(window.innerHeight > window.innerWidth);
      setIsCDJView(activeView === 'cdj' && mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      setIsCDJView(false);
    };
  }, [activeView, setStacked, setIsCDJView]);

  const getDeckArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'deckL' : 'deckR';
    }
    return `deck${id}`;
  };

  const setIsEcoMode = useAudioStore(s => s.setIsEcoMode);

  // --- Automatic Device Frame Pacing & Performance Monitor ---
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const monitorFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 2000) {
        const fps = (frameCount * 1000) / (now - lastTime);
        if (fps < 45) {
          setIsEcoMode(true);
        } else if (fps > 55) {
          setIsEcoMode(false);
        }
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(monitorFps);
    };

    animId = requestAnimationFrame(monitorFps);
    return () => cancelAnimationFrame(animId);
  }, [setIsEcoMode]);

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
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
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
  }, [decks, initAudioDSP, widgetRefs, seekLocalBuffer, setDecks, getQuantizedDelay]);

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

        // 1.5 Continuous Phase-Locked Loop (PLL) and Pitch Tracking for Perfect Phase/BPM Alignment
        if (!deck.scMode && audio) {
          let basePlaybackRate = 1 + (deck.pitch || 0) / 100;
          let pllApplied = false;

          if (deck.syncEnabled && !audio.paused && deck.syncMode !== 'BPM') {
            // 1. Prefer explicit MASTER deck first, fallback to first other playing deck
            let masterId = [1, 2, 3, 4].find(
              id => id !== deckId && decksRef.current[id]?.isPlaying && decksRef.current[id]?.isMaster && !decksRef.current[id]?.scMode
            );
            if (!masterId) {
              masterId = [1, 2, 3, 4].find(
                id => id !== deckId && decksRef.current[id]?.isPlaying && !decksRef.current[id]?.scMode
              );
            }

            if (masterId) {
              const masterDeck = decksRef.current[masterId];
              const masterAudio = audioElementsRef?.current?.[masterId];
              if (masterDeck && masterAudio && !masterAudio.paused) {
                const correction = calculateSyncCorrection(
                  masterAudio.currentTime,
                  masterDeck.bpm || 120,
                  masterDeck.pitch || 0,
                  masterDeck.firstBeatOffset || 0,
                  audio.currentTime,
                  deck.bpm || 120,
                  deck.firstBeatOffset || 0
                );

                // 2. Dynamic Pitch Tracking: Automatically update pitch to match master tempo
                if (Math.abs((deck.pitch || 0) - correction.targetPitch) > 0.01) {
                  useAudioStore.getState().setDeck(deckId, { pitch: correction.targetPitch });
                  basePlaybackRate = 1 + correction.targetPitch / 100;
                }

                // 3. Phase Synchronization
                if ((deck.syncMode as string) !== 'BPM') {
                  if (correction.needsHardSnap) {
                    const targetTime = audio.currentTime + correction.timeErrorSeconds;
                    const duration = audio.duration || deck.duration || 0;
                    if (isFinite(duration) && targetTime >= 0 && targetTime <= duration) {
                      audio.currentTime = targetTime;
                    }
                  } else if (correction.pllNudge !== 0) {
                    audio.playbackRate = basePlaybackRate + correction.pllNudge;
                    pllApplied = true;
                  }
                }
              }
            }
          }

          if (!pllApplied && audio.playbackRate !== basePlaybackRate) {
            audio.playbackRate = basePlaybackRate;
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
  const modalStatesRef = useRef({
    isShortcutsModalOpen,
    isMasterCrateExpanded,
    isStageVisualizerOpen,
    isRecordModalOpen,
    isMIDIOpen,
  });
  useEffect(() => {
    modalStatesRef.current = {
      isShortcutsModalOpen,
      isMasterCrateExpanded,
      isStageVisualizerOpen,
      isRecordModalOpen,
      isMIDIOpen,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        isShortcutsModalOpen: shortcutsOpen,
        isMasterCrateExpanded: crateExpanded,
        isStageVisualizerOpen: stageFxOpen,
        isMIDIOpen: midiOpen,
      } = modalStatesRef.current;

      if (shortcutsOpen || crateExpanded || stageFxOpen || midiOpen) {
        return;
      }

      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsCrateCollapsed(prev => !prev);
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setIsStageVisualizerOpen(prev => !prev);
        return;
      }

      // Read state dynamically from Zustand
      const state = useAudioStore.getState();
      const currentCrossfader = state.crossfader;

      const triggerSync = (deckId: number, targetDeckId: number) => {
        const d1 = decksRef.current[deckId];
        const d2 = decksRef.current[targetDeckId];
        if (d1 && d2 && d1.id !== 'locked') {
          playClick(800, 'sine', 0.02);
          const isBothPlaying = d1.isPlaying && d2.isPlaying;
          const nextSyncState = isBothPlaying ? true : !d1.syncEnabled;
          setDecks((prev: any) => ({
            ...prev,
            [deckId]: { ...prev[deckId], syncEnabled: nextSyncState }
          }));
          if (isBothPlaying && alignSyncPlaybackRef.current) {
            alignSyncPlaybackRef.current(deckId);
          }
        }
      };

      // DECK 1 (Primary Left)
      if (e.code === 'Space') {
        e.preventDefault();
        const togglePlayGlobal = togglePlayGlobalRef.current;
        if (togglePlayGlobal) togglePlayGlobal(1);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(1, 0.0, 0);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        triggerSync(1, 2);
      } else if (e.key === '1') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(1, 0.0, 0);
      } else if (e.key === '2') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(1, 0.25, 1);
      } else if (e.key === '3') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(1, 0.5, 2);
      } else if (e.key === '4') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(1, 0.75, 3);
      }

      // DECK 2 (Primary Right)
      else if (e.key === 'Enter') {
        e.preventDefault();
        const togglePlayGlobal = togglePlayGlobalRef.current;
        if (togglePlayGlobal) togglePlayGlobal(2);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(2, 0.0, 0);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        triggerSync(2, 1);
      } else if (e.key === '7') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(2, 0.0, 0);
      } else if (e.key === '8') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(2, 0.25, 1);
      } else if (e.key === '9') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(2, 0.5, 2);
      } else if (e.key === '0') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(2, 0.75, 3);
      }

      // DECK 3 (Secondary Left)
      else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        const togglePlayGlobal = togglePlayGlobalRef.current;
        if (togglePlayGlobal) togglePlayGlobal(3);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(3, 0.0, 0);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerSync(3, 1);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(3, 0.0, 0);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(3, 0.25, 1);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(3, 0.5, 2);
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(3, 0.75, 3);
      }

      // DECK 4 (Secondary Right)
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        const togglePlayGlobal = togglePlayGlobalRef.current;
        if (togglePlayGlobal) togglePlayGlobal(4);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(4, 0.0, 0);
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        triggerSync(4, 2);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(4, 0.0, 0);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(4, 0.25, 1);
      } else if (e.key === '[') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(4, 0.5, 2);
      } else if (e.key === ']') {
        e.preventDefault();
        const triggerHotCue = triggerHotCueRef.current;
        if (triggerHotCue) triggerHotCue(4, 0.75, 3);
      }

      // Mixer Arrow crossfader controls
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCrossfader(Math.max(0, currentCrossfader - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCrossfader(Math.min(100, currentCrossfader + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCrossfader, setDecks]);

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

function StackedWaveformDeckItem({
  deckId,
  deck,
  isMobile,
  themeColor,
  formatTime,
  isDepth,
  playTrack,
  playLockoutBlip
}: {
  deckId: 1 | 2 | 3 | 4;
  deck: any;
  isMobile: boolean;
  themeColor: string;
  formatTime: (t: number) => string;
  isDepth: boolean;
  playTrack: (mix: any, dId: number) => void;
  playLockoutBlip: () => void;
}) {
  const playLockEnabled = useAudioStore(s => s.playLockEnabled);
  const [isHovering, setIsHovering] = useState(false);
  const isPlaying = deck?.isPlaying;
  const isLockedForDrop = isPlaying && playLockEnabled;
  const isLocked = deck?.id === 'locked';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = isLockedForDrop ? 'none' : 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsHovering(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);

    if (isLockedForDrop) {
      playLockoutBlip();
      return;
    }

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const mix = JSON.parse(raw);
        if (mix && mix.id) {
          playTrack(mix, deckId);
        }
      }
    } catch (err) {
      console.error(`[STACKED DECK ${deckId} DROP ERROR]`, err);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "w-full flex items-stretch bg-black border border-zinc-900 rounded-none overflow-hidden h-full relative transition-all",
        isMobile ? "h-[50px] min-h-[50px] shrink-0" : "min-h-[60px] h-[80px]",
        isHovering && (isLockedForDrop ? "border-red-600 ring-1 ring-red-600" : "border-emerald-500 ring-1 ring-emerald-500")
      )}
      style={{ borderLeft: `3px solid ${themeColor}` }}
    >
      {isHovering && (
        <div className={cn(
          "absolute inset-0 z-50 backdrop-blur-sm flex items-center justify-center gap-2 px-3 py-1 font-mono text-[9px] font-bold border-2 border-dashed uppercase select-none transition-all",
          isLockedForDrop ? "bg-black/95 text-red-500 border-red-600 animate-pulse" : "bg-black/95 text-white border-emerald-500 shadow-neon-glow"
        )}>
          {isLockedForDrop ? (
            <>
              <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">🔒 PLAY LOCK ACTIVE: DECK {deckId} IS PLAYING</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
              <span className="truncate">📥 DROP TO LOAD DECK {deckId}</span>
            </>
          )}
        </div>
      )}

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

      {/* Right Info Panel with 4-Beat Phase Meter */}
      <div className="w-[68px] border-l border-zinc-900 bg-black/40 flex flex-col justify-center items-center p-1.5 shrink-0 select-none text-center">
        <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-black leading-none mb-0.5">BPM</span>
        <span className="font-black text-zinc-400 font-mono text-[9px] tracking-wide">
          {isLocked ? "130.00" : (deck.bpm * (1 + (deck.pitch || 0) / 100)).toFixed(1)}
        </span>
        
        {/* 4-Beat Bar Phase Blocks */}
        <div className="flex items-center gap-0.5 mt-1" title="4-Beat Phase Meter">
          {[0, 1, 2, 3].map((b) => {
            const activeBpm = deck.bpm * (1 + (deck.pitch || 0) / 100);
            const beatSec = 60 / (activeBpm || 120);
            const beatInBar = isLocked ? 0 : Math.floor((((deck.progress || 0) - (deck.firstBeatOffset || 0)) / beatSec) % 4 + 4) % 4;
            const isActive = isPlaying && beatInBar === b;
            return (
              <div
                key={b}
                className={cn(
                  "w-1.5 h-1.5 border transition-all duration-75",
                  isActive
                    ? "border-transparent shadow-[0_0_5px_currentColor]"
                    : "border-zinc-800 bg-zinc-950"
                )}
                style={{
                  backgroundColor: isActive ? themeColor : undefined,
                  color: themeColor
                }}
              />
            );
          })}
        </div>

        <span className={cn(
          "text-[6px] font-bold mt-0.5 px-0.5 rounded",
          isPlaying ? "bg-primary/10 text-primary animate-pulse" : "text-zinc-600"
        )} style={{ color: isPlaying ? themeColor : undefined }}>
          {isPlaying ? "ACTIVE" : "STANDBY"}
        </span>
      </div>
    </div>
  );
}

  const renderStackedWaveform = (deckId: 1 | 2 | 3 | 4) => {
    const deck = decks[deckId];
    const themeColor = 
      deckId === 1 ? 'rgba(211,15,49,1)' : // red
      deckId === 2 ? 'rgba(34,211,238,1)' : // cyan
      deckId === 3 ? 'rgba(16,185,129,1)' : // green
      'rgba(234,179,8,1)'; // yellow

    return (
      <StackedWaveformDeckItem
        deckId={deckId}
        deck={deck}
        isMobile={isMobile}
        themeColor={themeColor}
        formatTime={formatTime}
        isDepth={isDepth}
        playTrack={playTrack}
        playLockoutBlip={playLockoutBlip}
      />
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
      <div className="rounded-none p-2.5 px-3 flex flex-col justify-between bg-black border border-zinc-900 min-h-[180px] h-full flex-grow relative transition-all duration-300 z-10 w-full">
        {/* Top Mixer Mode Switchers: EQ Curve & Headphone Split Cue */}
        <div className="flex items-center justify-between w-full border-b border-zinc-900/80 pb-1 text-[7px] font-mono select-none">
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 font-bold uppercase">EQ:</span>
            <button
              onClick={() => {
                playClick(850, 'sine', 0.015);
                setEqMode(eqMode === 'ISOLATOR' ? 'CLASSIC' : 'ISOLATOR');
              }}
              className={cn(
                "px-1.5 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer",
                eqMode === 'ISOLATOR' ? "bg-primary/20 border-primary/40 text-primary" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
              title="Toggle EQ Curve: ISOLATOR (-∞dB Kill) vs CLASSIC (-26dB Shelf)"
            >
              {eqMode}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-zinc-500 font-bold uppercase">CUE:</span>
            <button
              onClick={() => {
                playClick(850, 'sine', 0.015);
                setIsSplitCue(!isSplitCue);
              }}
              className={cn(
                "px-1.5 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer",
                isSplitCue ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
              title="Split Cue Monitoring (Master Left, Cue Right)"
            >
              {isSplitCue ? 'SPLIT ON' : 'STEREO'}
            </button>
          </div>
        </div>

        {/* Mixer Channels Grid */}
        <div className={cn(
          "grid gap-1.5 md:gap-2.5 my-2 items-stretch justify-center z-10 flex-grow min-h-0 select-none",
          deckCount === 2 ? "grid-cols-2" : "grid-cols-4"
        )}>
          {(deckCount === 2 ? [1, 2] : [3, 1, 2, 4]).map(id => {
            const deck = decks[id];
            const isLocked = deck?.id === 'locked';
            const isLeft = (id === 1 || id === 3);
            const isActive = isStacked ? (isLeft ? leftActiveDeck === id : rightActiveDeck === id) : true;
            
            const channelColor = 
              id === 1 ? 'rgba(211,15,49,1)' : // red
              id === 2 ? 'rgba(34,211,238,1)' : // cyan
              id === 3 ? 'rgba(16,185,129,1)' : // green
              'rgba(234,179,8,1)'; // yellow

            return (
              <div 
                key={id}
                style={{ containerType: 'inline-size' }}
                onClick={() => {
                  if (isStacked) {
                    if (isLeft && leftActiveDeck !== id) {
                      setLeftActiveDeck(id as 1 | 3);
                    } else if (!isLeft && rightActiveDeck !== id) {
                      setRightActiveDeck(id as 2 | 4);
                    }
                  }
                }}
                className={cn(
                  "w-full flex flex-col items-center justify-between gap-2 py-2 px-1 rounded-none transition-all border bg-black h-full min-h-0",
                  isStacked && !isActive
                    ? "border-zinc-900 opacity-60 hover:opacity-100 hover:border-zinc-700 cursor-pointer"
                    : "border-zinc-800/80 opacity-100 hover:border-zinc-700"
                )}
              >
                <span 
                  className="font-mono text-[7.5px] font-black tracking-widest uppercase leading-none"
                  style={{ color: channelColor }}
                >
                  CH {id}
                </span>

                <div className="flex flex-col gap-1.5 w-full items-center">
                  {/* Dedicated LED VU Volume Meter for this deck, positioned above TRIM */}
                  <ChannelVUMeter 
                    deckId={id}
                    trim={deck.trim ?? 50}
                    volume={deck.volume}
                    isPlaying={deck.isPlaying}
                  />

                  {!isMobile && (
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
                  )}
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
                  {!isMobile && (
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
                  )}
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
                    isPlaying={deck.isPlaying}
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
          <div className="flex justify-between items-center w-full text-[6px] text-zinc-500 font-mono tracking-wider px-1 uppercase font-bold">
            <span>1/3 L</span>
            <button
              onClick={() => {
                playClick(900, 'sine', 0.02);
                setCrossfaderCurve(crossfaderCurve === 'SMOOTH' ? 'FAST_CUT' : 'SMOOTH');
              }}
              className={cn(
                "px-1 py-0.2 border text-[6px] font-black uppercase transition-colors cursor-pointer",
                crossfaderCurve === 'FAST_CUT' ? "bg-primary/20 border-primary/40 text-primary" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
              )}
              title="Crossfader Curve: SMOOTH (Equal-Power) vs FAST CUT (Scratch)"
            >
              CURVE: {crossfaderCurve === 'FAST_CUT' ? 'CUT' : 'SMOOTH'}
            </button>
            <span>2/4 R</span>
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
    const query = librarySearchQuery.trim().toLowerCase();

    if (expandedFamily) {
      const group = mixGroups.find(g => g.title === expandedFamily);
      if (!group) {
        setExpandedFamily(null);
        return null;
      }

      const filteredTracks = group.mixes.filter((track: any) => {
        if (!query) return true;
        return (
          track.title?.toLowerCase().includes(query) ||
          track.tracklist?.toLowerCase().includes(query)
        );
      });
      
      return (
        <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setExpandedFamily(null); playClick(900, 'sine', 0.02); }}
                onMouseEnter={() => playTick()}
                className="px-4 py-2 bg-black hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] uppercase tracking-widest font-black rounded-none border border-zinc-900 transition-colors flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span className="text-primary">&lt;</span> BACK TO ARCHIVE
              </button>
              <h2 className="text-xl md:text-3xl font-avathe font-bold text-primary tracking-widest uppercase glitch" data-text={group.title}>{group.title}</h2>
            </div>

            {/* Real-time Search Input inside Expanded View */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input 
                type="text"
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                placeholder="SEARCH TRACKS IN SERIES..."
                className="w-full pl-9 pr-8 py-1.5 bg-black border border-zinc-900 rounded-none text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
              {librarySearchQuery && (
                <button 
                  onClick={() => setLibrarySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {filteredTracks.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-mono text-xs">
              NO TRACKS FOUND MATCHING &quot;{librarySearchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredTracks.map((track: any) => {
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
                      "group flex flex-col gap-4 p-4 rounded-none border bg-black hover:bg-zinc-950 transition-all duration-300 relative",
                      playingOnDecks.length > 0 ? "border-primary/40 shadow-[0_0_20px_rgba(216,22,63,0.1)]" : "border-zinc-900"
                    )}
                  >
                    <div className="relative w-full aspect-square rounded-none overflow-hidden border border-zinc-900 shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={getSessionImage(track.title, track.artworkUrl)} 
                        alt={track.title}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
                          playingOnDecks.length > 0 && "animate-[pulse_4s_ease-in-out_infinite]"
                        )}
                      />
                      
                      {/* Detached Play Button */}
                      <div 
                        onClick={() => {
                          if (isPlaying && playingOnDecks.length > 0) {
                            playingOnDecks.forEach(id => togglePlayGlobal(id));
                          } else {
                            playTrack(track, leftActiveDeck, true);
                          }
                          playClick(1000, 'sine', 0.04);
                        }}
                        className={cn(
                          "absolute bottom-4 right-4 w-14 h-14 rounded-none flex items-center justify-center cursor-pointer shadow-xl transition-all duration-300 border-2 z-20",
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

                      {/* 1-Click Explicit Deck Load Target Buttons (D1 - D4) */}
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-900/80">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider select-none">LOAD TO:</span>
                        {([1, 2, 3, 4] as const).map(targetDeckId => {
                          const isDeckPlaying = decks[targetDeckId]?.title === track.title && decks[targetDeckId]?.isPlaying;
                          const targetColor = 
                            targetDeckId === 1 ? 'border-red-500/50 text-red-400 hover:bg-red-950/60' :
                            targetDeckId === 2 ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/60' :
                            targetDeckId === 3 ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/60' :
                            'border-yellow-500/50 text-yellow-400 hover:bg-yellow-950/60';

                          return (
                            <button
                              key={targetDeckId}
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(track, targetDeckId);
                                playClick(900, 'sine', 0.03);
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded border text-[8px] font-mono font-black uppercase transition-all cursor-pointer",
                                isDeckPlaying ? "bg-primary text-black border-primary font-black shadow-[0_0_8px_rgba(216,22,63,0.4)]" : cn("bg-zinc-950/80", targetColor)
                              )}
                            >
                              D{targetDeckId}
                            </button>
                          );
                        })}
                      </div>

                      {track.tracklist ? (
                        <div className="mt-3 border-t border-zinc-900 pt-3 max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1 z-20 relative">
                          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-1 select-none">
                            <span>Track Chapters</span>
                            <span className="text-[7px] text-zinc-600">Click to Needle-Drop</span>
                          </div>
                          {(() => {
                            const parsedItems = parseTracklist(track.tracklist);
                            const primaryDeckId = playingOnDecks.length > 0 ? playingOnDecks[0] : leftActiveDeck;
                            const isThisLoaded = playingOnDecks.length > 0;
                            const currentDeckProg = decks[primaryDeckId]?.progress || 0;

                            return parsedItems.map((item, idx) => {
                              const nextItem = parsedItems[idx + 1];
                              const isItemActive = isThisLoaded && item.isTimestamp && currentDeckProg >= item.seconds && (!nextItem || (nextItem.isTimestamp && currentDeckProg < nextItem.seconds));

                              return (
                                <div 
                                  key={idx} 
                                  onClick={(e) => {
                                    if (item.isTimestamp) {
                                      e.stopPropagation();
                                      playNeedleDrop();
                                      if (isThisLoaded) {
                                        seekLocalBuffer(primaryDeckId, item.seconds);
                                        if (!decks[primaryDeckId]?.isPlaying) {
                                          togglePlayGlobal(primaryDeckId);
                                        }
                                      } else {
                                        playTrack(track, leftActiveDeck);
                                        setTimeout(() => {
                                          seekLocalBuffer(leftActiveDeck, item.seconds);
                                        }, 150);
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "text-[10px] font-mono flex gap-2 items-center leading-normal px-1.5 py-0.5 rounded transition-colors cursor-pointer group",
                                    isItemActive ? "bg-primary/20 text-white border-l-2 border-primary" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                                  )}
                                >
                                  {item.isTimestamp ? (
                                    <span className={cn(
                                      "font-bold select-none shrink-0 font-mono text-[9px]",
                                      isItemActive ? "text-primary font-black animate-pulse" : "text-primary/70 group-hover:text-primary"
                                    )}>
                                      {isItemActive ? `▶ ${item.timestampText}` : item.timestampText}
                                    </span>
                                  ) : null}
                                  <span className="truncate select-text">{item.text}</span>
                                </div>
                              );
                            });
                          })()}
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
          )}
        </div>
      );
    }

    const filteredGroups = mixGroups.filter((group: any) => {
      if (!query) return true;
      if (group.title?.toLowerCase().includes(query)) return true;
      return group.mixes?.some((mix: any) => mix.title?.toLowerCase().includes(query));
    });

    return (
      <div className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <h2 className="text-2xl md:text-4xl font-avathe font-bold text-primary tracking-widest uppercase glitch" data-text="01 / MIX ARCHIVE">01 / MIX ARCHIVE</h2>
          
          {/* Real-time Global Library Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input 
              type="text"
              value={librarySearchQuery}
              onChange={(e) => setLibrarySearchQuery(e.target.value)}
              placeholder="SEARCH LIBRARY MIXES..."
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {librarySearchQuery && (
              <button 
                onClick={() => setLibrarySearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 font-mono text-xs">
            NO MIX SERIES FOUND MATCHING &quot;{librarySearchQuery}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16 md:gap-24 px-4 pb-12 pt-8">
            {filteredGroups.map((group: any) => (
              <VinylStack 
                key={group.title} 
                group={group} 
                onClick={() => { setExpandedFamily(group.title); playClick(900, 'sine', 0.02); }}
                playTick={playTick}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMobileCDJ = () => {
    return (
      <MobileDJDecks
        isDepth={isDepth}
        onOpenTracklist={(deckId) => setActiveTracklistDeckId(deckId)}
        onOpenMIDI={() => setIsMIDIOpen(true)}
        onConnectUsb={() => connectUsbDrive()}
        mixGroups={mixGroups}
        onTrackSelect={(mix, dId) => playTrack(mix, dId)}
        onLoadLocalFile={(file, dId) => loadLocalFile && loadLocalFile(dId || 1, file)}
        usbTracks={usbTracks}
      />
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
          "relative w-full rounded-none border flex flex-col gap-2 p-2 md:p-2.5 h-full bg-black border-zinc-900",
          activeView === 'cdj' ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
        )}
      >

        {/* Forced Landscape Overlay */}
        <AnimatePresence>
          {isMobile && isPortrait && activeView === 'cdj' && (
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
        {isMobile && activeView === 'tracklist' && (
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="absolute top-4 left-4 z-40 p-2 bg-zinc-950/80 border border-zinc-900 rounded-none text-zinc-400 hover:text-white shadow-xl"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}

        {/* Mobile Slide-out Menu */}
        <AnimatePresence>
          {isMobile && activeView === 'tracklist' && isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/80"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-black border-r border-zinc-900 z-50 p-4 flex flex-col gap-6 shadow-2xl"
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
                        "p-3 rounded-none font-mono text-xs tracking-widest font-black uppercase transition-colors text-left relative overflow-hidden",
                        activeView === view ? "bg-primary text-black" : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-900"
                      )}
                    >
                      <span className="relative z-10">{view === 'cdj' ? 'CDJ Mode' : 'Library Mode'}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Persistent Retro-Futuristic Header with View Switcher & Controls */}
        {!isMobile && (
          <div className="w-full relative flex justify-between items-center z-30 font-mono select-none px-3 py-2 shrink-0 border-b border-zinc-900 bg-black rounded-none mb-1">
            {/* Left: CDJ Mode vs Library Mode Switcher */}
            <div className="relative flex p-1 bg-zinc-950 border border-zinc-900 rounded-none">
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
                    "relative px-4 py-1.5 rounded-none font-mono text-[9px] md:text-[10px] tracking-widest font-black uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 w-32 md:w-36",
                    activeView === view ? "text-black" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {activeView === view && (
                    <motion.div
                      layoutId="view-toggle-highlight"
                      className="absolute inset-0 bg-primary rounded-none shadow-[0_0_10px_rgba(216,22,63,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="glitch relative z-10" data-text={view === 'cdj' ? 'CDJ Mode' : 'Library Mode'}>
                    {view === 'cdj' ? 'CDJ Mode' : 'Library Mode'}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Modular Control Panel in Header */}
            {activeView === 'cdj' && (
              <DeckToolbar
                deckCount={deckCount}
                onDeckCountChange={handleDeckCountChange}
                midiDeviceName={midiDeviceName}
                onOpenMIDI={() => {
                  setIsMIDIOpen(true);
                  playClick(900, 'sine', 0.02);
                }}
                usbFolderName={usbFolderName}
                isUsbLoading={isUsbLoading}
                onConnectUsb={() => {
                  playClick(900, 'sine', 0.02);
                  connectUsbDrive();
                }}
                recordingState={recordingState}
                onToggleRecording={() => {
                  playClick(1000, 'sine', 0.03);
                  if (recordingState.isRecording) {
                    setRecorder.stopRecording();
                  } else {
                    setRecorder.startRecording('wav');
                  }
                }}
                onSaveRecording={() => {
                  playClick(900, 'sine', 0.02);
                  setRecorder.downloadRecordedSet('HENRY_IX_LIVE_SET');
                }}
                onOpenShortcuts={() => {
                  setIsShortcutsModalOpen(true);
                  playClick(900, 'sine', 0.02);
                }}
                onOpenStageFX={() => {
                  playClick(1000, 'sine', 0.03);
                  setIsStageVisualizerOpen(true);
                }}
                onOpenRecordModal={() => {
                  playClick(900, 'sine', 0.02);
                  setIsRecordModalOpen(true);
                }}
              />
            )}
          </div>
        )}

        {activeView === 'cdj' ? (
          midiDeviceName ? (
            <HardwareControllerView
              deviceName={midiDeviceName}
              isDepth={isDepth}
              onOpenTracklist={(deckId) => setActiveTracklistDeckId(deckId)}
              onOpenMIDI={() => setIsMIDIOpen(true)}
            />
          ) : isMobile ? (
            renderMobileCDJ()
          ) : (
            <>
            <style dangerouslySetInnerHTML={{ __html: `
              .dj-grid-container {
                display: grid;
                gap: 8px;
                width: 100%;
                height: 100%;
                min-height: 0;
              }
              
              /* Mobile / Tablet Mode (Screens < 1024px) */
              @media (max-width: 1023px) {
                .dj-grid-container {
                  display: grid;
                  gap: 6px;
                  grid-template-columns: minmax(0, 1fr) minmax(130px, 0.9fr) minmax(0, 1fr);
                  grid-template-rows: 1fr;
                  grid-template-areas: "deckL mixer deckR";
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                }
              }

              /* Standard Desktop & Laptop Mode (1024px to 1399px) */
              @media (min-width: 1024px) and (max-width: 1399px) {
                .dj-grid-container {
                  gap: 8px;
                  ${isStacked ? `
                    grid-template-columns: minmax(0, 1fr) minmax(160px, 1.1fr) minmax(0, 1fr);
                    grid-template-rows: 1fr;
                    grid-template-areas: "deckL mixer deckR";
                  ` : deckCount === 2 ? `
                    grid-template-columns: minmax(0, 1.8fr) minmax(200px, 1.2fr) minmax(0, 1.8fr);
                    grid-template-rows: 1fr;
                    grid-template-areas: "deck1 mixer deck2";
                  ` : `
                    grid-template-columns: minmax(0, 1fr) minmax(180px, 1.2fr) minmax(0, 1fr);
                    grid-template-rows: 1fr 1fr;
                    grid-template-areas: 
                      "deck3 mixer deck4"
                      "deck1 mixer deck2";
                  `}
                }
              }

              /* Ultra-Wide Desktop Mode (>= 1400px) */
              @media (min-width: 1400px) {
                .dj-grid-container {
                  gap: 8px;
                  ${isStacked ? `
                    grid-template-columns: minmax(0, 1fr) minmax(180px, 1.1fr) minmax(0, 1fr);
                    grid-template-rows: 1fr;
                    grid-template-areas: "deckL mixer deckR";
                  ` : deckCount === 2 ? `
                    grid-template-columns: minmax(0, 1.8fr) minmax(220px, 1.2fr) minmax(0, 1.8fr);
                    grid-template-rows: 1fr;
                    grid-template-areas: "deck1 mixer deck2";
                  ` : `
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(180px, 1.1fr) minmax(0, 1fr) minmax(0, 1fr);
                    grid-template-rows: 1fr;
                    grid-template-areas: "deck3 deck1 mixer deck2 deck4";
                  `}
                }
              }
            `}} />

            <div className="dj-grid-container select-none flex-grow min-h-0 h-full overflow-hidden p-1">
              
              {/* Decks with Framer Motion Push Inward/Outward Spring Animations */}
              <AnimatePresence mode="popLayout">
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
                    <motion.div
                      key={`deck-container-${id}`}
                      initial={{ 
                        opacity: 0, 
                        scale: 0.96, 
                        x: id === 3 ? -40 : id === 4 ? 40 : 0,
                        skewX: isGlitching ? (id % 2 === 0 ? -1.5 : 1.5) : 0
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        x: 0,
                        skewX: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.96, 
                        x: id === 3 ? -40 : id === 4 ? 40 : 0,
                        skewX: isGlitching ? (id % 2 === 0 ? 1.5 : -1.5) : 0
                      }}
                      transition={{ 
                        duration: 0.32, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      style={{ gridArea: getDeckArea(id) }}
                      className={cn(
                        "flex flex-col gap-2 h-full min-h-0 will-change-transform",
                        (isActive || !isStacked) ? "flex" : "hidden"
                      )}
                    >
                      {/* Unified CDJ LCD & Waveform HUD */}
                      <div 
                        className="bg-black border border-zinc-900 p-1.5 flex flex-col gap-1 w-full border-l-2 shrink-0 select-none font-mono transition-all rounded-none" 
                        style={{ borderLeftColor: themeColor }}
                      >
                        {/* LCD Top Row: Deck Badge + Title + BPM + Status + Load Button */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <DeckBadge deckId={id} variant="badge" isPlaying={deck?.isPlaying} isLoaded={!isLocked && !!deck?.title} />
                            <div className="flex flex-col min-w-0">
                              <span className="font-black truncate tracking-wider text-zinc-200 text-[8.5px] md:text-[9.5px] uppercase leading-tight">
                                {isLocked ? "LOCKED DECK (PREVIEW ONLY)" : deck?.title || "NO TRACK LOADED"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span 
                              className="text-[7px] font-bold font-mono px-1 py-0.5 border border-zinc-800 uppercase"
                              style={{ color: isLocked ? 'rgb(234,179,8)' : deck?.isPlaying ? themeColor : 'rgb(113,113,122)' }}
                            >
                              {isLocked ? "LOCKED" : deck?.isPlaying ? "● PLAY" : "■ PAUSE"}
                            </span>
                            <div className="hidden sm:flex flex-col text-right font-mono">
                              <span className="text-[7.5px] font-bold text-amber-400 leading-none">
                                {isLocked ? "130.0 BPM" : `${(deck?.bpm * (1 + (deck?.pitch || 0) / 100)).toFixed(1)} BPM`}
                              </span>
                            </div>

                            {/* 4-Beat Bar Phase Blocks */}
                            <div className="flex items-center gap-0.5 px-1 py-1 border border-zinc-800 bg-zinc-950" title="4-Beat Bar Phase">
                              {[0, 1, 2, 3].map((b) => {
                                const activeBpm = deck?.bpm * (1 + (deck?.pitch || 0) / 100);
                                const beatSec = 60 / (activeBpm || 120);
                                const beatInBar = isLocked ? 0 : Math.floor((((deck?.progress || 0) - (deck?.firstBeatOffset || 0)) / beatSec) % 4 + 4) % 4;
                                const isActive = deck?.isPlaying && beatInBar === b;
                                return (
                                  <div
                                    key={b}
                                    className={cn(
                                      "w-1.5 h-2 border transition-all duration-75",
                                      isActive
                                        ? "border-transparent shadow-[0_0_6px_currentColor]"
                                        : "border-zinc-800 bg-zinc-900"
                                    )}
                                    style={{
                                      backgroundColor: isActive ? themeColor : undefined,
                                      color: themeColor
                                    }}
                                  />
                                );
                              })}
                            </div>
                            
                            {/* Set Beat 1 & Zoom Adjuster replacing old load button */}
                            <div className="flex items-center gap-1 bg-black p-0.5 border border-zinc-800 shrink-0">
                              <button
                                onClick={() => {
                                  playClick(880, 'sine', 0.04);
                                  const audio = audioEngine.audioElements[id];
                                  const currentPos = audio ? audio.currentTime : (deck?.progress || 0);
                                  setDeck(id, { 
                                    firstBeatOffset: currentPos,
                                    mainCue: currentPos 
                                  });
                                }}
                                className="px-1.5 py-0.5 rounded-none border border-amber-500/50 bg-amber-950/50 text-amber-400 hover:bg-amber-900 hover:text-white font-mono text-[7px] md:text-[7.5px] font-black uppercase leading-none cursor-pointer transition-all active:scale-95 shadow-[0_0_6px_rgba(245,158,11,0.35)]"
                                title="Set current playhead position as Beat 1 Downbeat"
                              >
                                SET BEAT 1
                              </button>
                              <div className="flex items-center gap-0.5 border-l border-zinc-800 pl-1">
                                <button
                                  onClick={() => {
                                    playClick(600, 'sine', 0.015);
                                    const curr = deck?.zoomLevel || 55;
                                    setDeck(id, { zoomLevel: Math.max(25, curr - 15) });
                                  }}
                                  className="w-4 h-4 rounded-none border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center font-mono text-[8px] font-black cursor-pointer leading-none"
                                  title="Zoom Out Waveform"
                                >
                                  -
                                </button>
                                <span className="text-[6.5px] font-mono text-zinc-400 font-bold px-0.5 min-w-[22px] text-center">
                                  {deck?.zoomLevel || 55}px
                                </span>
                                <button
                                  onClick={() => {
                                    playClick(750, 'sine', 0.015);
                                    const curr = deck?.zoomLevel || 55;
                                    setDeck(id, { zoomLevel: Math.min(130, curr + 15) });
                                  }}
                                  className="w-4 h-4 rounded-none border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center font-mono text-[8px] font-black cursor-pointer leading-none"
                                  title="Zoom In Waveform"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Track ID Live Transition HUD */}
                        <TrackIdLiveHUD
                          deckId={id}
                          deck={deck}
                          themeColor={themeColor}
                          onSeek={(sec) => seekDeckToTime(id, sec)}
                        />

                        {/* Middle: Scrolling Waveform (Enlarged Height) */}
                        <div className="w-full h-12 sm:h-14 md:h-16 lg:h-20 relative bg-black rounded-none border border-zinc-900 flex items-center justify-center overflow-hidden shadow-inner">
                          {isStacked ? renderStackedWaveform(id) : (
                            <SingleDeckWaveform 
                              deckId={id} 
                              deck={deck} 
                              isDepth={isDepth} 
                            />
                          )}
                        </div>

                        {/* Bottom Row: Speed, Playhead, Sync Status */}
                        <div className="grid grid-cols-3 gap-1 text-[7.5px] font-mono border-t border-zinc-900/60 pt-0.5 select-none">
                          <div className="flex items-center gap-1 truncate">
                            <span className="text-[5px] text-zinc-500 uppercase font-bold">SPD:</span>
                            <span className="font-bold text-zinc-400">
                              {isLocked ? "130.00" : `${(deck?.bpm * (1 + (deck?.pitch || 0) / 100)).toFixed(2)}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[5px] text-zinc-500 uppercase font-bold">POS:</span>
                            <span className="font-bold text-zinc-300 font-mono">
                              {isLocked ? "LOCKED" : formatPlayheadTime(deck?.progress || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[5px] text-zinc-500 uppercase font-bold">SYNC:</span>
                            <span className={cn(
                              "font-black tracking-wide uppercase",
                              deck?.syncEnabled ? "text-emerald-400" : "text-zinc-600"
                            )}>
                              {deck?.syncEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex-1 min-h-0 overflow-hidden">
                        {renderDeckControls(id)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Central Mixer Panel */}
              <motion.div 
                layout
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                style={{ gridArea: 'mixer' }} 
                className="mixer-module block h-full min-h-0 overflow-hidden"
              >
                {renderMixer()}
              </motion.div>

            </div>

            {/* Analog Accent Rhythm Sampler (808/909) */}
            <RhythmAccentPads themeColor="var(--color-primary)" />

            {/* Single Master Music Crate Browser (Collapsible) */}
            <div className={cn(
              "w-full shrink-0 border-t border-zinc-900 bg-black transition-all duration-300",
              isCrateCollapsed ? "h-auto p-0" : "h-[28vh] max-h-[270px] min-h-[150px] p-1"
            )}>
              <DeckBrowserPanel
                deckCount={deckCount}
                activeDeckId={leftActiveDeck || 1}
                mixGroups={effectiveMixGroups}
                browserFolder={masterBrowserFolder}
                onFolderSelect={(folder) => setMasterBrowserFolder(folder)}
                detectedBpms={detectedBpms}
                onTrackSelect={(mix, dId) => playTrack(mix, dId)}
                onLoadLocalFile={(file, dId) => loadLocalFile && loadLocalFile(dId || 1, file)}
                themeColor="var(--color-primary)"
                isExpandedView={isMasterCrateExpanded}
                onCloseExpanded={() => setIsMasterCrateExpanded(false)}
                isCollapsed={isCrateCollapsed}
                onToggleCollapse={() => setIsCrateCollapsed(prev => !prev)}
              />
            </div>
          </>
          )
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
              className="fixed inset-0 bg-black/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-3xl border border-zinc-900 bg-black rounded-none p-6 shadow-2xl font-mono text-zinc-300 z-10 select-none"
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

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-[10px] tracking-wide mb-4">
                {/* DECK 3 */}
                <div className="flex flex-col gap-4 border-r border-zinc-900/60 pr-4">
                  <span className="text-emerald-500 font-bold tracking-widest text-[8px] uppercase">Deck 3 (Far Left)</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Play / Pause</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-emerald-400 font-bold">Q</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Cue</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-emerald-400 font-bold">A</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Sync</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-emerald-400 font-bold">W</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Hot Cues A-D</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-emerald-400 font-bold">E - Y</kbd></div>
                  </div>
                </div>

                {/* DECK 1 */}
                <div className="flex flex-col gap-4 border-r border-zinc-900/60 pr-4">
                  <span className="text-primary font-bold tracking-widest text-[8px] uppercase">Deck 1 (Mid Left)</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Play / Pause</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-primary font-bold">Space</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Cue</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-primary font-bold">C</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Sync</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-primary font-bold">S</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Hot Cues A-D</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-primary font-bold">1 - 4</kbd></div>
                  </div>
                </div>

                {/* DECK 2 */}
                <div className="flex flex-col gap-4 border-r border-zinc-900/60 pr-4">
                  <span className="text-cyan-400 font-bold tracking-widest text-[8px] uppercase">Deck 2 (Mid Right)</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Play / Pause</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-cyan-400 font-bold">Enter</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Cue</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-cyan-400 font-bold">L</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Sync</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-cyan-400 font-bold">D</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Hot Cues A-D</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-cyan-400 font-bold">7 - 0</kbd></div>
                  </div>
                </div>

                {/* DECK 4 */}
                <div className="flex flex-col gap-4 pl-2">
                  <span className="text-yellow-500 font-bold tracking-widest text-[8px] uppercase">Deck 4 (Far Right)</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Play / Pause</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-yellow-500 font-bold">P</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Cue</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-yellow-500 font-bold">K</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Sync</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-yellow-500 font-bold">O</kbd></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-500">Hot Cues A-D</span><kbd className="px-1.5 py-0.5 rounded-none bg-zinc-950 border border-zinc-900 text-yellow-500 font-bold">U - ]</kbd></div>
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
      <UsbDropzoneOverlay
        isOpen={isDraggingFile}
        onClose={() => setIsDraggingFile(false)}
        leftDeckId={leftActiveDeck}
        rightDeckId={rightActiveDeck}
        dragTargetDeck={dragTargetDeck}
        onDragTargetDeckChange={setDragTargetDeck}
        onFileDrop={(targetId, file) => {
          if (loadLocalFile) loadLocalFile(targetId, file);
        }}
        onLockout={() => {
          if (playLockoutBlip) playLockoutBlip();
        }}
      />

      {/* Mobile Tracklist Overlay Modal */}
      <AnimatePresence>
        {activeTracklistDeckId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTracklistDeckId(null)}
              className="fixed inset-0 bg-black/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm border border-zinc-900 bg-black rounded-none p-4 font-mono text-zinc-300 z-10 select-none max-h-[75vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveTracklistDeckId(null)}
                className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-primary text-[8px] font-black tracking-[0.25em] uppercase border-b border-zinc-900 pb-2 mb-3 truncate pr-8">
                📋 TRACKLIST {'//'} DECK {activeTracklistDeckId} {'//'} {decks[activeTracklistDeckId]?.title || 'LOADED MIX'}
              </h3>

              <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
                {decks[activeTracklistDeckId]?.tracklist ? (
                  parseTracklist(decks[activeTracklistDeckId].tracklist || '').map((item, idx) => (
                    <div key={idx} className="text-[10px] text-zinc-400 font-mono flex gap-2.5 items-center leading-normal">
                      {item.isTimestamp ? (
                        <button
                          onClick={() => {
                            playClick(1000, 'sine', 0.02);
                            if (seekDeckToTime) {
                              seekDeckToTime(activeTracklistDeckId, item.seconds);
                            }
                            setActiveTracklistDeckId(null);
                          }}
                          className="text-primary hover:text-red-400 cursor-pointer font-bold select-none hover:underline shrink-0"
                        >
                          {item.timestampText}
                        </button>
                      ) : null}
                      <span className="truncate select-text text-left">{item.text}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[9px] text-zinc-600 uppercase tracking-wider py-4 text-center">
                    No tracklist data loaded for this mix.
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WebMIDI Hardware Link & Mapping Modal */}
      <MIDILearnModal isOpen={isMIDIOpen} onClose={() => setIsMIDIOpen(false)} />

      {/* Stage Mode: Audio-Reactive Fullscreen Visualizer Modal */}
      <StageVisualizerModal isOpen={isStageVisualizerOpen} onClose={() => setIsStageVisualizerOpen(false)} />

      {/* Master Mix Cassette Recording Modal */}
      <SetRecordingModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />
    </section>
  );
}
