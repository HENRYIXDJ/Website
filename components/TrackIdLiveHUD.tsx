'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ListMusic, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/mixes';
import { detectCamelotKey } from '@/lib/proTrackAnalysis';
import { playClick } from '@/lib/audioUtils';

interface TrackIdLiveHUDProps {
  deckId: number;
  deck: any;
  themeColor: string;
  onSeek: (seconds: number) => void;
}

export function TrackIdLiveHUD({
  deckId,
  deck,
  themeColor,
  onSeek,
}: TrackIdLiveHUDProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const progress = deck?.progress || 0;
  const isPlaying = !!deck?.isPlaying;
  const duration = deck?.duration || 3600;
  const cuePoints: number[] = deck?.cuePoints || [0];
  const activeBpm = (deck?.bpm || 120) * (1 + (deck?.pitch || 0) / 100);

  // Find active track segment index based on cue points
  let currentSegmentIndex = 0;
  for (let i = 0; i < cuePoints.length; i++) {
    if (progress >= cuePoints[i]) {
      currentSegmentIndex = i;
    }
  }

  const segmentEnd = cuePoints[currentSegmentIndex + 1] || duration;
  const segmentRemaining = Math.max(0, segmentEnd - progress);

  const segmentKey = detectCamelotKey(`${deck?.title || ''} Part ${currentSegmentIndex + 1}`, activeBpm);

  if (!deck?.title || deck?.id === 'locked') return null;

  return (
    <div className="relative select-none font-mono text-[8px] z-20">
      {/* Mini Telemetry Pill */}
      <div 
        className={cn(
          "flex items-center justify-between gap-1.5 px-2 py-1 bg-black/90 border border-zinc-800 transition-all rounded-none",
          isPlaying ? "border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.8)]" : "opacity-75"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div 
            className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-colors", isPlaying ? "animate-ping" : "bg-zinc-700")}
            style={{ backgroundColor: isPlaying ? themeColor : undefined }}
          />
          <Radio className={cn("w-3 h-3 shrink-0", isPlaying ? "text-primary" : "text-zinc-500")} />
          <span className="text-[7px] font-black uppercase tracking-wider text-zinc-400 shrink-0">
            TRACK {currentSegmentIndex + 1}/{cuePoints.length}
          </span>
          <span className="text-[7.5px] font-bold text-zinc-200 truncate uppercase">
            {deck.title} — PART {currentSegmentIndex + 1}
          </span>
          <span className="text-[6.5px] px-1 py-0.2 border border-zinc-800 text-amber-400 font-bold bg-zinc-950 shrink-0">
            {segmentKey.code}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cuePoints.length > 1 && (
            <span className="hidden sm:inline text-[6.5px] text-zinc-500 font-mono">
              NEXT: -{formatTime(segmentRemaining)}
            </span>
          )}
          <button
            onClick={() => {
              playClick(900, 'sine', 0.02);
              setIsBreakdownOpen(!isBreakdownOpen);
            }}
            title="Toggle Live Track Breakdown"
            className={cn(
              "flex items-center gap-0.5 px-1 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer leading-none",
              isBreakdownOpen ? "bg-primary text-black border-primary" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
            )}
          >
            <ListMusic className="w-2.5 h-2.5" />
            <span>IDS</span>
          </button>
        </div>
      </div>

      {/* Expanded Track Breakdown Dropdown */}
      <AnimatePresence>
        {isBreakdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-black border border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.9)] p-2 z-50 flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-1 text-[7px] text-zinc-500 font-black uppercase tracking-wider">
              <span>MIX SET BREAKDOWN & TRANSITIONS</span>
              <span style={{ color: themeColor }}>DECK {deckId}</span>
            </div>

            <div className="flex flex-col gap-0.5 mt-0.5">
              {cuePoints.map((cueTime, idx) => {
                const isCurrent = idx === currentSegmentIndex;
                const keyInfo = detectCamelotKey(`${deck.title} Part ${idx + 1}`, activeBpm);

                return (
                  <button
                    key={`cue-row-${idx}`}
                    onClick={() => {
                      playClick(1100, 'sine', 0.02);
                      onSeek(cueTime);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2 py-1 rounded-none text-left border transition-all cursor-pointer group",
                      isCurrent
                        ? "bg-zinc-900 border-l-2 text-white font-bold"
                        : "bg-black/60 border-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950"
                    )}
                    style={{ borderLeftColor: isCurrent ? themeColor : 'transparent' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("text-[7.5px] font-mono", isCurrent ? "text-primary font-black" : "text-zinc-600")}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="truncate text-[8px] uppercase">
                        {deck.title} — PART {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[7px] text-amber-400 font-mono font-bold">
                        {keyInfo.code}
                      </span>
                      <span className="text-[7.5px] font-mono text-zinc-500 flex items-center gap-0.5">
                        <Clock className="w-2 h-2 text-zinc-600" />
                        {formatTime(cueTime)}
                      </span>
                      <span className="text-[6.5px] font-black uppercase text-zinc-500 group-hover:text-primary transition-colors">
                        JUMP ➔
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TrackIdLiveHUD;
