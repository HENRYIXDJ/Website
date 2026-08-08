'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { useAudio } from '@/components/AudioProvider';
import { playClick } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';
import { getSessionImage } from '@/lib/mixes';
import { Play, Pause } from 'lucide-react';
import { HotCuePads } from './HotCuePads';
import { JogWheelPlatter } from './JogWheelPlatter';
import { PitchFader } from './PitchFader';
import { HardwareScreenHud } from './HardwareScreenHud';

interface CDJHardwareProps {
  deckId: 1 | 2 | 3 | 4;
}

export default function CDJHardware({ deckId }: CDJHardwareProps) {
  const deck = useAudioStore(s => s.decks[deckId]);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);
  const setDeck = useAudioStore(s => s.setDeck);

  const { 
    seekLocalBuffer, 
    audioElementsRef, 
    togglePlayGlobal, 
    playLockoutBlip, 
    alignSyncPlayback 
  } = useAudio();

  const isLocked = deck?.id === 'locked';

  // Symmetrical theme color accent based on deck indices
  const themeColor = 
    deckId === 1 ? 'rgba(211,15,49,1)' : // D1: Red
    deckId === 2 ? 'rgba(34,211,238,1)' : // D2: Blue
    deckId === 3 ? 'rgba(16,185,129,1)' : // D3: Green
    'rgba(234,179,8,1)';                  // D4: Yellow

  const faderContainerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef({ time: 0, value: deck?.pitch || 0 });

  useEffect(() => {
    lastUpdateRef.current.value = deck?.pitch || 0;
  }, [deck?.pitch]);

  useEffect(() => {
    const container = faderContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      const input = container.querySelector('input');
      if (document.activeElement !== input || isLocked) return;

      e.preventDefault();

      // Pitch fader scroll sensitivity: 0.005% per step
      const delta = Math.sign(e.deltaY) * 0.005;
      let newValue = lastUpdateRef.current.value + delta;

      const center = 0.0;
      const snapThreshold = 0.35;

      if (Math.abs(newValue - center) < snapThreshold) {
        if (lastUpdateRef.current.value !== center) {
          newValue = center;
          playClick(880, 'sine', 0.015);
        }
      } else {
        const nearestInt = Math.round(newValue);
        if (Math.abs(newValue - nearestInt) < 0.1) {
          newValue = nearestInt;
        }
      }

      newValue = Math.max(-8.0, Math.min(8.0, newValue));
      setDeck(deckId, { pitch: newValue, syncEnabled: false });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [deckId, isLocked, setDeck]);

  // --- Hot Cue Delete Mode State ---
  const [deleteMode, setDeleteMode] = useState(false);

  // --- Simulated Long Press for 4-Beat Loop ---
  const loopInTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Component Container & Jog Wheel Dynamic Resizing ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [cdjWidth, setCdjWidth] = useState(320); // default fallback
  const [cdjHeight, setCdjHeight] = useState(240); // default fallback
  const [jogSize, setJogSize] = useState(144); // default 144px (w-36)
  const innerPlatterSize = jogSize * (108 / 144); // Enlarged display ratio (75% of jog size)

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCdjWidth(width);
        setCdjHeight(height);
        
        // Calculate remaining space for the center jog wheel with compact thresholds for 13" screens
        const isCompact = width < 360 || height < 310;
        const isUltraCompact = width < 270 || height < 230;

        const leftColWidth = isUltraCompact ? 32 : isCompact ? 40 : 48;
        const rightColWidth = isUltraCompact ? 44 : isCompact ? 56 : 76;
        const padding = isCompact ? 12 : 20;
        const availWidth = width - leftColWidth - rightColWidth - padding;
        
        const hotCuesHeight = isCompact ? 28 : 36;
        // Cap height to 72% to ensure 28% vertical clearance for CUE/PLAY and LOOP buttons
        const availHeight = (height - hotCuesHeight - padding) * 0.72;
        
        const size = Math.min(availWidth, availHeight);
        const targetSize = Math.max(56, Math.min(320, size));
        setJogSize(targetSize);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (loopInTimerRef.current) clearTimeout(loopInTimerRef.current);
    };
  }, []);

  // --- Play/Pause (Standard Click User Activation) ---
  const handlePlayPausePress = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }
    togglePlayGlobal(deckId);
  };

  // --- CUE Button State Machine (onPointerDown / onPointerUp) ---
  const handleCueDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    playClick(720, 'sine', 0.015);
    const audioEl = audioElementsRef?.current?.[deckId];
    if (!audioEl) return;

    const mainCueTime = deck.mainCue !== undefined && deck.mainCue !== null ? deck.mainCue : (deck.firstBeatOffset || 0);
    const currentProgress = deck.progress || 0;

    if (deck.isPlaying) {
      // 1. If playing: stop, seek back to cue point, pause
      audioEl.pause();
      seekLocalBuffer(deckId, mainCueTime);
      setDeck(deckId, { isPlaying: false, isCueStuttering: false, progress: mainCueTime });
    } else {
      // 2. If paused:
      if (Math.abs(currentProgress - mainCueTime) > 0.08) {
        // Paused away from main cue: seek back to main cue point
        seekLocalBuffer(deckId, mainCueTime);
        setDeck(deckId, { progress: mainCueTime, isCueStuttering: false });
      } else {
        // Paused directly at cue point: start cue stutter (play while held)
        setDeck(deckId, { isPlaying: true, isCueStuttering: true });
        audioEl.play().catch((err: any) => {
          if (err.name !== 'AbortError') {
            console.warn(`Cue stutter play failed on deck ${deckId}:`, err.message);
            setDeck(deckId, { isPlaying: false, isCueStuttering: false });
          }
        });
      }
    }
  };

  const handleCueUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (deck.isCueStuttering) {
      // Release cue stutter: pause, snap back to mainCue, reset stutter flag
      const audioEl = audioElementsRef?.current?.[deckId];
      if (audioEl) {
        audioEl.pause();
      }
      seekLocalBuffer(deckId, deck.mainCue || 0);
      setDeck(deckId, { isPlaying: false, isCueStuttering: false });
    }
  };

  // --- Hot Cues (A-H) Logic ---
  const handleHotCuePress = (pad: string) => {
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    const currentProgress = deck.progress || 0;
    const savedTime = deck.hotCues?.[pad];

    if (deleteMode) {
      // Delete Hot Cue mode
      playClick(500, 'sine', 0.05); // low synth click for delete
      setDeck(deckId, {
        hotCues: {
          ...deck.hotCues,
          [pad]: null
        }
      });
      setDeleteMode(false); // disable delete mode after one action
      return;
    }

    if (savedTime === null || savedTime === undefined) {
      // Save Hot Cue: snap to closest beat of the beatgrid
      const bpm = deck.bpm || 120;
      const beatInterval = 60 / bpm;
      const offset = deck.firstBeatOffset || 0;
      const elapsed = currentProgress - offset;
      const closestBeatIndex = Math.round(elapsed / beatInterval);
      const snappedTime = Math.max(0, offset + closestBeatIndex * beatInterval);

      playClick(880, 'sine', 0.02); // high beep
      setDeck(deckId, {
        hotCues: {
          ...deck.hotCues,
          [pad]: snappedTime
        }
      });
    } else {
      // Jump and play instantly: jump to saved timestamp
      playClick(960, 'sine', 0.015);
      seekLocalBuffer(deckId, savedTime);

      const audioEl = audioElementsRef?.current?.[deckId];
      if (audioEl) {
        if (!deck.isPlaying) {
          // If paused, play immediately
          setDeck(deckId, { isPlaying: true });
          if (deck.syncEnabled) {
            alignSyncPlayback(deckId);
          }
          audioEl.play().catch((err: any) => {
            if (err.name !== 'AbortError') {
              console.warn(`Hotcue play failed on deck ${deckId}:`, err.message);
              setDeck(deckId, { isPlaying: false });
            }
          });
        }
      }
    }
  };

  // --- Loop IN / -4 Beat ---
  const handleLoopInDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    const currentProgress = deck.progress || 0;
    playClick(900, 'sine', 0.015);

    const bpm = deck.bpm || 120;
    const pitch = deck.pitch || 0;
    const currentBpm = bpm * (1 + pitch / 100);
    const beatInterval = 60 / currentBpm;
    const offset = deck.firstBeatOffset || 0;
    const elapsed = currentProgress - offset;
    const closestBeatIndex = Math.round(elapsed / beatInterval);
    const snappedTime = Math.max(0, offset + closestBeatIndex * beatInterval);

    // Setup 4-beat simulated long press: 500ms
    loopInTimerRef.current = setTimeout(() => {
      // LONG PRESS: Auto-calculate 4 beats loop based on BPM
      playClick(1050, 'sine', 0.04);
      const loopOutTime = snappedTime + (beatInterval * 4);
      setDeck(deckId, { 
        loopIn: snappedTime, 
        loopOut: loopOutTime, 
        isLoopActive: true,
        mainCue: snappedTime
      });
      loopInTimerRef.current = null;
    }, 500);

    // SHORT PRESS DEFAULT (until/unless timer fires): Set loopIn and mainCue
    setDeck(deckId, { 
      loopIn: snappedTime,
      mainCue: snappedTime
    });
  };

  const handleLoopInUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (loopInTimerRef.current) {
      clearTimeout(loopInTimerRef.current);
      loopInTimerRef.current = null;
    }
  };

  // --- Loop OUT ---
  const handleLoopOutPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    const currentProgress = deck.progress || 0;
    playClick(850, 'sine', 0.015);

    if (deck.loopIn !== null && deck.loopIn !== undefined) {
      setDeck(deckId, { 
        loopOut: currentProgress, 
        isLoopActive: true 
      });
    }
  };

  // --- Reloop / Exit ---
  const handleReloopExitPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    playClick(880, 'sine', 0.02);

    if (deck.isLoopActive) {
      // Exit loop
      setDeck(deckId, { isLoopActive: false });
    } else if (deck.loopIn !== null && deck.loopOut !== null && deck.loopIn !== undefined && deck.loopOut !== undefined) {
      // Reloop: jump to IN point and start looping
      seekLocalBuffer(deckId, deck.loopIn);
      setDeck(deckId, { isLoopActive: true });
    }
  };

  // --- Sync / Master Toggles ---
  const handleSyncPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }
    playClick(800, 'sine', 0.02);
    const otherDeckId = (deckId === 1 || deckId === 3) ? rightActiveDeck : leftActiveDeck;
    const otherDeck = useAudioStore.getState().decks[otherDeckId];
    const isBothPlaying = deck.isPlaying && otherDeck && otherDeck.isPlaying;

    setDeck(deckId, { 
      syncEnabled: isBothPlaying ? true : !deck.syncEnabled 
    });

    if (isBothPlaying && alignSyncPlayback) {
      alignSyncPlayback(deckId);
    }
  };

  const handleMasterPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) {
      playLockoutBlip();
      return;
    }
    playClick(800, 'sine', 0.02);
    // Exclusive Master: clear Master flag on other decks
    [1, 2, 3, 4].forEach(id => {
      setDeck(id, { isMaster: id === deckId ? !deck.isMaster : false });
    });
  };

  // --- Mode Toggles ---
  const handleJogModePress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) return;
    playClick(850, 'sine', 0.01);
    setDeck(deckId, { jogMode: deck.jogMode === 'VINYL' ? 'CDJ' : 'VINYL' });
  };

  const handleMasterTempoPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) return;
    playClick(900, 'sine', 0.015);
    setDeck(deckId, { masterTempo: !deck.masterTempo });
  };

  const handleSlipPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) return;
    playClick(850, 'sine', 0.015);
    setDeck(deckId, { slipEnabled: !deck.slipEnabled });
  };

  const handleQuantizePress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) return;
    playClick(920, 'sine', 0.015);
    setDeck(deckId, { quantizeEnabled: !deck.quantizeEnabled });
  };

  // --- Grid Nudge and Align ---
  const handleGridNudgeLeft = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked || !deck) return;
    playClick(600, 'sine', 0.01);
    const newOffset = Math.max(0, (deck.firstBeatOffset || 0) - 0.010); // nudge left by 10ms
    setDeck(deckId, { firstBeatOffset: newOffset });
  };

  const handleGridNudgeRight = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked || !deck) return;
    playClick(620, 'sine', 0.01);
    const newOffset = (deck.firstBeatOffset || 0) + 0.010; // nudge right by 10ms
    setDeck(deckId, { firstBeatOffset: newOffset });
  };

  const handleGridAlignCurrent = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked || !deck) return;
    playClick(750, 'sine', 0.015);
    // Align firstBeatOffset to current playhead progress
    let currentProgress = deck.progress || 0;
    if (!deck.scMode && audioElementsRef?.current) {
      const audio = audioElementsRef.current[deckId];
      if (audio && audio.src) {
        currentProgress = audio.currentTime;
      }
    }
    setDeck(deckId, { firstBeatOffset: currentProgress });
  };

  // --- Beat Jump Handler ---
  const handleBeatJump = (numBeats: number) => {
    if (isLocked || !deck) return;
    playClick(850, 'sine', 0.015);
    const audio = audioElementsRef?.current?.[deckId];
    const bpm = deck.bpm || 120;
    const activeBpm = bpm * (1 + (deck.pitch || 0) / 100);
    const beatSec = 60 / activeBpm;
    const jumpSec = numBeats * beatSec;
    
    if (audio) {
      const newTime = Math.max(0, audio.currentTime + jumpSec);
      // eslint-disable-next-line react-hooks/immutability
      audio.currentTime = newTime;
      setDeck(deckId, { progress: newTime });
    }
  };

  // --- Key Sync Handler ---
  const handleKeySyncPress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isLocked) return;
    playClick(900, 'sine', 0.02);
    setDeck(deckId, { keySyncEnabled: !deck?.keySyncEnabled });
  };

  // --- Jog Wheel Event Handler Stubs for Scratching / Pitch Bend ---
  const handlePlatterDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;
    console.log(`[JOG WHEEL DECK ${deckId}] Platter Down. Mode: ${deck.jogMode}. Scratching started.`);
  };

  const handlePlatterMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;
  };

  const handlePlatterUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;
    console.log(`[JOG WHEEL DECK ${deckId}] Platter Up. Scratching completed.`);
  };

  const handleRimDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRimMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRimUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // --- Session Artwork and Spinning calculations ---
  const sessionImg = getSessionImage(deck?.title || '', deck?.artworkUrl);

  return (
    <div 
      ref={containerRef} 
      style={{ containerType: 'inline-size', transform: 'translateZ(0)' }} 
      className={cn(
        "w-full h-full flex flex-col justify-between relative select-none border border-zinc-800 rounded-none bg-black",
        (cdjWidth < 360 || cdjHeight < 310) ? "p-1.5 gap-1.5" : "p-3 gap-3"
      )}
    >
      
      {/* 1. RGB Hot Cues Row (A-H) */}
      <HotCuePads
        hotCues={deck?.hotCues || {}}
        isCompact={cdjWidth < 360 || cdjHeight < 310}
        deleteMode={deleteMode}
        onToggleDeleteMode={() => {
          playClick(440, 'sine', 0.05);
          setDeleteMode(!deleteMode);
        }}
        onHotCuePress={(pad) => handleHotCuePress(pad)}
      />

      {/* Symmetrical Layout Split below Hot Cues */}
      <div className={cn("w-full flex items-stretch justify-between flex-grow min-h-0", (cdjWidth < 360 || cdjHeight < 310) ? "gap-1.5" : "gap-3")}>
        
        {/* Left/Center Column (Loop Row + Main Controls) */}
        <div className="flex flex-col justify-between flex-grow min-h-0 gap-3">
          
          {/* Loop Row (under hot cues, aligned left) */}
          <div className={cn("w-full flex items-end justify-between px-1.5 border-b border-zinc-800/40 shrink-0", (cdjWidth < 360 || cdjHeight < 310) ? "pb-1.5" : "pb-3")}>
            <div className={cn("flex items-end justify-start", (cdjWidth < 360 || cdjHeight < 310) ? "gap-1.5" : "gap-3")}>
              {!(cdjWidth < 360 || cdjHeight < 310) && (
                <span className="text-[5.5px] text-zinc-500 font-mono tracking-widest font-bold uppercase mb-3 shrink-0">LOOP</span>
              )}
              
              {/* IN / -4 BEAT */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[5.5px] sm:text-[6px] text-zinc-500 font-mono font-bold tracking-widest uppercase leading-none h-3.5 flex items-center">IN / -4 BEAT</span>
                )}
                <button
                  onPointerDown={handleLoopInDown}
                  onPointerUp={handleLoopInUp}
                  className={cn(
                    "rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "w-8 h-8 text-[6px]" : "w-12 h-12 text-[8.5px] font-black tracking-[0.1em]",
                    (deck?.loopIn !== null && deck?.loopIn !== undefined)
                      ? cn("bg-amber-500 border-amber-400 text-black", deck?.isLoopActive && "animate-btn-flash")
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  IN
                </button>
              </div>

              {/* OUT */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[5.5px] sm:text-[6px] text-zinc-500 font-mono font-bold tracking-widest uppercase leading-none h-3.5 flex items-center">OUT</span>
                )}
                <button
                  onPointerDown={handleLoopOutPress}
                  className={cn(
                    "rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "w-8 h-8 text-[6px]" : "w-12 h-12 text-[8.5px] font-black tracking-[0.1em]",
                    (deck?.loopOut !== null && deck?.loopOut !== undefined)
                      ? cn("bg-amber-500 border-amber-400 text-black", deck?.isLoopActive && "animate-btn-flash")
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  OUT
                </button>
              </div>

              {/* RELOOP / EXIT */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[5.5px] sm:text-[6px] text-zinc-500 font-mono font-bold tracking-widest uppercase leading-none h-3.5 flex items-center">RELOOP/EXIT</span>
                )}
                <button
                  onPointerDown={handleReloopExitPress}
                  className={cn(
                    "rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "w-8 h-8 text-[5.5px]" : "w-12 h-12 text-[7.5px] font-black tracking-wider",
                    deck?.isLoopActive
                      ? "bg-amber-500 border-amber-400 text-black"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  EXIT
                </button>
              </div>
            </div>

            {/* SYNC / MSTR / JOG / MT / SLIP / KEY / QNTZ 2-row Grid */}
            <div className={cn("grid grid-cols-4 items-end shrink-0", (cdjWidth < 360 || cdjHeight < 310) ? "gap-1 min-w-[70px]" : "gap-1.5 min-w-[130px]")}>
              {/* Row 1 */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">SYNC</span>
                )}
                <button
                  onPointerDown={handleSyncPress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4.5px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6px] font-black",
                    deck?.syncEnabled
                      ? "bg-emerald-500 border-emerald-400 text-black"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  S
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">MSTR</span>
                )}
                <button
                  onPointerDown={handleMasterPress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4.5px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6px] font-black",
                    deck?.isMaster
                      ? "bg-yellow-500 border-yellow-400 text-black"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  M
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">JOG</span>
                )}
                <button
                  onPointerDown={handleJogModePress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6.5px] font-black",
                    deck?.jogMode === 'VINYL'
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {deck?.jogMode === 'VINYL' ? 'VIN' : 'CDJ'}
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">MT</span>
                )}
                <button
                  onPointerDown={handleMasterTempoPress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4.5px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6.5px] font-black",
                    deck?.masterTempo
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  MT
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">SLIP</span>
                )}
                <button
                  onPointerDown={handleSlipPress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6.5px] font-black",
                    deck?.slipEnabled
                      ? "bg-red-500 border-red-400 text-black"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  SLP
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">KEY</span>
                )}
                <button
                  onPointerDown={handleKeySyncPress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4.5px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6.5px] font-black",
                    deck?.keySyncEnabled
                      ? "bg-purple-500 border-purple-400 text-black"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  K
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 360 || cdjHeight < 310) && (
                  <span className="text-[4.5px] text-zinc-500 font-mono font-bold uppercase leading-none">QNTZ</span>
                )}
                <button
                  onPointerDown={handleQuantizePress}
                  className={cn(
                    "w-full rounded-none border transition-colors cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 360 || cdjHeight < 310) ? "max-w-[14px] min-w-[12px] aspect-square text-[4.5px] font-bold" : "max-w-[28px] min-w-[20px] aspect-square text-[6.5px] font-black",
                    deck?.quantizeEnabled
                      ? "bg-primary border-primary text-white"
                      : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Q
                </button>
              </div>
            </div>
          </div>

          {/* Left/Center Main Controls Row */}
          <div className={cn("w-full flex items-stretch justify-between relative flex-grow min-h-0", (cdjWidth < 360 || cdjHeight < 310) ? "gap-1.5" : "gap-3")}>
            
            {/* Left Side: Main Controls */}
            <div className={cn("flex flex-col justify-end shrink-0", (cdjWidth < 360 || cdjHeight < 310) ? "w-9" : "w-12")}>
              
              {/* Grid & Beat Jump Panel */}
              {!(cdjWidth < 360 || cdjHeight < 310) && (
                <div className="flex flex-col items-center gap-1.5 mb-auto border border-zinc-800 rounded-none p-1.5 bg-black select-none w-full">
                  <span className="text-[5.5px] text-zinc-400 font-mono font-black uppercase tracking-wider leading-none">BEAT JUMP (BARS)</span>
                  <div className="grid grid-cols-2 gap-1 w-full">
                    <button
                      onPointerDown={() => handleBeatJump(-16)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump -4 Bars (-16 beats)"
                    >
                      -4B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(16)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump +4 Bars (+16 beats)"
                    >
                      +4B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(-32)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump -8 Bars (-32 beats)"
                    >
                      -8B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(32)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump +8 Bars (+32 beats)"
                    >
                      +8B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(-64)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump -16 Bars (-64 beats)"
                    >
                      -16B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(64)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump +16 Bars (+64 beats)"
                    >
                      +16B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(-128)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump -32 Bars (-128 beats)"
                    >
                      -32B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(128)}
                      className="h-5 rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[6.5px] font-black cursor-pointer"
                      title="Beat Jump +32 Bars (+128 beats)"
                    >
                      +32B
                    </button>
                  </div>

                  <span className="text-[5.5px] text-zinc-400 font-mono font-black uppercase tracking-wider leading-none mt-1">BEATGRID NUDGE</span>
                  <div className="grid grid-cols-2 gap-1 w-full">
                    <button
                      onPointerDown={handleGridNudgeLeft}
                      className="h-4.5 rounded-none border border-zinc-800 bg-black text-zinc-400 hover:text-white flex items-center justify-center font-mono text-[5.5px] font-bold cursor-pointer"
                      title="Nudge Beatgrid Left (-10ms)"
                    >
                      -10ms
                    </button>
                    <button
                      onPointerDown={handleGridNudgeRight}
                      className="h-4.5 rounded-none border border-zinc-800 bg-black text-zinc-400 hover:text-white flex items-center justify-center font-mono text-[5.5px] font-bold cursor-pointer"
                      title="Nudge Beatgrid Right (+10ms)"
                    >
                      +10ms
                    </button>
                  </div>

                  <button
                    onPointerDown={handleGridAlignCurrent}
                    className="w-full h-4.5 rounded-none border border-amber-500/40 bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 active:bg-amber-800 flex items-center justify-center font-mono text-[6px] font-black cursor-pointer uppercase"
                    title="Set Current Position as Beat 1 Downbeat"
                  >
                    SET BEAT 1
                  </button>
                </div>
              )}

              {/* Transport Section (Orange CUE and Green PLAY) */}
              <div className={cn("flex flex-col mt-auto", (cdjWidth < 360 || cdjHeight < 310) ? "gap-1.5 pt-1" : "gap-2 pt-2")}>
                
                {/* CUE Button */}
                <button
                  onPointerDown={handleCueDown}
                  onPointerUp={handleCueUp}
                  className={cn(
                    "rounded-full border-2 border-zinc-900 bg-black active:bg-zinc-950 flex flex-col items-center justify-center font-mono cursor-pointer relative shrink-0",
                    (cdjWidth < 360 || cdjHeight < 310) ? "w-8 h-8 text-[6px]" : "w-12 h-12 text-[8px] font-black tracking-[0.1em]",
                    deck?.isCueStuttering || (!deck?.isPlaying && (deck?.progress || 0) > 0 && Math.abs((deck?.progress || 0) - (deck?.mainCue || 0)) < 0.05)
                      ? "border-amber-400 text-amber-400"
                      : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <div className="absolute inset-1 rounded-full border border-dashed border-zinc-700/20" />
                  <span>CUE</span>
                </button>

                {/* PLAY Button */}
                <button
                  onClick={handlePlayPausePress}
                  className={cn(
                    "rounded-full border-2 border-zinc-900 bg-black active:bg-zinc-950 flex flex-col items-center justify-center cursor-pointer relative shrink-0",
                    (cdjWidth < 360 || cdjHeight < 310) ? "w-8 h-8" : "w-12 h-12",
                    deck?.isPlaying
                      ? "border-green-500 text-green-400"
                      : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <div className="absolute inset-1 rounded-full border border-dashed border-zinc-700/20" />
                  {deck?.isPlaying ? (
                    <Pause className={cn("fill-current text-green-400", (cdjWidth < 360 || cdjHeight < 310) ? "w-2.5 h-2.5" : "w-4 h-4")} />
                  ) : (
                    <Play className={cn("fill-current text-zinc-500 hover:text-zinc-300", (cdjWidth < 360 || cdjHeight < 310) ? "w-2.5 h-2.5 ml-0.5" : "w-4 h-4 ml-0.5")} />
                  )}
                </button>
              </div>
            </div>

            {/* Center: Tactile Jog Wheel */}
            <JogWheelPlatter
              jogSize={jogSize}
              innerPlatterSize={innerPlatterSize}
              isCompact={cdjWidth < 360 || cdjHeight < 310}
              isPlaying={!!deck?.isPlaying}
              isCueStuttering={!!deck?.isCueStuttering}
              themeColor={themeColor}
              sessionImg={sessionImg}
              onRimDown={handleRimDown}
              onRimMove={handleRimMove}
              onRimUp={handleRimUp}
              onPlatterDown={handlePlatterDown}
              onPlatterMove={handlePlatterMove}
              onPlatterUp={handlePlatterUp}
            />
          </div>
        </div>

        {/* Right Side Column: Tall Tempo Slider and Buttons */}
        <div className={cn("flex flex-col justify-between shrink-0 select-none bg-black border border-zinc-900 rounded-none h-full", (cdjWidth < 360 || cdjHeight < 310) ? "w-12 p-1 gap-1.5" : "w-20 p-2 gap-2")}>
          <PitchFader
            pitch={deck?.pitch || 0}
            isCompact={cdjWidth < 360 || cdjHeight < 310}
            isLocked={isLocked}
            themeColor={themeColor}
            onPitchChange={(targetPitch) => {
              setDeck(deckId, { pitch: targetPitch, syncEnabled: false });
            }}
          />

          {/* Pitch Bend Buttons */}
          {!(cdjWidth < 360 || cdjHeight < 310) && (
            <div className="flex justify-between items-center gap-1.5 w-full shrink-0 select-none border-t border-zinc-800/40 pt-1.5">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  playClick(600, 'sine', 0.015);
                  setDeck(deckId, { pitchBend: -2.0 });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  setDeck(deckId, { pitchBend: 0 });
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  setDeck(deckId, { pitchBend: 0 });
                }}
                className="flex-1 h-5 text-[6.5px] font-mono font-black border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 active:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer flex items-center justify-center select-none leading-none"
                title="Temporary Pitch Bend -"
              >
                BEND -
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  playClick(900, 'sine', 0.015);
                  setDeck(deckId, { pitchBend: 2.0 });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  setDeck(deckId, { pitchBend: 0 });
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  setDeck(deckId, { pitchBend: 0 });
                }}
                className="flex-1 h-5 text-[6.5px] font-mono font-black border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 active:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer flex items-center justify-center select-none leading-none"
                title="Temporary Pitch Bend +"
              >
                BEND +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

