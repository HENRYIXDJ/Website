'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { useAudio } from '@/components/AudioProvider';
import { playClick } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';
import { getSessionImage } from '@/lib/mixes';
import { Play, Pause, Lock, Upload } from 'lucide-react';
import { HotCuePads } from './HotCuePads';
import { JogWheelPlatter } from './JogWheelPlatter';
import { PitchFader } from './PitchFader';

interface CDJHardwareProps {
  deckId: 1 | 2 | 3 | 4;
}

export default function CDJHardware({ deckId }: CDJHardwareProps) {
  const deck = useAudioStore(s => s.decks[deckId]);
  const playLockEnabled = useAudioStore(s => s.playLockEnabled);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);
  const setDeck = useAudioStore(s => s.setDeck);

  const { 
    seekLocalBuffer, 
    audioElementsRef, 
    togglePlayGlobal, 
    playLockoutBlip, 
    alignSyncPlayback,
    playTrack,
    halveLoop,
    doubleLoop
  } = useAudio();

  const isLocked = deck?.id === 'locked';

  // Symmetrical theme color accent based on deck indices
  const themeColor = 
    deckId === 1 ? 'rgba(211,15,49,1)' : // D1: Red
    deckId === 2 ? 'rgba(34,211,238,1)' : // D2: Blue
    deckId === 3 ? 'rgba(16,185,129,1)' : // D3: Green
    'rgba(234,179,8,1)';                  // D4: Yellow

  // --- Hot Cue Delete Mode State ---
  const [deleteMode, setDeleteMode] = useState(false);

  // --- Drag and Drop & Play Lock Dropzone State ---
  const [isDragHovering, setIsDragHovering] = useState(false);
  const isLockedForDrop = !!(deck?.isPlaying && playLockEnabled);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLockedForDrop) {
      e.dataTransfer.dropEffect = 'none';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragHovering(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragHovering(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragHovering(false);

    if (isLockedForDrop) {
      playLockoutBlip();
      return;
    }

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const track = JSON.parse(rawData);
        if (track && track.id) {
          playTrack(track, deckId);
        }
      }
    } catch (err) {
      console.error(`[DECK ${deckId} DROP ERROR]`, err);
    }
  };

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
        
        // Calculate responsive layout parameters
        const isCompact = width < 380 || height < 340;
        const isUltraCompact = width < 280 || height < 250;

        const leftColWidth = isUltraCompact ? 46 : isCompact ? 56 : 74;
        const rightColWidth = isUltraCompact ? 46 : isCompact ? 56 : 74;
        const padding = isCompact ? 10 : 16;
        const availWidth = width - leftColWidth - rightColWidth - padding;
        
        const topBarsHeight = isCompact ? 64 : 84; // Hot cues + Loop/Mode bar
        const availHeight = (height - topBarsHeight - padding) * 0.95;
        
        const size = Math.min(availWidth, availHeight);
        const targetSize = Math.max(52, Math.min(260, size));
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
      const nextCues = { ...deck.hotCues };
      delete nextCues[pad];
      setDeck(deckId, { hotCues: nextCues });
      setDeleteMode(false);
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
  const handleScratchDelta = (velocity: number) => {
    if (isLocked || !deck) return;
    const audio = audioElementsRef?.current?.[deckId];
    if (audio) {
      const seekOffset = velocity * 0.008;
      const newTime = Math.max(0, audio.currentTime + seekOffset);
      seekLocalBuffer(deckId, newTime);
    }
  };

  const handlePlatterDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    playClick(1200, 'sine', 0.008);
  };

  const handlePlatterMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
  };

  const handlePlatterUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    console.log(`[JOG WHEEL DECK ${deckId}] Platter Up. Scratching completed.`);
  };

  const lastRimAngleRef = useRef<number | null>(null);

  const handleRimDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastRimAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
  };

  const handleRimMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked || lastRimAngleRef.current === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    let delta = angle - lastRimAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastRimAngleRef.current = angle;

    // Smooth outer rim pitch nudging
    const audio = audioElementsRef?.current?.[deckId];
    if (audio && isFinite(audio.duration)) {
      const nudgeOffset = (delta / 360) * 0.35;
      // eslint-disable-next-line react-hooks/immutability
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + nudgeOffset));
    }
  };

  const handleRimUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    lastRimAngleRef.current = null;
  };

  const handleRangeCycle = () => {
    if (isLocked) return;
    const cur = deck?.tempoRange || 10;
    const next: 6 | 10 | 16 | 100 = cur === 6 ? 10 : cur === 10 ? 16 : cur === 16 ? 100 : 6;
    setDeck(deckId, { tempoRange: next });
  };

  const handleHotCueDelete = (pad: string) => {
    if (isLocked) return;
    playClick(500, 'sine', 0.05);
    const nextCues = { ...deck?.hotCues };
    delete nextCues[pad];
    setDeck(deckId, { hotCues: nextCues });
  };

  // --- Session Artwork and Spinning calculations ---
  const sessionImg = getSessionImage(deck?.title || '', deck?.artworkUrl);

  return (
    <div 
      ref={containerRef} 
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ containerType: 'inline-size', transform: 'translateZ(0)' }} 
      className={cn(
        "w-full h-full flex flex-col justify-between relative select-none border border-zinc-800 rounded-none bg-black overflow-hidden",
        (cdjWidth < 380 || cdjHeight < 340) ? "p-1.5 gap-1.5" : "p-2.5 gap-2.5",
        isDragHovering && (isLockedForDrop ? "border-red-600 ring-2 ring-red-600/50" : "border-emerald-500 ring-2 ring-emerald-500/50")
      )}
    >
      {/* Dynamic Crate Drag & Drop Hover Overlay */}
      {isDragHovering && (
        <div 
          className={cn(
            "absolute inset-0 z-[100] backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center font-mono select-none transition-all border-4 border-dashed",
            isLockedForDrop 
              ? "bg-black/92 border-red-600 text-red-500 animate-pulse" 
              : "bg-black/92 text-white shadow-neon-glow"
          )}
          style={{ borderColor: isLockedForDrop ? '#dc2626' : themeColor }}
        >
          {isLockedForDrop ? (
            <>
              <div className="p-3 bg-red-950/90 border border-red-600 rounded-full mb-2 shadow-[0_0_25px_rgba(220,38,38,0.7)] animate-bounce">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
              <span className="text-red-500 font-black text-sm md:text-base tracking-[0.2em] uppercase">
                🔒 PLAY LOCK ACTIVE
              </span>
              <span className="text-zinc-400 text-[9px] tracking-widest uppercase mt-1 bg-red-950/60 border border-red-900 px-2 py-0.5">
                DECK {deckId} IS PLAYING — PAUSE DECK TO LOAD TRACK
              </span>
            </>
          ) : (
            <>
              <div 
                className="p-3 bg-zinc-950 border rounded-full mb-2 shadow-2xl" 
                style={{ borderColor: themeColor }}
              >
                <Upload className="w-8 h-8 animate-bounce" style={{ color: themeColor }} />
              </div>
              <span className="font-black text-sm md:text-base tracking-[0.2em] uppercase text-white">
                📥 DROP TO LOAD DECK {deckId}
              </span>
              <span 
                className="text-[9px] tracking-widest uppercase mt-1 bg-zinc-950 border px-2 py-0.5 font-bold"
                style={{ color: themeColor, borderColor: themeColor }}
              >
                RELEASE MOUSE TO LOAD TRACK INTO DECK {deckId}
              </span>
            </>
          )}
        </div>
      )}
      
      {/* 1. RGB Hot Cues Row (A-H) */}
      <HotCuePads
        hotCues={deck?.hotCues || {}}
        isCompact={cdjWidth < 380 || cdjHeight < 340}
        deleteMode={deleteMode}
        onToggleDeleteMode={() => {
          playClick(440, 'sine', 0.05);
          setDeleteMode(!deleteMode);
        }}
        onHotCuePress={(pad) => handleHotCuePress(pad)}
        onDeleteCue={(pad) => handleHotCueDelete(pad)}
      />

      {/* Symmetrical Layout Split below Hot Cues */}
      <div className={cn("w-full flex items-stretch justify-between flex-grow min-h-0", (cdjWidth < 380 || cdjHeight < 340) ? "gap-1.5" : "gap-2.5")}>
        
        {/* Left/Center Column (Loop Row + Main Controls) */}
        <div className="flex flex-col justify-between flex-grow min-h-0 gap-1.5 md:gap-2">
          
          {/* Loop & Mode Controls Bar (under hot cues) */}
          <div className={cn(
            "w-full flex items-center justify-between border-b border-zinc-800 shrink-0 bg-black/40",
            (cdjWidth < 380 || cdjHeight < 340) ? "px-1 py-1 gap-1" : "px-2 py-1.5 gap-2"
          )}>
            {/* Left: Loop Controls */}
            <div className={cn("flex items-center justify-start shrink-0", (cdjWidth < 380 || cdjHeight < 340) ? "gap-1" : "gap-1.5")}>
              {/* Loop Section Identifier */}
              {!(cdjWidth < 380 || cdjHeight < 340) && (
                <div className="flex flex-col items-center justify-center shrink-0 pr-1.5 border-r border-zinc-800/60">
                  <span className="text-[7px] text-zinc-400 font-mono tracking-widest font-black uppercase">LOOP</span>
                  <span className="text-[5.5px] text-zinc-500 font-mono tracking-tighter uppercase">AUTO</span>
                </div>
              )}
              
              {/* IN / -4 BEAT */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold tracking-widest uppercase h-3 flex items-center justify-center">IN / -4B</span>
                )}
                <button
                  onPointerDown={handleLoopInDown}
                  onPointerUp={handleLoopInUp}
                  className={cn(
                    "rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-7.5 h-7.5 text-[7px] font-bold" : "w-10 h-10 text-[9.5px] font-black tracking-[0.08em]",
                    deck?.isLoopActive
                      ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : (deck?.loopIn !== null && deck?.loopIn !== undefined && deck?.loopOut === null)
                        ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  IN
                </button>
              </div>

              {/* OUT */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold tracking-widest uppercase h-3 flex items-center justify-center">OUT</span>
                )}
                <button
                  onPointerDown={handleLoopOutPress}
                  className={cn(
                    "rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-7.5 h-7.5 text-[7px] font-bold" : "w-10 h-10 text-[9.5px] font-black tracking-[0.08em]",
                    deck?.isLoopActive
                      ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : (deck?.loopIn !== null && deck?.loopIn !== undefined && deck?.loopOut === null)
                        ? "bg-amber-500/20 border-amber-400 text-amber-400 animate-pulse"
                        : "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  OUT
                </button>
              </div>

              {/* RELOOP / EXIT */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold tracking-widest uppercase h-3 flex items-center justify-center">EXIT</span>
                )}
                <button
                  onPointerDown={handleReloopExitPress}
                  className={cn(
                    "rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-7.5 h-7.5 text-[6.5px] font-bold" : "w-10 h-10 text-[8.5px] font-black tracking-wider",
                    deck?.isLoopActive
                      ? "bg-amber-500 border-amber-400 text-black animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : (deck?.loopIn !== null && deck?.loopIn !== undefined)
                        ? "bg-black border-amber-500 text-amber-400"
                        : "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  EXIT
                </button>
              </div>

              {/* HALVE LOOP /2 */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold tracking-widest uppercase h-3 flex items-center justify-center">/2</span>
                )}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (!isLocked) halveLoop(deckId);
                  }}
                  title="Halve Loop Length (/2)"
                  className={cn(
                    "rounded-none border transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none bg-black border-zinc-800 text-amber-400 hover:text-white hover:border-amber-400 active:bg-amber-950",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-6 h-6 text-[7.5px] font-bold" : "w-7.5 h-7.5 text-[8.5px] font-black"
                  )}
                >
                  /2
                </button>
              </div>

              {/* DOUBLE LOOP 2X */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold tracking-widest uppercase h-3 flex items-center justify-center">2X</span>
                )}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (!isLocked) doubleLoop(deckId);
                  }}
                  title="Double Loop Length (2X)"
                  className={cn(
                    "rounded-none border transition-all cursor-pointer shrink-0 flex items-center justify-center font-mono leading-none bg-black border-zinc-800 text-amber-400 hover:text-white hover:border-amber-400 active:bg-amber-950",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-6 h-6 text-[7.5px] font-bold" : "w-7.5 h-7.5 text-[8.5px] font-black"
                  )}
                >
                  2X
                </button>
              </div>
            </div>

            {/* Right: Tactile Mode Buttons Grid (JOG/VINYL, SYNC, MASTER, MT, SLIP, KEY, QNTZ) */}
            <div className={cn("grid grid-cols-4 items-center shrink-0", (cdjWidth < 380 || cdjHeight < 340) ? "gap-0.5" : "gap-1")}>
              {/* JOG MODE (CDJ / VINYL) */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">JOG</span>
                )}
                <button
                  onPointerDown={handleJogModePress}
                  title="Toggle Vinyl / CDJ Mode"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.jogMode === 'VINYL'
                      ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.3)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  {deck?.jogMode === 'VINYL' ? 'VIN' : 'CDJ'}
                </button>
              </div>

              {/* BEAT SYNC */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">SYNC</span>
                )}
                <button
                  onPointerDown={handleSyncPress}
                  title="Toggle Beat Sync"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.syncEnabled
                      ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  SYNC
                </button>
              </div>

              {/* MASTER DECK */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">MSTR</span>
                )}
                <button
                  onPointerDown={handleMasterPress}
                  title="Set Master Deck"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.isMaster
                      ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_6px_rgba(234,179,8,0.4)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  MSTR
                </button>
              </div>

              {/* MASTER TEMPO */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">MT</span>
                )}
                <button
                  onPointerDown={handleMasterTempoPress}
                  title="Master Tempo / Key Lock"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.masterTempo
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.3)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  MT
                </button>
              </div>

              {/* SLIP MODE */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">SLIP</span>
                )}
                <button
                  onPointerDown={handleSlipPress}
                  title="Slip Mode"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.slipEnabled
                      ? "bg-red-500 border-red-400 text-black shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  SLP
                </button>
              </div>

              {/* KEY SYNC */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">KEY</span>
                )}
                <button
                  onPointerDown={handleKeySyncPress}
                  title="Key Sync"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.keySyncEnabled
                      ? "bg-purple-500 border-purple-400 text-black shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  KEY
                </button>
              </div>

              {/* QUANTIZE */}
              <div className="flex flex-col items-center gap-0.5 w-full col-span-2">
                {!(cdjWidth < 380 || cdjHeight < 340) && (
                  <span className="text-[6.5px] text-zinc-400 font-mono font-bold uppercase h-3 flex items-center justify-center">QUANTIZE</span>
                )}
                <button
                  onPointerDown={handleQuantizePress}
                  title="Quantize Grid Lock"
                  className={cn(
                    "w-full rounded-none border transition-all cursor-pointer flex justify-center items-center font-mono leading-none",
                    (cdjWidth < 380 || cdjHeight < 340) ? "h-6 text-[6.5px] font-bold" : "h-7.5 text-[8px] font-black",
                    deck?.quantizeEnabled
                      ? "bg-primary border-primary text-black shadow-[0_0_6px_var(--color-primary-glow)]"
                      : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  QUANTIZE
                </button>
              </div>
            </div>
          </div>

          {/* Left/Center Main Controls Row */}
          <div className={cn("w-full flex items-stretch justify-between relative flex-grow min-h-0", (cdjWidth < 380 || cdjHeight < 340) ? "gap-1" : "gap-2")}>
            
            {/* Left Side: Main Transport & Beat Jump Controls */}
            <div className={cn("flex flex-col justify-between shrink-0 h-full overflow-hidden", (cdjWidth < 380 || cdjHeight < 340) ? "w-13" : "w-18 md:w-20")}>
              
              {/* Grid & Beat Jump Panel (shown only when height permits) */}
              {cdjHeight >= 360 ? (
                <div className="flex flex-col items-center gap-1 mb-auto border border-zinc-800 rounded-none p-1 bg-black select-none w-full">
                  <span className="text-[6.5px] text-zinc-300 font-mono font-black uppercase tracking-wider leading-none">BEAT JUMP</span>
                  <div className="grid grid-cols-2 gap-0.5 w-full">
                    <button
                      onPointerDown={() => handleBeatJump(-16)}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono font-black cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6.5 text-[9.5px]"
                      )}
                      title="Beat Jump -4 Bars (-16 beats)"
                    >
                      -4B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(16)}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono font-black cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6.5 text-[9.5px]"
                      )}
                      title="Beat Jump +4 Bars (+16 beats)"
                    >
                      +4B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(-32)}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono font-black cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6.5 text-[9.5px]"
                      )}
                      title="Beat Jump -8 Bars (-32 beats)"
                    >
                      -8B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(32)}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono font-black cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6.5 text-[9.5px]"
                      )}
                      title="Beat Jump +8 Bars (+32 beats)"
                    >
                      +8B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(-64)}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono font-black cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6.5 text-[9.5px]"
                      )}
                      title="Beat Jump -16 Bars (-64 beats)"
                    >
                      -16B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(64)}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono font-black cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6.5 text-[9.5px]"
                      )}
                      title="Beat Jump +16 Bars (+64 beats)"
                    >
                      +16B
                    </button>
                  </div>

                  <span className="text-[6px] text-zinc-400 font-mono font-black uppercase tracking-wider leading-none mt-0.5">NUDGE</span>
                  <div className="grid grid-cols-2 gap-0.5 w-full">
                    <button
                      onPointerDown={handleGridNudgeLeft}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-zinc-600 flex items-center justify-center font-mono font-bold cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-4.5 text-[6.5px]" : "h-5.5 text-[8px]"
                      )}
                      title="Nudge Beatgrid Left (-10ms)"
                    >
                      -10ms
                    </button>
                    <button
                      onPointerDown={handleGridNudgeRight}
                      className={cn(
                        "rounded-none border border-zinc-800 bg-black text-zinc-300 hover:text-white hover:border-zinc-600 flex items-center justify-center font-mono font-bold cursor-pointer",
                        (cdjWidth < 380 || cdjHeight < 340) ? "h-4.5 text-[6.5px]" : "h-5.5 text-[8px]"
                      )}
                      title="Nudge Beatgrid Right (+10ms)"
                    >
                      +10ms
                    </button>
                  </div>

                  <button
                    onPointerDown={handleGridAlignCurrent}
                    className={cn(
                      "w-full rounded-none border border-amber-500/50 bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 active:bg-amber-800 flex items-center justify-center font-mono font-black cursor-pointer uppercase",
                      (cdjWidth < 380 || cdjHeight < 340) ? "h-5 text-[7.5px]" : "h-6 text-[8.5px]"
                    )}
                    title="Set Current Position as Beat 1 Downbeat"
                  >
                    BEAT 1
                  </button>
                </div>
              ) : cdjHeight >= 260 ? (
                /* Compact 2-Button Quick Jump for tight spaces */
                <div className="flex flex-col items-center gap-1 mb-auto border border-zinc-800 rounded-none p-1 bg-black select-none w-full">
                  <span className="text-[6px] text-zinc-300 font-mono font-black uppercase tracking-wider leading-none">JUMP</span>
                  <div className="grid grid-cols-2 gap-0.5 w-full">
                    <button
                      onPointerDown={() => handleBeatJump(-16)}
                      className="h-6 rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[8.5px] font-black cursor-pointer"
                      title="Beat Jump -4 Bars"
                    >
                      -4B
                    </button>
                    <button
                      onPointerDown={() => handleBeatJump(16)}
                      className="h-6 rounded-none border border-zinc-800 bg-black text-zinc-200 hover:text-white hover:border-primary active:bg-primary/40 flex items-center justify-center font-mono text-[8.5px] font-black cursor-pointer"
                      title="Beat Jump +4 Bars"
                    >
                      +4B
                    </button>
                  </div>
                  <button
                    onPointerDown={handleGridAlignCurrent}
                    className="w-full h-5.5 rounded-none border border-amber-500/50 bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 active:bg-amber-800 flex items-center justify-center font-mono text-[8px] font-black cursor-pointer uppercase"
                    title="Set Current Position as Beat 1 Downbeat"
                  >
                    BEAT 1
                  </button>
                </div>
              ) : null}

              {/* Transport Section (Orange CUE and Green PLAY) */}
              <div className={cn("flex flex-col mt-auto shrink-0", (cdjWidth < 380 || cdjHeight < 340) ? "gap-1.5 pt-0.5" : "gap-2 pt-1")}>
                
                {/* CUE Button */}
                <button
                  onPointerDown={handleCueDown}
                  onPointerUp={handleCueUp}
                  className={cn(
                    "rounded-full border-2 transition-all flex flex-col items-center justify-center font-mono cursor-pointer relative shrink-0",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-9 h-9 text-[8px] font-bold" : "w-13 h-13 text-[10.5px] font-black tracking-[0.1em]",
                    deck?.isCueStuttering
                      ? "border-amber-400 text-amber-400 bg-amber-950/40 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      : (!deck?.isPlaying && (deck?.progress || 0) > 0 && Math.abs((deck?.progress || 0) - (deck?.mainCue || 0)) < 0.05)
                        ? "border-amber-400 text-amber-400 bg-black shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                        : "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  <div className="absolute inset-1 rounded-full border border-dashed border-zinc-700/30" />
                  <span>CUE</span>
                </button>

                {/* PLAY Button */}
                <button
                  onClick={handlePlayPausePress}
                  className={cn(
                    "rounded-full border-2 transition-all flex flex-col items-center justify-center cursor-pointer relative shrink-0",
                    (cdjWidth < 380 || cdjHeight < 340) ? "w-9 h-9" : "w-13 h-13",
                    deck?.isPlaying
                      ? "border-green-500 text-green-400 bg-green-950/40 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                      : (!deck?.isPlaying && (deck?.progress || 0) > 0)
                        ? "border-green-500/80 text-green-400 bg-black animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  <div className="absolute inset-1 rounded-full border border-dashed border-zinc-700/30" />
                  {deck?.isPlaying ? (
                    <Pause className={cn("fill-current text-green-400", (cdjWidth < 380 || cdjHeight < 340) ? "w-3.5 h-3.5" : "w-5 h-5")} />
                  ) : (
                    <Play className={cn("fill-current text-zinc-400 hover:text-zinc-200", (cdjWidth < 380 || cdjHeight < 340) ? "w-3.5 h-3.5 ml-0.5" : "w-5 h-5 ml-0.5")} />
                  )}
                </button>
              </div>
            </div>

            {/* Center: Tactile Jog Wheel */}
            <div className="flex-grow flex items-center justify-center min-w-0 min-h-0 overflow-hidden">
              <JogWheelPlatter
                jogSize={jogSize}
                innerPlatterSize={innerPlatterSize}
                isCompact={cdjWidth < 380 || cdjHeight < 340}
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
                onScratchDelta={handleScratchDelta}
              />
            </div>
          </div>
        </div>

        {/* Right Side Column: Tall Tempo Slider and Buttons */}
        <div className={cn("flex flex-col justify-between shrink-0 select-none bg-black border border-zinc-900 rounded-none h-full overflow-hidden", (cdjWidth < 380 || cdjHeight < 340) ? "w-13 p-1 gap-1" : "w-18 md:w-20 p-1.5 gap-1.5")}>
          <div className="flex-grow min-h-0 w-full">
            <PitchFader
              pitch={deck?.pitch || 0}
              tempoRange={deck?.tempoRange || 10}
              isCompact={cdjWidth < 380 || cdjHeight < 340}
              isLocked={isLocked}
              themeColor={themeColor}
              onPitchChange={(targetPitch) => {
                setDeck(deckId, { pitch: targetPitch, syncEnabled: false });
              }}
              onRangeCycle={handleRangeCycle}
            />
          </div>

          {/* Pitch Bend Buttons (only when height permits) */}
          {cdjHeight >= 360 && (
            <div className="flex justify-between items-center gap-1 w-full shrink-0 select-none border-t border-zinc-800/40 pt-1">
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
                className="flex-1 h-6 text-[12px] font-mono font-black border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 active:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 cursor-pointer flex items-center justify-center select-none leading-none"
                title="Temporary Pitch Bend -"
              >
                -
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
                className="flex-1 h-6 text-[12px] font-mono font-black border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 active:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 cursor-pointer flex items-center justify-center select-none leading-none"
                title="Temporary Pitch Bend +"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

