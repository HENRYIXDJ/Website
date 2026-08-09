'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface HotCuePadsProps {
  hotCues: Record<string, number | null>;
  isCompact: boolean;
  deleteMode: boolean;
  onToggleDeleteMode: () => void;
  onHotCuePress: (pad: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') => void;
}

export function HotCuePads({
  hotCues,
  isCompact,
  deleteMode,
  onToggleDeleteMode,
  onHotCuePress,
}: HotCuePadsProps) {
  return (
    <div className={cn("w-full flex items-center justify-between border-b border-zinc-800", isCompact ? "pb-1 gap-1" : "pb-2 gap-1.5")}>
      <div className={cn("grid grid-cols-8 flex-grow", isCompact ? "gap-1" : "gap-1.5")}>
        {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map(pad => {
          const hasCue = hotCues?.[pad] !== null && hotCues?.[pad] !== undefined;
          
          const padColors = 
            pad === 'A' ? 'border-red-500 text-red-400 bg-black hover:bg-red-950/40' :
            pad === 'B' ? 'border-orange-500 text-orange-400 bg-black hover:bg-orange-950/40' :
            pad === 'C' ? 'border-yellow-500 text-yellow-400 bg-black hover:bg-yellow-950/40' :
            pad === 'D' ? 'border-green-500 text-green-400 bg-black hover:bg-green-950/40' :
            pad === 'E' ? 'border-cyan-500 text-cyan-400 bg-black hover:bg-cyan-950/40' :
            pad === 'F' ? 'border-blue-500 text-blue-400 bg-black hover:bg-blue-950/40' :
            pad === 'G' ? 'border-purple-500 text-purple-400 bg-black hover:bg-purple-950/40' :
            'border-pink-500 text-pink-400 bg-black hover:bg-pink-950/40';

          return (
            <button
              key={pad}
              onPointerDown={() => onHotCuePress(pad)}
              className={cn(
                "rounded-none font-mono tracking-widest font-black uppercase border transition-all cursor-pointer flex items-center justify-center relative",
                isCompact ? "h-5 text-[7px]" : "h-7 text-[9.5px]",
                hasCue 
                  ? padColors
                  : "bg-zinc-950/60 border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
              )}
            >
              {pad}
              {hasCue && !isCompact && (
                <span className="absolute bottom-0.5 right-1 text-[5px] text-zinc-500 font-mono">
                  {hotCues[pad]!.toFixed(1)}s
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Hot Cue Delete Trigger */}
      <button
        onPointerDown={onToggleDeleteMode}
        className={cn(
          "rounded-none font-mono tracking-[0.2em] font-black uppercase border cursor-pointer leading-none shrink-0 transition-all",
          isCompact ? "px-1.5 h-5 text-[6px]" : "px-2.5 h-7 text-[7.5px]",
          deleteMode 
            ? "bg-red-950 text-red-400 border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
            : "bg-zinc-950/80 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
        )}
      >
        {deleteMode ? "DEL ACTIVE" : "DELETE"}
      </button>
    </div>
  );
}

export default HotCuePads;
