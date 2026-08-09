'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/audioUtils';

interface StemControlPanelProps {
  deckId: 1 | 2 | 3 | 4;
  themeColor: string;
  onToggleStem?: (stem: 'drums' | 'bass' | 'vocals' | 'melody', isMuted: boolean) => void;
}

export function StemControlPanel({
  deckId,
  themeColor,
  onToggleStem,
}: StemControlPanelProps) {
  const [stems, setStems] = useState({
    drums: true,
    bass: true,
    vocals: true,
    melody: true,
  });

  const toggle = (stem: 'drums' | 'bass' | 'vocals' | 'melody') => {
    playClick(880, 'sine', 0.02);
    const nextState = !stems[stem];
    setStems(prev => ({ ...prev, [stem]: nextState }));
    if (onToggleStem) onToggleStem(stem, !nextState);
  };

  return (
    <div className="flex flex-col gap-1 bg-black border border-zinc-900 rounded-none p-1.5 font-mono select-none">
      <div className="flex justify-between items-center text-[7px] text-zinc-500 font-bold uppercase border-b border-zinc-900 pb-0.5">
        <span>STEM ISOLATION (DECK {deckId})</span>
        <span className="text-zinc-600">SERATO / DJAY REALTIME</span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <button
          onClick={() => toggle('drums')}
          className={cn(
            "h-7 rounded-none border text-[7.5px] font-black uppercase transition-all cursor-pointer flex flex-col items-center justify-center",
            stems.drums
              ? "bg-cyan-950 border-cyan-500 text-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.3)]"
              : "bg-zinc-950 border-zinc-900 text-zinc-600 opacity-60"
          )}
        >
          <span>🥁 DRUMS</span>
        </button>

        <button
          onClick={() => toggle('bass')}
          className={cn(
            "h-7 rounded-none border text-[7.5px] font-black uppercase transition-all cursor-pointer flex flex-col items-center justify-center",
            stems.bass
              ? "bg-rose-950 border-rose-500 text-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.3)]"
              : "bg-zinc-950 border-zinc-900 text-zinc-600 opacity-60"
          )}
        >
          <span>🎸 BASS</span>
        </button>

        <button
          onClick={() => toggle('vocals')}
          className={cn(
            "h-7 rounded-none border text-[7.5px] font-black uppercase transition-all cursor-pointer flex flex-col items-center justify-center",
            stems.vocals
              ? "bg-amber-950 border-amber-500 text-amber-400 shadow-[0_0_6px_rgba(234,179,8,0.3)]"
              : "bg-zinc-950 border-zinc-900 text-zinc-600 opacity-60"
          )}
        >
          <span>🎤 VOCAL</span>
        </button>

        <button
          onClick={() => toggle('melody')}
          className={cn(
            "h-7 rounded-none border text-[7.5px] font-black uppercase transition-all cursor-pointer flex flex-col items-center justify-center",
            stems.melody
              ? "bg-purple-950 border-purple-500 text-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.3)]"
              : "bg-zinc-950 border-zinc-900 text-zinc-600 opacity-60"
          )}
        >
          <span>🎹 SYNTH</span>
        </button>
      </div>
    </div>
  );
}

export default StemControlPanel;
