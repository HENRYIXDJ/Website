'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface JogWheelPlatterProps {
  jogSize: number;
  innerPlatterSize: number;
  isCompact: boolean;
  isPlaying: boolean;
  isCueStuttering: boolean;
  themeColor: string;
  sessionImg: string;
  onRimDown: (e: React.PointerEvent) => void;
  onRimMove: (e: React.PointerEvent) => void;
  onRimUp: (e: React.PointerEvent) => void;
  onPlatterDown: (e: React.PointerEvent) => void;
  onPlatterMove: (e: React.PointerEvent) => void;
  onPlatterUp: (e: React.PointerEvent) => void;
}

export function JogWheelPlatter({
  jogSize,
  innerPlatterSize,
  isCompact,
  isPlaying,
  isCueStuttering,
  themeColor,
  sessionImg,
  onRimDown,
  onRimMove,
  onRimUp,
  onPlatterDown,
  onPlatterMove,
  onPlatterUp,
}: JogWheelPlatterProps) {
  return (
    <div className="flex-grow flex items-center justify-center relative select-none min-h-0 min-w-0">
      <div 
        onPointerDown={onRimDown}
        onPointerMove={onRimMove}
        onPointerUp={onRimUp}
        className="rounded-full border-2 border-zinc-800 bg-black flex items-center justify-center cursor-pointer relative"
        style={{
          width: `${jogSize}px`,
          height: `${jogSize}px`,
          transform: isCompact ? 'translate(0px, 0px)' : 'translate(-8px, -12px)'
        }}
      >
        {/* Grooves & Position Stripes */}
        <div className="absolute inset-3 border border-dashed border-zinc-700/60 rounded-full pointer-events-none" />
        <div className="absolute inset-7 border border-zinc-700/40 rounded-full pointer-events-none" />
        <div className="absolute inset-11 border border-dashed border-zinc-700/60 rounded-full pointer-events-none" />

        {/* Platter Marker Needle Ring */}
        <div 
          className="absolute top-0 w-0.5 h-4 pointer-events-none z-20 transition-colors duration-300"
          style={{ backgroundColor: isPlaying ? themeColor : 'rgb(244, 63, 94)' }}
        />

        {/* Inner Platter (Spinning artwork in vinyl mode) */}
        <div 
          onPointerDown={onPlatterDown}
          onPointerMove={onPlatterMove}
          onPointerUp={onPlatterUp}
          className={cn(
            "rounded-full border border-zinc-900 overflow-hidden relative bg-contain bg-center bg-no-repeat bg-black select-none pointer-events-none z-10 flex items-center justify-center",
            (isPlaying && !isCueStuttering) && "animate-[spin_1.8s_linear_infinite]"
          )}
          style={{ 
            width: `${innerPlatterSize}px`,
            height: `${innerPlatterSize}px`,
            backgroundImage: `url(${sessionImg})` 
          }}
        >
          {/* Center Spindle Hole */}
          <div className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-800 z-10 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default JogWheelPlatter;
