'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { useAudio } from '@/components/AudioProvider';
import { playClick } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';
import { getStorageUrl } from '@/lib/storage';
import { Play, Pause, RotateCcw, X, Anchor } from 'lucide-react';

const proxyUrl = (url: string) => `/api/assets?url=${encodeURIComponent(url)}`;

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

  // Symmetrical theme color accent based on Pioneer deck indices
  const themeColor = 
    deckId === 1 ? 'rgba(211,15,49,1)' : // D1: Red
    deckId === 2 ? 'rgba(34,211,238,1)' : // D2: Cyan
    deckId === 3 ? 'rgba(16,185,129,1)' : // D3: Emerald/Green
    'rgba(234,179,8,1)';                  // D4: Gold/Yellow

  const audio = audioElementsRef?.current?.[deckId];

  // --- Hot Cue Delete Mode State ---
  const [deleteMode, setDeleteMode] = useState(false);

  // --- Simulated Long Press for 4-Beat Loop ---
  const loopInTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const mainCueTime = deck.mainCue || 0;
    const currentProgress = deck.progress || 0;

    if (deck.isPlaying) {
      // 1. If playing: stop, seek back to cue point, pause
      audioEl.pause();
      seekLocalBuffer(deckId, mainCueTime);
      setDeck(deckId, { isPlaying: false, isCueStuttering: false });
    } else {
      // 2. If paused:
      if (Math.abs(currentProgress - mainCueTime) > 0.08) {
        // Paused at a non-cue point: set new cue point
        setDeck(deckId, { mainCue: currentProgress });
      } else {
        // Paused exactly at cue point: start cue stutter (play while held)
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
      // Save Hot Cue: record current playhead position
      playClick(880, 'sine', 0.02); // high beep
      setDeck(deckId, {
        hotCues: {
          ...deck.hotCues,
          [pad]: currentProgress
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

    // Setup 4-beat simulated long press: 500ms
    loopInTimerRef.current = setTimeout(() => {
      // LONG PRESS: Auto-calculate 4 beats loop based on BPM
      playClick(1050, 'sine', 0.04);
      const beatDuration = 60 / (deck.bpm || 120);
      const loopOutTime = currentProgress + (beatDuration * 4);
      setDeck(deckId, { 
        loopIn: currentProgress, 
        loopOut: loopOutTime, 
        isLoopActive: true 
      });
      loopInTimerRef.current = null;
    }, 500);

    // SHORT PRESS DEFAULT (until/unless timer fires): Set loopIn
    setDeck(deckId, { loopIn: currentProgress });
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
    const otherDeckId = (deckId === 1 || deckId === 2) ? rightActiveDeck : leftActiveDeck;
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

  // --- Jog Wheel Event Handler Stubs for Scratching / Pitch Bend ---
  const handlePlatterDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;
    
    // Scratch logic starts here:
    // 1. Capture absolute coordinate centers of platter.
    // 2. Set scratching state ref to true to freeze playback rates.
    console.log(`[JOG WHEEL DECK ${deckId}] Platter Down. Mode: ${deck.jogMode}. Scratching started.`);
  };

  const handlePlatterMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;

    // Pitch bend / scratch calculations based on radius/rotation speed:
    // 1. If Vinyl mode: calculate angular delta and seek playhead.
    // 2. If CDJ mode: apply angular delta as temporary playbackRate modification.
  };

  const handlePlatterUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLocked) return;

    // Scratch logic ends:
    // 1. Set scratching state ref to false.
    // 2. Snap playback rates back to pitch slider levels.
    console.log(`[JOG WHEEL DECK ${deckId}] Platter Up. Scratching completed.`);
  };

  const handleRimDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(`[JOG WHEEL DECK ${deckId}] Outer Rim Down. Pitch bend activated.`);
  };

  const handleRimMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Pitch bending (nudge) modifies playbackRate by +/-0.05 temporarily
  };

  const handleRimUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(`[JOG WHEEL DECK ${deckId}] Outer Rim Up. Pitch bend released.`);
  };

  // --- Session Artwork and Spinning calculations ---
  const getSessionImage = (title: string) => {
    if (!title) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
    if (title.includes('Knight Club') && title.includes('Session 1')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
    if (title.includes('Knight Club') && title.includes('Session 2')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%202.jpg'));
    if (title.includes('Knight Club') && title.includes('Session 3')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%203.jpg'));
    if (title.includes('Knight Club') && title.includes('Session 4')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%204.jpg'));
    return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
  };

  const sessionImg = getSessionImage(deck?.title || '');

  return (
    <div className="w-full h-full flex flex-col justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] relative select-none">
      
      {/* 1. RGB Hot Cues Row (A-H) */}
      <div className="w-full flex items-center justify-between gap-1.5 border-b border-zinc-800 pb-2">
        <div className="grid grid-cols-8 gap-1.5 flex-grow">
          {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map(pad => {
            const hasCue = deck?.hotCues?.[pad] !== null && deck?.hotCues?.[pad] !== undefined;
            
            // Neon RGB coloring matching Pioneer hot cues
            const padColors = 
              pad === 'A' ? 'shadow-[0_0_10px_rgba(239,68,68,0.4)] border-red-500/60 text-red-400 bg-red-950/40 hover:bg-red-950/60' :
              pad === 'B' ? 'shadow-[0_0_10px_rgba(249,115,22,0.4)] border-orange-500/60 text-orange-400 bg-orange-950/40 hover:bg-orange-950/60' :
              pad === 'C' ? 'shadow-[0_0_10px_rgba(234,179,8,0.4)] border-yellow-500/60 text-yellow-400 bg-yellow-950/40 hover:bg-yellow-950/60' :
              pad === 'D' ? 'shadow-[0_0_10px_rgba(34,197,94,0.4)] border-green-500/60 text-green-400 bg-green-950/40 hover:bg-green-950/60' :
              pad === 'E' ? 'shadow-[0_0_10px_rgba(6,182,212,0.4)] border-cyan-500/60 text-cyan-400 bg-cyan-950/40 hover:bg-cyan-950/60' :
              pad === 'F' ? 'shadow-[0_0_10px_rgba(59,130,246,0.4)] border-blue-500/60 text-blue-400 bg-blue-950/40 hover:bg-blue-950/60' :
              pad === 'G' ? 'shadow-[0_0_10px_rgba(168,85,247,0.4)] border-purple-500/60 text-purple-400 bg-purple-950/40 hover:bg-purple-950/60' :
              'shadow-[0_0_10px_rgba(236,72,153,0.4)] border-pink-500/60 text-pink-400 bg-pink-950/40 hover:bg-pink-950/60';

            return (
              <button
                key={pad}
                onPointerDown={() => handleHotCuePress(pad)}
                className={cn(
                  "h-7 rounded text-[9.5px] font-mono tracking-widest font-black uppercase border transition-all cursor-pointer flex items-center justify-center relative",
                  hasCue 
                    ? padColors
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
                )}
              >
                {pad}
                {hasCue && (
                  <span className="absolute bottom-0.5 right-1 text-[5px] text-zinc-500 font-mono">
                    {deck.hotCues[pad]!.toFixed(1)}s
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Hot Cue Delete Trigger */}
        <button
          onPointerDown={() => {
            playClick(440, 'sine', 0.05);
            setDeleteMode(!deleteMode);
          }}
          className={cn(
            "px-2.5 h-7 rounded text-[7.5px] font-mono tracking-[0.2em] font-black uppercase border cursor-pointer leading-none shrink-0 transition-all",
            deleteMode 
              ? "bg-red-500 border-red-400 text-black shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse" 
              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
          )}
        >
          DELETE
        </button>
      </div>

      {/* 2. Main Hardware Panel */}
      <div className="w-full flex items-stretch justify-between gap-3 relative">
        
        {/* Left Side: Loop Panel & Main Controls */}
        <div className="flex flex-col justify-between w-20 shrink-0">
          
          {/* Looping Controls */}
          <div className="flex flex-col gap-1.5 border-b border-zinc-800/50 pb-2">
            <span className="text-[5.5px] text-zinc-600 font-mono tracking-widest font-bold uppercase w-full">LOOPING</span>
            
            {/* IN / -4 BEAT */}
            <div className="flex flex-col gap-0.5">
              <button
                onPointerDown={handleLoopInDown}
                onPointerUp={handleLoopInUp}
                className={cn(
                  "h-7 rounded-md font-mono text-[7px] font-black tracking-widest border transition-all cursor-pointer leading-none uppercase flex flex-col items-center justify-center",
                  deck?.loopIn !== null && deck?.loopIn !== undefined
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                <span>IN</span>
                <span className="text-[5px] text-zinc-600 font-normal mt-0.5">-4 BEAT</span>
              </button>
            </div>

            {/* OUT */}
            <button
              onPointerDown={handleLoopOutPress}
              className={cn(
                "h-7 rounded-md font-mono text-[7px] font-black tracking-widest border transition-all cursor-pointer uppercase flex items-center justify-center",
                deck?.loopOut !== null && deck?.loopOut !== undefined
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              OUT
            </button>

            {/* RELOOP / EXIT */}
            <button
              onPointerDown={handleReloopExitPress}
              className={cn(
                "h-7 rounded-md font-mono text-[7px] font-black tracking-widest border transition-all cursor-pointer uppercase flex items-center justify-center",
                deck?.isLoopActive
                  ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              RELOOP
            </button>
          </div>

          {/* Transport Section (Orange CUE and Green PLAY) */}
          <div className="flex flex-col gap-2 mt-auto pt-2">
            
            {/* CUE Button */}
            <button
              onPointerDown={handleCueDown}
              onPointerUp={handleCueUp}
              className={cn(
                "w-12 h-12 rounded-full border-2 border-zinc-950 bg-gradient-to-b from-zinc-800 to-zinc-950 active:from-zinc-900 active:to-zinc-950 flex flex-col items-center justify-center font-mono text-[8px] font-black tracking-[0.1em] cursor-pointer relative shadow-lg shrink-0",
                deck?.isCueStuttering || (!deck?.isPlaying && (deck?.progress || 0) > 0 && Math.abs((deck?.progress || 0) - (deck?.mainCue || 0)) < 0.05)
                  ? "border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
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
                "w-12 h-12 rounded-full border-2 border-zinc-950 bg-gradient-to-b from-zinc-800 to-zinc-950 active:from-zinc-900 active:to-zinc-950 flex flex-col items-center justify-center cursor-pointer relative shadow-lg shrink-0",
                deck?.isPlaying
                  ? "border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div className="absolute inset-1 rounded-full border border-dashed border-zinc-700/20" />
              {deck?.isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-green-400" />
              ) : (
                <Play className="w-4 h-4 fill-current text-zinc-500 hover:text-zinc-300 ml-0.5" />
              )}
            </button>

          </div>

        </div>

        {/* Center: Tactile Jog Wheel */}
        <div className="flex-grow flex items-center justify-center relative select-none">
          
          {/* SKEUOMORPHIC JOG WHEEL */}
          <div 
            onPointerDown={handleRimDown}
            onPointerMove={handleRimMove}
            onPointerUp={handleRimUp}
            className="w-36 h-36 rounded-full border-4 border-zinc-950 bg-zinc-950 flex items-center justify-center cursor-pointer relative shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
            style={{
              backgroundImage: 'radial-gradient(circle, #27272a 35%, #18181b 36%, #18181b 50%, #09090b 51%, #09090b 70%, #27272a 71%)'
            }}
          >
            {/* Grooves & Position Stripes */}
            <div className="absolute inset-3 border border-dashed border-zinc-900/40 rounded-full pointer-events-none" />
            <div className="absolute inset-7 border border-zinc-900/20 rounded-full pointer-events-none" />
            <div className="absolute inset-11 border border-dashed border-zinc-900/40 rounded-full pointer-events-none" />

            {/* Platter Marker Needle Ring */}
            <div 
              className="absolute top-0 w-0.5 h-4 pointer-events-none z-20 transition-colors duration-300"
              style={{ backgroundColor: deck?.isPlaying ? themeColor : 'rgb(244, 63, 94)' }}
            />

            {/* Inner Platter (Spinning artwork in vinyl mode) */}
            <div 
              onPointerDown={handlePlatterDown}
              onPointerMove={handlePlatterMove}
              onPointerUp={handlePlatterUp}
              className={cn(
                "w-20 h-20 rounded-full border border-black overflow-hidden relative shadow-inner bg-cover bg-center select-none pointer-events-none z-10 flex items-center justify-center",
                (deck?.isPlaying && !deck?.isCueStuttering) && "animate-[spin_1.8s_linear_infinite]" // 33.3 RPM
              )}
              style={{ backgroundImage: `url(${sessionImg})` }}
            >
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/30" />
              
              {/* Center Spindle Hole */}
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-800 shadow z-10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-zinc-900" />
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Speed, Pitch Slider, Mode Buttons */}
        <div className="flex flex-col justify-between w-20 shrink-0 select-none">
          
          {/* Pitch Info & MT Toggle */}
          <div className="flex flex-col gap-1 pb-1 border-b border-zinc-800/50">
            <div className="flex items-center justify-between text-[5.5px] font-mono text-zinc-600 font-bold uppercase tracking-wider">
              <span>RATE</span>
              <span className="text-zinc-400 font-mono">
                {deck?.pitch >= 0 ? `+${(deck?.pitch || 0).toFixed(2)}%` : `${(deck?.pitch || 0).toFixed(2)}%`}
              </span>
            </div>
            
            {/* Master Tempo (MT Keylock) */}
            <button
              onPointerDown={handleMasterTempoPress}
              className={cn(
                "h-5 rounded text-[7.5px] font-mono font-black tracking-widest uppercase border transition-colors cursor-pointer leading-none w-full",
                deck?.masterTempo
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              MT
            </button>
          </div>

          {/* Inverted CDJ Pitch Fader */}
          <div className="relative w-full h-[120px] bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-center shadow-inner border-b-2 my-2" style={{ borderBottomColor: themeColor }}>
            
            {/* Pitch detent center tick LED */}
            <div 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 right-1.5 w-1.5 h-1.5 rounded-full z-10 transition-colors duration-300 shadow-[0_0_6px_rgba(34,211,238,0.4)]",
                deck?.pitch === 0 ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-zinc-800"
              )}
            />

            {/* Slider Scale Line */}
            <div className="w-[1px] h-[100px] bg-zinc-800 pointer-events-none" />

            {/* Physical Handle position based on math (UP decreases tempo (-), DOWN increases tempo (+)) */}
            <div 
              className="absolute w-5 h-8 bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 rounded shadow flex items-center justify-center cursor-ns-resize pointer-events-none"
              style={{
                // Mapping: -8% (top) -> 8% (bottom)
                // Offset math: top: calc(6px + (1 - (pitch + 8)/16) * 80px)
                top: `calc(6px + ${(1 - ((deck?.pitch || 0) + 8) / 16) * 80}px)`
              }}
            >
              <div className="w-4 h-[1px]" style={{ backgroundColor: themeColor }} />
            </div>

            {/* Overlaid invisible fader input */}
            <input 
              type="range"
              min="-8"
              max="8"
              step="0.02"
              value={-(deck?.pitch || 0)} // Invert UI logic for HTML element
              onChange={(e) => {
                if (isLocked) return;
                const rawVal = parseFloat(e.target.value);
                const targetPitch = -rawVal; // Re-invert to get actual percent value
                setDeck(deckId, { pitch: targetPitch, syncEnabled: false });
                if (Math.abs(targetPitch) < 0.1) {
                  playClick(880, 'sine', 0.004);
                }
              }}
              title="Adjust Pitch Slider"
              className="absolute inset-0 opacity-0 cursor-ns-resize z-20 w-full h-full [writing-mode:bt-lr] direction-rtl"
            />
          </div>

          {/* Symmetrical Sync/Master Mode Panel */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-zinc-800/50 mt-auto">
            
            {/* Sync Mode */}
            <button
              onPointerDown={handleSyncPress}
              className={cn(
                "h-6 rounded text-[6.5px] font-mono tracking-widest font-black uppercase border transition-colors cursor-pointer flex flex-col justify-center items-center leading-none",
                deck?.syncEnabled
                  ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              SYNC
            </button>

            {/* Master Mode */}
            <button
              onPointerDown={handleMasterPress}
              className={cn(
                "h-6 rounded text-[6.5px] font-mono tracking-widest font-black uppercase border transition-colors cursor-pointer flex flex-col justify-center items-center leading-none",
                deck?.isMaster
                  ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              MSTR
            </button>
          </div>

          {/* Jog Mode Mode */}
          <button
            onPointerDown={handleJogModePress}
            className={cn(
              "h-5 mt-1.5 rounded text-[7.5px] font-mono font-black tracking-widest uppercase border transition-colors cursor-pointer leading-none w-full",
              deck?.jogMode === 'VINYL'
                ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            )}
          >
            {deck?.jogMode}
          </button>

        </div>

      </div>

      {/* 3. Hardware Premium LCD Panel Display */}
      <div className="w-full bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 font-mono text-[9px] shadow-inner flex flex-col gap-1 select-none shrink-0 border-l-2" style={{ borderLeftColor: themeColor }}>
        
        {/* LCD Status Indicators */}
        <div className="flex items-center justify-between text-zinc-500 text-[6.5px] tracking-widest border-b border-zinc-900 pb-1 uppercase font-black">
          <span>DECK_{deckId} STATE LOG</span>
          <span style={{ color: isLocked ? 'rgb(234,179,8)' : deck?.isPlaying ? themeColor : 'rgb(113,113,122)' }}>
            {isLocked ? "ACCESS_LOCKED" : deck?.isPlaying ? "● PLAYING" : "■ PAUSED"}
          </span>
        </div>

        {/* Current loaded track metadata */}
        <div className="flex flex-col mt-0.5">
          <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-black mb-0.5">TRACK NAME</span>
          <span className="font-black truncate tracking-wider text-zinc-300 font-mono uppercase">
            {isLocked ? "LOCKED DECK (PREVIEW ONLY)" : deck?.title || "NO TRACK LOADED"}
          </span>
        </div>

        {/* Tempo, Playhead and Sync values */}
        <div className="grid grid-cols-3 gap-2 mt-1.5 border-t border-zinc-900/50 pt-1.5 select-none">
          <div className="flex flex-col">
            <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold">SPEED</span>
            <span className="font-bold text-zinc-400">
              {isLocked ? "130.00 BPM" : `${(deck?.bpm * (1 + (deck?.pitch || 0) / 100)).toFixed(2)} BPM`}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold">PLAYHEAD</span>
            <span className="font-bold text-zinc-400 font-mono">
              {isLocked ? "LOCKED" : `${(deck?.progress || 0).toFixed(2)}s`}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold">SYNC STATUS</span>
            <span className={cn(
              "font-black text-mono tracking-wide uppercase transition-colors duration-300",
              deck?.syncEnabled ? "text-emerald-400" : "text-zinc-600"
            )}>
              {deck?.syncEnabled ? "SYNCED" : "OFF"}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
