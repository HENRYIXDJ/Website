'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PitchFaderProps {
  pitch: number;
  isCompact: boolean;
  isLocked: boolean;
  themeColor: string;
  onPitchChange: (newPitch: number) => void;
}

export function PitchFader({
  pitch,
  isCompact,
  isLocked,
  themeColor,
  onPitchChange,
}: PitchFaderProps) {
  const currentPitch = pitch || 0;

  return (
    <div className={cn("flex flex-col justify-between shrink-0 select-none bg-black border border-zinc-900 rounded-none h-full", isCompact ? "w-12 p-1 gap-1.5" : "w-20 p-2 gap-2")}>
      {/* Top Panel: Rate display */}
      <div className={cn("flex flex-col border-b border-zinc-800/50 select-none w-full shrink-0", isCompact ? "pb-0.5 gap-0" : "pb-1 gap-0.5")}>
        {isCompact ? (
          <div className="text-[5.5px] font-mono text-zinc-400 font-bold text-center leading-none">
            {currentPitch >= 0 ? `+${currentPitch.toFixed(1)}%` : `${currentPitch.toFixed(1)}%`}
          </div>
        ) : (
          <div className="flex items-center justify-between text-[5px] font-mono text-zinc-600 font-bold uppercase tracking-wider">
            <span>RATE</span>
            <span className="text-zinc-400 font-mono text-[7px]">
              {currentPitch >= 0 ? `+${currentPitch.toFixed(2)}%` : `${currentPitch.toFixed(2)}%`}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Panel: The Pitch Slider */}
      <div className="flex-grow flex flex-col justify-center items-center min-h-0 w-full relative pt-1">
        <div 
          className={cn("relative bg-black border border-zinc-900 rounded-none flex items-center justify-center border-b-2", isCompact ? "w-2.5 h-[95%]" : "w-4 h-[90%]")} 
          style={{ borderBottomColor: themeColor }}
        >
          {/* Pitch detent center tick LED */}
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full z-10 transition-colors duration-300",
              isCompact ? "right-0.5 w-0.5 h-0.5" : "right-0.5 w-1 h-1",
              currentPitch === 0 ? "bg-cyan-400" : "bg-zinc-800"
            )}
          />

          {/* Slider Scale Line */}
          <div className="w-[1px] h-[80%] bg-zinc-800 pointer-events-none" />

          {/* Physical Handle position */}
          <div 
            className={cn("absolute bg-black border border-zinc-800 rounded-none flex items-center justify-center cursor-ns-resize pointer-events-none z-10", isCompact ? "w-3.5 h-4" : "w-5 h-7")}
            style={{
              top: `calc(${((currentPitch + 8) / 16) * 90}% + 5%)`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className={isCompact ? "w-2.5 h-[1px]" : "w-3.5 h-[1px]"} style={{ backgroundColor: themeColor }} />
          </div>

          {/* Overlaid invisible fader input */}
          <input 
            type="range"
            min="-8"
            max="8"
            step="0.002"
            value={-currentPitch}
            onChange={(e) => {
              if (isLocked) return;
              const targetPitch = -parseFloat(e.target.value);
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
