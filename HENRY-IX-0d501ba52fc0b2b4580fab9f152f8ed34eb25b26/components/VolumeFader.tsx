'use client';

import React, { useEffect, useRef } from 'react';
import { playClick } from '@/lib/audioUtils';

interface VolumeFaderProps {
  deckId: number;
  volume: number;
  isLocked: boolean;
  channelColor: string;
  onChange: (val: number) => void;
  onLockout: () => void;
  isPlaying?: boolean;
}

export function VolumeFader({
  deckId,
  volume,
  isLocked,
  channelColor,
  onChange,
  onLockout,
  isPlaying = false
}: VolumeFaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef({ time: 0, value: volume });

  useEffect(() => {
    lastUpdateRef.current.value = volume;
  }, [volume]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      const input = container.querySelector('input');
      if (document.activeElement !== input || isLocked) return;

      e.preventDefault();

      const delta = -Math.sign(e.deltaY) * 0.2;
      let newValue = lastUpdateRef.current.value + delta;

      if (newValue < 3.5) {
        if (lastUpdateRef.current.value !== 0) {
          newValue = 0;
          playClick(880, 'sine', 0.015);
        }
      } else if (newValue > 96.5) {
        if (lastUpdateRef.current.value !== 100) {
          newValue = 100;
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
  }, [onChange, isLocked]);

  return (
    <div ref={containerRef} className="relative flex-grow min-h-[50px] max-h-[140px] w-[32cqw] max-w-[28px] min-w-[14px] bg-zinc-950 border border-zinc-900 focus-within:border-zinc-500 focus-within:shadow-[0_0_8px_rgba(255,255,255,0.15)] rounded flex items-center justify-center overflow-hidden shadow-inner">
      <input 
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={volume}
        title="Volume Fader"
        placeholder="Volume Fader"
        onChange={(e) => {
          if (!isLocked) {
            const now = performance.now();
            const rawValue = Number(e.target.value);
            const dt = now - lastUpdateRef.current.time;
            const dp = Math.abs(rawValue - lastUpdateRef.current.value);
            const velocity = dt > 0 ? dp / dt : 0;
            
            lastUpdateRef.current = { time: now, value: rawValue };

            let targetValue = rawValue;

            if (rawValue < 3.5) {
              if (velocity < 0.3) {
                targetValue = 0;
                if (volume !== 0) playClick(880, 'sine', 0.015);
              }
            } else if (rawValue > 96.5) {
              if (velocity < 0.3) {
                targetValue = 100;
                if (volume !== 100) playClick(880, 'sine', 0.015);
              }
            } else {
              const nearestInt = Math.round(rawValue);
              if (velocity < 0.15 && Math.abs(rawValue - nearestInt) < 0.4) {
                targetValue = nearestInt;
              }
            }

            onChange(Math.max(0, Math.min(100, targetValue)));
          } else {
            onLockout();
          }
        }}
        disabled={isLocked}
        aria-label={`Volume Fader Deck ${deckId}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={volume}
        style={{
          writingMode: 'vertical-lr',
          direction: 'rtl'
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 touch-none scale-125"
      />

      <div 
        className="absolute bottom-0 w-full transition-all duration-300"
        style={{ 
          height: `${volume}%`,
          backgroundColor: channelColor,
          opacity: isPlaying ? 0.50 : 0.15,
          boxShadow: isPlaying ? `0 0 10px ${channelColor}` : undefined
        }}
      />

      <div className="absolute inset-y-1 flex flex-col justify-between w-full pointer-events-none opacity-40">
        {[...Array(11)].map((_, idx) => (
          <div key={idx} className="h-[1px] bg-zinc-700 w-3 mx-auto" />
        ))}
      </div>

      {/* Fader Cap */}
      <div 
        className="absolute w-[135%] h-[min(26px,max(18px,28cqw))] bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 rounded flex items-center justify-center shadow pointer-events-none"
        style={{ 
          bottom: `calc(${volume}% - min(13px,max(9px,14cqw)))`,
          transform: 'translateY(50%)'
        }}
      >
        <div className="w-full h-[1px] bg-primary shadow-[0_0_2px_#d8163f]" />
      </div>
    </div>
  );
}
