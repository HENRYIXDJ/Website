'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/mixes';
import { analyzeTrack, getCurrentPhrase } from '@/lib/proTrackAnalysis';

interface HardwareScreenHudProps {
  deckId: 1 | 2 | 3 | 4;
  title: string;
  artist?: string;
  bpm: number;
  pitch: number;
  progress: number;
  duration: number;
  keySig?: string;
  isPlaying: boolean;
  isCompact: boolean;
  themeColor: string;
}

export function HardwareScreenHud({
  deckId,
  title,
  artist,
  bpm,
  pitch,
  progress,
  duration,
  keySig,
  isPlaying,
  isCompact,
  themeColor,
}: HardwareScreenHudProps) {
  const activeBpm = (bpm || 120) * (1 + (pitch || 0) / 100);
  const remainTime = Math.max(0, (duration || 0) - (progress || 0));

  const analysis = analyzeTrack(title, bpm || 120, duration || 300);
  const activeKey = keySig || `${analysis.key} (${analysis.keyName})`;
  const activePhrase = getCurrentPhrase(progress, analysis.phrases);

  return (
    <div 
      className={cn("w-full bg-black border border-zinc-800 rounded-none flex flex-col justify-between select-none relative overflow-hidden", isCompact ? "p-1 h-12" : "p-2 h-16")}
      style={{ borderTop: `2px solid ${themeColor}` }}
    >
      {/* Top Bar: Deck ID & Track Title & Phrase Badge */}
      <div className="flex justify-between items-center text-[7px] font-mono tracking-wider text-zinc-400 font-bold uppercase border-b border-zinc-900 pb-0.5">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
          <span>DECK {deckId}</span>
        </div>

        <span className="truncate max-w-[120px] text-white">{title || 'NO TRACK LOADED'}</span>

        <span className="text-[6.5px] bg-zinc-900 border border-zinc-800 text-emerald-400 px-1 py-0.2 rounded-none font-bold uppercase">
          {activePhrase}
        </span>
      </div>

      {/* Center Readouts: BPM, Pitch Rate & Key */}
      <div className="flex items-center justify-between font-mono my-0.5">
        <div className="flex items-baseline gap-1">
          <span className="text-[6px] text-zinc-500 font-bold uppercase">BPM</span>
          <span className="text-sm font-black tracking-tight text-white">{activeBpm.toFixed(1)}</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[6px] text-zinc-500 font-bold uppercase">KEY</span>
          <span className="text-xs font-bold text-amber-400">{activeKey}</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[6px] text-zinc-500 font-bold uppercase">PITCH</span>
          <span className={cn("text-xs font-bold", pitch >= 0 ? "text-emerald-400" : "text-amber-400")}>
            {pitch >= 0 ? `+${pitch.toFixed(1)}%` : `${pitch.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Bottom Bar: Timecodes & Auto-Gain */}
      <div className="flex justify-between items-center text-[7px] font-mono text-zinc-500 font-bold tracking-wider uppercase border-t border-zinc-900 pt-0.5">
        <span>TIME: {formatTime(progress)}</span>
        <span className="text-zinc-600">GAIN: {analysis.autoGainDb >= 0 ? `+${analysis.autoGainDb}dB` : `${analysis.autoGainDb}dB`}</span>
        <span>REMAIN: -{formatTime(remainTime)}</span>
      </div>
    </div>
  );
}

export default HardwareScreenHud;
