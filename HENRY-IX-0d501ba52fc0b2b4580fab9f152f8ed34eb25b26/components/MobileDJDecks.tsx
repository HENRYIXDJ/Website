'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Disc, Sliders, Volume2, Music, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/audioStore';
import { useAudio } from '@/components/AudioProvider';
import { playClick, playTick } from '@/lib/audioUtils';
import { formatTime, formatPlayheadTime, getSessionImage } from '@/lib/mixes';
import { SingleDeckWaveform } from './SingleDeckWaveform';
import { RotaryKnob } from './DJComponents';

interface MobileDJDecksProps {
  isDepth?: boolean;
  onOpenTracklist: (deckId: 1 | 2) => void;
  onOpenMIDI: () => void;
  onConnectUsb: () => void;
}

export function MobileDJDecks({
  isDepth = true,
  onOpenTracklist,
  onOpenMIDI,
  onConnectUsb,
}: MobileDJDecksProps) {
  const decks = useAudioStore(s => s.decks);
  const setDeck = useAudioStore(s => s.setDeck);
  const setDecks = useAudioStore(s => s.setDecks);
  const crossfader = useAudioStore(s => s.crossfader);
  const setCrossfader = useAudioStore(s => s.setCrossfader);

  const { togglePlayGlobal, playLockoutBlip } = useAudio();

  // Mobile Focus State: 1 = Deck 1 Focus, 'dual' = Dual Split, 2 = Deck 2 Focus
  const [mobileFocus, setMobileFocus] = useState<1 | 'dual' | 2>('dual');
  const [showEqDrawer, setShowEqDrawer] = useState(false);

  const deck1 = decks[1] || {};
  const deck2 = decks[2] || {};

  const handleHotCuePress = (deckId: 1 | 2, pad: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') => {
    const deck = decks[deckId];
    if (!deck) return;
    const cueTime = deck.hotCues?.[pad];
    if (cueTime !== null && cueTime !== undefined) {
      playClick(900, 'sine', 0.02);
      useAudioStore.getState().setDeck(deckId, { progress: cueTime, isPlaying: true });
      const audio = useAudioStore.getState().decks[deckId];
    } else {
      playClick(600, 'sine', 0.02);
      const currentTime = deck.progress || 0;
      const updatedHotCues = { ...(deck.hotCues || {}), [pad]: currentTime };
      useAudioStore.getState().setDeck(deckId, { hotCues: updatedHotCues });
    }
  };

  const getThemeColor = (id: number) => (id === 1 ? '#d8163f' : '#22d3ee');

  return (
    <div className="w-full flex flex-col h-full bg-black font-mono text-white select-none overflow-hidden pb-2">
      
      {/* 1. TOP MOBILE HEADER & MODE SELECTOR */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-black border-b border-zinc-900 shrink-0">
        {/* Brand & Status */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black tracking-widest text-primary uppercase">HENRY IX // MOBILE</span>
        </div>

        {/* Mobile Deck View Segment (DECK 1 | DUAL | DECK 2) */}
        <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-none p-0.5 text-[8px] font-bold">
          <button
            onClick={() => {
              setMobileFocus(1);
              playClick(800, 'sine', 0.02);
            }}
            className={cn(
              "px-2 py-1 transition-all cursor-pointer",
              mobileFocus === 1 ? "bg-[#d8163f] text-black font-black" : "text-zinc-500"
            )}
          >
            DECK 1
          </button>
          <button
            onClick={() => {
              setMobileFocus('dual');
              playClick(800, 'sine', 0.02);
            }}
            className={cn(
              "px-2 py-1 transition-all cursor-pointer",
              mobileFocus === 'dual' ? "bg-primary text-black font-black" : "text-zinc-500"
            )}
          >
            DUAL
          </button>
          <button
            onClick={() => {
              setMobileFocus(2);
              playClick(800, 'sine', 0.02);
            }}
            className={cn(
              "px-2 py-1 transition-all cursor-pointer",
              mobileFocus === 2 ? "bg-[#22d3ee] text-black font-black" : "text-zinc-500"
            )}
          >
            DECK 2
          </button>
        </div>

        {/* Quick Toolbar Triggers */}
        <div className="flex items-center gap-1">
          <button
            onClick={onConnectUsb}
            className="p-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-300 hover:text-white"
            title="Connect USB"
          >
            💾
          </button>
          <button
            onClick={() => setShowEqDrawer(!showEqDrawer)}
            className={cn(
              "p-1 border rounded text-[9px] transition-all",
              showEqDrawer ? "bg-primary/20 border-primary text-primary" : "bg-zinc-900 border-zinc-800 text-zinc-400"
            )}
            title="Toggle EQ Mixer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. STACKED WAVEFORMS (Always visible for phrase matching) */}
      <div className="w-full flex flex-col bg-zinc-950/90 border-b border-zinc-900 px-2 py-1 shrink-0 gap-1">
        {/* Deck 1 Waveform */}
        {(mobileFocus === 1 || mobileFocus === 'dual') && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[7.5px] font-bold text-zinc-400">
              <span className="text-[#d8163f] truncate max-w-[160px]">1 // {deck1.title || 'NO TRACK'}</span>
              <span>-{formatPlayheadTime(Math.max(0, (deck1.duration || 0) - (deck1.progress || 0)))}</span>
            </div>
            <div className="w-full h-8 bg-black rounded overflow-hidden border border-zinc-900 relative">
              <SingleDeckWaveform deckId={1} deck={deck1} isDepth={isDepth} />
            </div>
          </div>
        )}

        {/* Deck 2 Waveform */}
        {(mobileFocus === 2 || mobileFocus === 'dual') && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[7.5px] font-bold text-zinc-400">
              <span className="text-[#22d3ee] truncate max-w-[160px]">2 // {deck2.title || 'NO TRACK'}</span>
              <span>-{formatPlayheadTime(Math.max(0, (deck2.duration || 0) - (deck2.progress || 0)))}</span>
            </div>
            <div className="w-full h-8 bg-black rounded overflow-hidden border border-zinc-900 relative">
              <SingleDeckWaveform deckId={2} deck={deck2} isDepth={isDepth} />
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN MOBILE DECKS CONTROLLER BODY */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-2 gap-3">
        
        {/* SINGLE DECK FOCUSED VIEW (Enlarged Platters, Pitch, Loop & Pads) */}
        {mobileFocus !== 'dual' && (
          <div className="flex flex-col gap-3 h-full">
            {(() => {
              const activeId = mobileFocus as 1 | 2;
              const deck = decks[activeId] || {};
              const color = getThemeColor(activeId);

              return (
                <div className="flex flex-col gap-3 h-full">
                  {/* Track Header & Browser Trigger */}
                  <button
                    onClick={() => onOpenTracklist(activeId)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 flex items-center justify-between rounded text-left active:scale-[0.99] transition-transform"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[7.5px] text-zinc-500 uppercase tracking-wider font-bold">SELECT TRACK (DECK {activeId})</span>
                      <span className="text-xs font-bold text-white truncate uppercase">{deck.title || 'TAP TO BROWSE TRACKS'}</span>
                    </div>
                    <Music className="w-4 h-4 text-zinc-500 shrink-0" />
                  </button>

                  {/* Platter & Pitch Fader Section */}
                  <div className="grid grid-cols-[1fr_80px] gap-3 items-center justify-center py-2 bg-black border border-zinc-900/80 rounded p-2">
                    {/* Big Touch Platter */}
                    <div className="flex flex-col items-center justify-center relative">
                      <div
                        onClick={() => onOpenTracklist(activeId)}
                        className="relative rounded-full aspect-square border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl cursor-pointer"
                        style={{ width: '150px', height: '150px' }}
                      >
                        <div className="absolute inset-3 border border-dashed border-zinc-900 rounded-full pointer-events-none" />
                        <div 
                          className="absolute top-0 w-1 h-4 pointer-events-none z-20"
                          style={{ backgroundColor: color }}
                        />
                        <div 
                          className={cn(
                            "rounded-full border border-black overflow-hidden relative shadow-inner bg-cover bg-center select-none pointer-events-none z-10 flex items-center justify-center",
                            deck.isPlaying && "animate-[spin_1.8s_linear_infinite]"
                          )}
                          style={{
                            width: '80px',
                            height: '80px',
                            backgroundImage: `url(${getSessionImage(deck.title, deck.artworkUrl)})`
                          }}
                        >
                          <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800 z-10" />
                        </div>
                      </div>
                      <span className="text-[8px] text-zinc-500 mt-1 font-bold">TAP PLATTER FOR TRACKS</span>
                    </div>

                    {/* Touch Pitch Slider & BPM Readout */}
                    <div className="flex flex-col items-center justify-between h-full py-1 bg-zinc-950 border border-zinc-900 rounded p-1.5">
                      <div className="text-center font-bold">
                        <div className="text-[6.5px] text-zinc-500 uppercase">BPM</div>
                        <div className="text-sm font-black text-white">{((deck.bpm || 120) * (1 + (deck.pitch || 0) / 100)).toFixed(1)}</div>
                        <div className="text-[7px] text-emerald-400 font-mono">
                          {deck.pitch >= 0 ? `+${(deck.pitch || 0).toFixed(1)}%` : `${(deck.pitch || 0).toFixed(1)}%`}
                        </div>
                      </div>

                      {/* Pitch Touch Range */}
                      <input 
                        type="range"
                        min="-8"
                        max="8"
                        step="0.1"
                        value={-(deck.pitch || 0)}
                        onChange={(e) => setDeck(activeId, { pitch: -parseFloat(e.target.value) })}
                        className="w-full h-20 accent-primary cursor-pointer"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      />
                      
                      <button
                        onClick={() => setDeck(activeId, { pitch: 0 })}
                        className="text-[6.5px] text-zinc-400 hover:text-white uppercase font-bold border border-zinc-800 px-1 py-0.5 rounded mt-1"
                      >
                        RESET
                      </button>
                    </div>
                  </div>

                  {/* Hot Cue Pads (A-D) Large Touch Targets */}
                  <div className="flex flex-col gap-1 bg-black border border-zinc-900 rounded p-2">
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider">HOT CUES (A-D)</span>
                    <div className="grid grid-cols-4 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map(pad => {
                        const hasCue = deck.hotCues?.[pad] !== null && deck.hotCues?.[pad] !== undefined;
                        return (
                          <button
                            key={pad}
                            onClick={() => handleHotCuePress(activeId, pad)}
                            className={cn(
                              "h-11 rounded border font-bold text-xs uppercase flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform",
                              hasCue
                                ? "bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                : "bg-zinc-950 border-zinc-900 text-zinc-600"
                            )}
                          >
                            <span>{pad}</span>
                            {hasCue && <span className="text-[6px] text-zinc-400">{deck.hotCues[pad]!.toFixed(1)}s</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Play / Cue Transport Control Buttons (44px min touch target) */}
                  <div className="grid grid-cols-3 gap-2 mt-auto">
                    <button
                      onClick={() => {
                        playClick(900, 'sine', 0.02);
                        setDeck(activeId, { progress: 0, isPlaying: false });
                      }}
                      className="h-12 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-xs font-black tracking-widest uppercase cursor-pointer active:scale-95 transition-transform text-amber-400"
                    >
                      CUE
                    </button>

                    <button
                      onClick={() => togglePlayGlobal(activeId)}
                      className={cn(
                        "h-12 rounded text-xs font-black tracking-widest uppercase cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-lg",
                        deck.isPlaying ? "bg-emerald-500 text-black shadow-emerald-500/20" : "bg-primary text-black shadow-primary/20"
                      )}
                    >
                      {deck.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      <span>{deck.isPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>

                    <button
                      onClick={() => {
                        playClick(800, 'sine', 0.02);
                        const active = deck.isLoopActive;
                        setDeck(activeId, {
                          isLoopActive: !active,
                          loopIn: !active ? deck.progress : null,
                          loopOut: !active ? (deck.progress || 0) + 4 * (60 / (deck.bpm || 120)) : null
                        });
                      }}
                      className={cn(
                        "h-12 rounded border text-xs font-black tracking-widest uppercase cursor-pointer active:scale-95 transition-transform",
                        deck.isLoopActive ? "bg-amber-950 border-amber-500 text-amber-400" : "bg-zinc-950 border-zinc-900 text-zinc-400"
                      )}
                    >
                      4B LOOP
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* DUAL DECK SIDE-BY-SIDE MIXING VIEW */}
        {mobileFocus === 'dual' && (
          <div className="flex flex-col gap-3">
            {/* Dual Platters Row */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((id) => {
                const deckId = id as 1 | 2;
                const deck = decks[deckId] || {};
                const color = getThemeColor(deckId);

                return (
                  <div key={deckId} className="flex flex-col items-center bg-zinc-950 border border-zinc-900 rounded p-2 gap-2">
                    <div className="flex justify-between items-center w-full text-[8px] font-bold">
                      <span style={{ color }}>DECK {deckId}</span>
                      <span className="text-white font-mono">{((deck.bpm || 120) * (1 + (deck.pitch || 0) / 100)).toFixed(1)} BPM</span>
                    </div>

                    {/* Platter */}
                    <div
                      onClick={() => onOpenTracklist(deckId)}
                      className="relative rounded-full aspect-square border border-zinc-800 bg-black flex items-center justify-center cursor-pointer my-1"
                      style={{ width: '100px', height: '100px' }}
                    >
                      <div className="absolute top-0 w-0.5 h-3 pointer-events-none" style={{ backgroundColor: color }} />
                      <div
                        className={cn(
                          "rounded-full border border-black overflow-hidden relative shadow-inner bg-cover bg-center select-none pointer-events-none z-10 flex items-center justify-center",
                          deck.isPlaying && "animate-[spin_1.8s_linear_infinite]"
                        )}
                        style={{
                          width: '56px',
                          height: '56px',
                          backgroundImage: `url(${getSessionImage(deck.title, deck.artworkUrl)})`
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-black border border-zinc-800" />
                      </div>
                    </div>

                    {/* Transport Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      <button
                        onClick={() => {
                          playClick(900, 'sine', 0.02);
                          setDeck(deckId, { progress: 0, isPlaying: false });
                        }}
                        className="h-10 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-amber-400 uppercase active:scale-95"
                      >
                        CUE
                      </button>

                      <button
                        onClick={() => togglePlayGlobal(deckId)}
                        className={cn(
                          "h-10 rounded text-[9px] font-black uppercase flex items-center justify-center gap-1 active:scale-95",
                          deck.isPlaying ? "bg-emerald-500 text-black" : "bg-primary text-black"
                        )}
                      >
                        {deck.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{deck.isPlaying ? 'PAUSE' : 'PLAY'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. EXPANDABLE EQ & MIXER DRAWER */}
      <AnimatePresence>
        {showEqDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-black border-t border-zinc-900 p-3 flex flex-col gap-3 shrink-0 font-mono"
          >
            <div className="flex justify-between items-center text-[8px] text-zinc-500 font-bold uppercase border-b border-zinc-900 pb-1">
              <span>3-BAND EQ & GAIN TRIM</span>
              <button onClick={() => setShowEqDrawer(false)} className="text-zinc-400 hover:text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((id) => {
                const deckId = id as 1 | 2;
                const deck = decks[deckId] || {};
                const color = getThemeColor(deckId);

                return (
                  <div key={deckId} className="flex flex-col gap-2 items-center bg-zinc-950 border border-zinc-900 p-2 rounded">
                    <span className="text-[8px] font-bold" style={{ color }}>DECK {deckId} EQ</span>
                    <div className="flex justify-between w-full">
                      <RotaryKnob
                        label="HI"
                        value={deck.highEq || 0}
                        min={-12}
                        max={12}
                        onChange={(val) => setDeck(deckId, { highEq: val })}
                      />
                      <RotaryKnob
                        label="MID"
                        value={deck.midEq || 0}
                        min={-12}
                        max={12}
                        onChange={(val) => setDeck(deckId, { midEq: val })}
                      />
                      <RotaryKnob
                        label="LOW"
                        value={deck.lowEq || 0}
                        min={-12}
                        max={12}
                        onChange={(val) => setDeck(deckId, { lowEq: val })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. STICKY BOTTOM CROSSFADER BAR */}
      <div className="w-full bg-zinc-950 border-t border-zinc-900 px-4 py-2 flex flex-col gap-1 shrink-0 font-mono select-none">
        <div className="flex justify-between text-[7px] text-zinc-500 font-bold uppercase">
          <span className="text-[#d8163f]">CH 1</span>
          <span>CROSSFADER</span>
          <span className="text-[#22d3ee]">CH 2</span>
        </div>

        <input 
          type="range"
          min="-1"
          max="1"
          step="0.02"
          value={crossfader}
          onChange={(e) => setCrossfader(parseFloat(e.target.value))}
          className="w-full h-3 accent-primary bg-black border border-zinc-900 rounded appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

export default MobileDJDecks;
