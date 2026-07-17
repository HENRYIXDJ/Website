'use client';

import React, { useEffect, useRef } from 'react';
import { playClick } from '@/lib/audioUtils';

interface CrossfaderProps {
  value: number;
  onChange: (val: number) => void;
}

export function Crossfader({ 
  value, 
  onChange 
}: CrossfaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef({ time: 0, value: value });

  useEffect(() => {
    lastUpdateRef.current.value = value;
  }, [value]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      const input = container.querySelector('input');
      if (document.activeElement !== input) return;

      e.preventDefault();

      const delta = -Math.sign(e.deltaY) * 0.2;
      let newValue = lastUpdateRef.current.value + delta;

      const center = 50;
      const snapThreshold = 3.5;

      if (Math.abs(newValue - center) < snapThreshold) {
        if (lastUpdateRef.current.value !== center) {
          newValue = center;
          playClick(880, 'sine', 0.015);
        }
      } else {
        const nearestInt = Math.round(newValue);
        if (Math.abs(newValue - nearestInt) < 0.15) {
          newValue = nearestInt;
        }
      }

      newValue = Math.max(0, Math.min(100, newValue));
      onChange(newValue);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative w-full h-5 bg-zinc-950 border border-zinc-900 focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(216,22,63,0.5)] rounded flex items-center justify-center px-4 overflow-hidden select-none shadow-inner">
      <input 
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={value}
        title="Crossfader"
        placeholder="Crossfader"
        onChange={(e) => {
          const now = performance.now();
          const rawValue = Number(e.target.value);
          const dt = now - lastUpdateRef.current.time;
          const dp = Math.abs(rawValue - lastUpdateRef.current.value);
          const velocity = dt > 0 ? dp / dt : 0;
          
          lastUpdateRef.current = { time: now, value: rawValue };

          let targetValue = rawValue;
          const center = 50;
          const snapThreshold = 3.5;

          if (Math.abs(rawValue - center) < snapThreshold) {
            if (velocity < 0.3) {
              targetValue = center;
              if (value !== center) {
                playClick(880, 'sine', 0.015);
              }
            }
          } else {
            const nearestInt = Math.round(rawValue);
            if (velocity < 0.15 && Math.abs(rawValue - nearestInt) < 0.4) {
              targetValue = nearestInt;
            }
          }

          onChange(Math.max(0, Math.min(100, targetValue)));
        }}
        aria-label="Crossfader"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 touch-none scale-125"
      />

      <div className="w-[95%] h-[1px] bg-zinc-800 absolute" />

      <div 
        className="absolute h-5 bg-gradient-to-r from-zinc-700 to-zinc-900 border border-zinc-600 rounded flex items-center justify-center shadow pointer-events-none"
        style={{ 
          left: `calc(${value}% - 12.5px)`,
          width: '25px'
        }}
      >
        <div className="h-full w-[1px] bg-primary shadow-[0_0_2px_#d8163f]" />
      </div>
    </div>
  );
}
