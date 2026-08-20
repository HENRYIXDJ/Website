'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/audioUtils';

interface PitchFaderProps {
  pitch: number;
  tempoRange?: 6 | 10 | 16 | 100;
  isCompact: boolean;
  isLocked: boolean;
  themeColor: string;
  onPitchChange: (newPitch: number) => void;
  onRangeCycle?: () => void;
}

export function PitchFader({
  pitch,
  tempoRange = 10,
  isCompact,
  isLocked,
  themeColor,
  onPitchChange,
  onRangeCycle,
}: PitchFaderProps) {
  const currentPitch = pitch || 0;
  const range = tempoRange || 10;

  const handleDoubleClick = () => {
    if (isLocked) return;
    playClick(1400, 'sine', 0.02);
    onPitchChange(0);
  };

  const handleRangeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    playClick(1000, 'sine', 0.02);
    onRangeCycle?.();
  };

  // Compute handle percentage: range = -range to +range
  const clampedPitch = Math.max(-range, Math.min(range, currentPitch));
  // In Pioneer CDJs: Up = faster (+), Down = slower (-) OR inverted depending on preference.
  // Here slider min=-range, max=range: top is +pitch, bottom is -pitch
  const normalizedPos = ((range - clampedPitch) / (range * 2)) * 100;

  return (
    <div className={cn("flex flex-col justify-between shrink-0 select-none w-full h-full", isCompact ? "p-1 gap-1" : "p-1.5 gap-1.5")}>
      {/* Top Panel: Rate display & Range Switcher */}
      <div className={cn("flex flex-col border-b border-zinc-800/50 select-none w-full shrink-0", isCompact ? "pb-0.5 gap-0" : "pb-1 gap-0.5")}>
        {isCompact ? (
          <div className="flex items-center justify-between">
            <span className="text-[6.5px] font-mono text-zinc-300 font-bold leading-none">
              {currentPitch >= 0 ? `+${currentPitch.toFixed(1)}%` : `${currentPitch.toFixed(1)}%`}
            </span>
            {onRangeCycle && (
              <button
                onClick={handleRangeClick}
                title="Cycle Pitch Range (±6%, ±10%, ±16%, WIDE)"
                className="text-[6px] font-mono font-black text-amber-400 hover:text-amber-300 bg-zinc-950 px-1 py-0.2 border border-zinc-800 cursor-pointer"
              >
                {range === 100 ? 'WIDE' : `±${range}%`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-[6.5px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
            <button
              onClick={handleRangeClick}
              title="Cycle Pitch Range (±6%, ±10%, ±16%, WIDE)"
              className="text-[6.5px] font-mono font-black text-amber-400 hover:text-amber-300 bg-zinc-950 px-1.5 py-0.5 border border-zinc-800 cursor-pointer transition-colors"
            >
              {range === 100 ? 'WIDE' : `±${range}%`}
            </button>
            <span 
              onDoubleClick={handleDoubleClick}
              title="Double click to reset pitch to 0.00%"
              className="text-zinc-200 font-mono text-[8.5px] font-bold cursor-pointer hover:text-cyan-400"
            >
              {currentPitch >= 0 ? `+${currentPitch.toFixed(2)}%` : `${currentPitch.toFixed(2)}%`}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Panel: The Pitch Slider */}
      <div 
        onDoubleClick={handleDoubleClick}
        title="Double click track to reset pitch to 0.00%"
        className="flex-grow flex flex-col justify-center items-center min-h-0 w-full relative pt-1"
      >
        <div 
          className={cn("relative bg-black border border-zinc-900 rounded-none flex items-center justify-center border-b-2", isCompact ? "w-3 h-[95%]" : "w-5 h-[90%]")} 
          style={{ borderBottomColor: themeColor }}
        >
          {/* Pitch detent center tick LED */}
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full z-10 transition-colors duration-300",
              isCompact ? "right-0.5 w-1 h-1" : "right-0.5 w-1.5 h-1.5",
              Math.abs(currentPitch) < 0.005 ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" : "bg-zinc-800"
            )}
          />

          {/* Slider Scale Line */}
          <div className="w-[1px] h-[80%] bg-zinc-800 pointer-events-none" />

          {/* Physical Handle position */}
          <div 
            className={cn("absolute bg-black border border-zinc-700 rounded-none flex items-center justify-center cursor-ns-resize pointer-events-none z-10 shadow-md", isCompact ? "w-4 h-5" : "w-6 h-8")}
            style={{
              top: `${Math.max(5, Math.min(95, normalizedPos))}%`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className={isCompact ? "w-3 h-[1.5px]" : "w-4.5 h-[2px]"} style={{ backgroundColor: themeColor }} />
          </div>

          {/* Overlaid invisible fader input */}
          <input 
            type="range"
            min={-range}
            max={range}
            step="0.005"
            value={currentPitch}
            onChange={(e) => {
              if (isLocked) return;
              const targetPitch = parseFloat(e.target.value);
              onPitchChange(targetPitch);
            }}
            disabled={isLocked}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-20"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
        </div>
      </div>
    </div>
  );
}

export default PitchFader;
