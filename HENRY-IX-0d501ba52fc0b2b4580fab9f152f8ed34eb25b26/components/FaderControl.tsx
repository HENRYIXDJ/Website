'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FaderControlProps {
  label?: string;
  value: number; // min to max
  min?: number;
  max?: number;
  step?: number;
  orientation?: 'vertical' | 'horizontal';
  onChange: (val: number) => void;
  disabled?: boolean;
  themeColor?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FaderControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'vertical',
  onChange,
  disabled = false,
  themeColor = '#D8163F',
  className,
  size = 'md',
}: FaderControlProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const isVertical = orientation === 'vertical';

  return (
    <div className={cn("flex flex-col items-center select-none shrink-0 bg-black border border-zinc-900 rounded-none p-1.5", className)}>
      {label && (
        <span className="text-[6px] font-mono text-zinc-500 font-bold uppercase mb-1 tracking-wider">
          {label}
        </span>
      )}

      <div className={cn("relative bg-black border border-zinc-900 rounded-none flex items-center justify-center border-b-2", isVertical ? "w-4 h-full min-h-[90px]" : "h-4 w-full min-w-[90px]")} style={{ borderBottomColor: themeColor }}>
        {/* Center detent indicator line if bipolar */}
        {min < 0 && (
          <div 
            className={cn(
              "absolute bg-cyan-400 rounded-full z-10",
              isVertical ? "top-1/2 right-0.5 w-1 h-1 -translate-y-1/2" : "left-1/2 top-0.5 w-1 h-1 -translate-x-1/2"
            )}
          />
        )}

        {/* Fader scale track */}
        <div className={cn("bg-zinc-800 pointer-events-none", isVertical ? "w-[1px] h-[85%]" : "h-[1px] w-[85%]")} />

        {/* Handle */}
        <div 
          className={cn("absolute bg-black border border-zinc-700 rounded-none flex items-center justify-center pointer-events-none z-10", isVertical ? "w-5 h-7" : "h-5 w-7")}
          style={isVertical ? {
            top: `calc(${100 - percentage}% - 14px)`,
          } : {
            left: `calc(${percentage}% - 14px)`,
          }}
        >
          <div className={cn("bg-primary", isVertical ? "w-3.5 h-[1.5px]" : "h-3.5 w-[1.5px]")} style={{ backgroundColor: themeColor }} />
        </div>

        {/* Range Input Overlay */}
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            if (disabled) return;
            onChange(parseFloat(e.target.value));
          }}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          style={isVertical ? { writingMode: 'vertical-lr', direction: 'rtl' } : undefined}
        />
      </div>
    </div>
  );
}

export default FaderControl;
