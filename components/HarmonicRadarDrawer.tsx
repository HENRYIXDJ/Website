'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/audioStore';
import { playClick } from '@/lib/audioUtils';
import { detectCamelotKey } from '@/lib/proTrackAnalysis';

interface HarmonicRadarDrawerProps {
  mixGroups: any[];
  onLoadTrack: (track: any, targetDeckId: number) => void;
  targetDeckId: number;
}

type FlowCategory = 'ALL' | 'BLEND' | 'BOOST' | 'DEEP' | 'MODULATE';

export function HarmonicRadarDrawer({
  mixGroups,
  onLoadTrack,
  targetDeckId,
}: HarmonicRadarDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FlowCategory>('ALL');

  const decks = useAudioStore(s => s.decks);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const currentMasterDeck = decks[leftActiveDeck] || decks[1];
  const activeBpm = (currentMasterDeck?.bpm || 124) * (1 + (currentMasterDeck?.pitch || 0) / 100);
  const currentKey = detectCamelotKey(currentMasterDeck?.title || 'Track', activeBpm);

  // Flatten all tracks
  const allTracks = useMemo(() => {
    const list: any[] = [];
    mixGroups.forEach(group => {
      group.mixes?.forEach((m: any) => {
        if (!list.some(existing => existing.id === m.id)) {
          const keyInfo = detectCamelotKey(m.title, m.bpm || 124);
          list.push({ ...m, groupTitle: group.title, keyInfo });
        }
      });
    });
    return list;
  }, [mixGroups]);

  // Classify tracks relative to currentKey
  const categorizedTracks = useMemo(() => {
    const currentNum = parseInt(currentKey.code);
    const currentLetter = currentKey.code.slice(-1);

    const boostNum = currentNum === 12 ? 1 : currentNum + 1;
    const deepNum = currentNum === 1 ? 12 : currentNum - 1;
    const modulateNum = currentNum >= 11 ? currentNum - 10 : currentNum + 2;

    const blendCodeSame = `${currentNum}${currentLetter}`;
    const blendCodeRel = `${currentNum}${currentLetter === 'A' ? 'B' : 'A'}`;
    const boostCode = `${boostNum}${currentLetter}`;
    const deepCode = `${deepNum}${currentLetter}`;
    const modulateCode = `${modulateNum}${currentLetter}`;

    return allTracks.map(track => {
      const tCode = track.keyInfo.code;
      let category: 'BLEND' | 'BOOST' | 'DEEP' | 'MODULATE' | 'OTHER' = 'OTHER';
      let matchScore = 60;
      let reason = 'Chromatic Fit';

      if (tCode === blendCodeSame) {
        category = 'BLEND';
        matchScore = 98;
        reason = 'Harmonic Key Match';
      } else if (tCode === blendCodeRel) {
        category = 'BLEND';
        matchScore = 94;
        reason = 'Relative Maj/Min Blend';
      } else if (tCode === boostCode) {
        category = 'BOOST';
        matchScore = 92;
        reason = 'Energy Lift (+1 Key)';
      } else if (tCode === deepCode) {
        category = 'DEEP';
        matchScore = 88;
        reason = 'Moody Warmth (-1 Key)';
      } else if (tCode === modulateCode) {
        category = 'MODULATE';
        matchScore = 85;
        reason = 'Modulation Drop (+2 Semitones)';
      }

      // BPM compatibility score
      const bpmDiff = Math.abs((track.bpm || 124) - activeBpm);
      if (bpmDiff <= 4) matchScore = Math.min(99, matchScore + 5);

      return {
        ...track,
        category,
        matchScore,
        reason,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [allTracks, currentKey, activeBpm]);

  const filteredTracks = useMemo(() => {
    if (activeCategory === 'ALL') return categorizedTracks.filter(t => t.matchScore >= 80);
    return categorizedTracks.filter(t => t.category === activeCategory);
  }, [categorizedTracks, activeCategory]);

  return (
    <div className="border-t border-zinc-900 bg-zinc-950/95 font-mono select-none">
      {/* Header Toggle Banner */}
      <button
        onClick={() => {
          playClick(850, 'sine', 0.02);
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 hover:bg-zinc-900/80 transition-colors cursor-pointer border-b border-zinc-900"
      >
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span className="text-[8.5px] font-black tracking-widest text-zinc-200 uppercase">
            CAMELOT HARMONIC RADAR // MIX ASSISTANT
          </span>
          <span className="px-1.5 py-0.2 text-[7px] font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
            ROOT: {currentKey.code} ({currentKey.name})
          </span>
        </div>

        <div className="flex items-center gap-2 text-[7.5px] text-zinc-400">
          <span className="hidden sm:inline text-zinc-500">{filteredTracks.length} HARMONIC MATCHES FOUND</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </button>

      {/* Collapsible Radar Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-2 bg-black/60 border-b border-zinc-900 text-[7px]">
              {(['ALL', 'BLEND', 'BOOST', 'DEEP', 'MODULATE'] as FlowCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    playClick(950, 'sine', 0.02);
                    setActiveCategory(cat);
                  }}
                  className={cn(
                    "px-2 py-1 font-black uppercase tracking-wider transition-all cursor-pointer border",
                    activeCategory === cat
                      ? "bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                      : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800"
                  )}
                >
                  {cat === 'ALL' && '⭐ TOP MATCHES'}
                  {cat === 'BLEND' && '🔄 SMOOTH BLEND'}
                  {cat === 'BOOST' && '🔥 ENERGY LIFT (+1)'}
                  {cat === 'DEEP' && '🌙 DEEP SHIFT (-1)'}
                  {cat === 'MODULATE' && '⚡ KEY JUMP (+2)'}
                </button>
              ))}
            </div>

            {/* Recommendations Grid / List */}
            <div className="p-2 max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {filteredTracks.length === 0 ? (
                <div className="py-6 text-center text-[8px] text-zinc-600 uppercase font-mono">
                  No harmonic matches in this specific category
                </div>
              ) : (
                filteredTracks.slice(0, 15).map(track => {
                  return (
                    <div
                      key={track.id}
                      className={cn(
                        "flex items-center justify-between p-1.5 border bg-black/80 transition-all group",
                        track.matchScore >= 90 ? "border-amber-950 hover:border-amber-700/60" : "border-zinc-900 hover:border-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Match Score Badge */}
                        <div className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-center shrink-0">
                          <span className={cn("text-[7.5px] font-black font-mono", track.matchScore >= 90 ? "text-amber-400" : "text-emerald-400")}>
                            {track.matchScore}%
                          </span>
                        </div>

                        {/* Camelot Key Badge */}
                        <span className="px-1.5 py-0.5 bg-black border border-amber-500/40 text-amber-300 text-[7px] font-black shrink-0">
                          {track.keyInfo.code}
                        </span>

                        {/* Title & Context */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-bold text-zinc-200 truncate uppercase">
                            {track.title}
                          </span>
                          <span className="text-[6.5px] text-zinc-500 font-mono truncate">
                            {track.reason} • {track.bpm} BPM • {track.groupTitle}
                          </span>
                        </div>
                      </div>

                      {/* Load Action Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            playClick(1200, 'sine', 0.03);
                            onLoadTrack(track, targetDeckId);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-black font-black text-[7.5px] uppercase transition-all cursor-pointer shadow-neon-glow"
                        >
                          <span>LOAD DECK {targetDeckId}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HarmonicRadarDrawer;
