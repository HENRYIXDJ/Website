'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface JogWheelPlatterProps {
  jogSize: number;
  innerPlatterSize: number;
  isCompact: boolean;
  isPlaying: boolean;
  isCueStuttering: boolean;
  themeColor: string;
  sessionImg: string;
  onRimDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onRimMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onRimUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPlatterDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPlatterMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPlatterUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onScratchDelta?: (velocity: number) => void;
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
  onScratchDelta,
}: JogWheelPlatterProps) {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const platterRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const animFrameRef = useRef<number>(0);

  // 60 FPS continuous vinyl rotation during audio playback
  useEffect(() => {
    if (!isPlaying || isCueStuttering || isScratching) return;

    let lastTime = performance.now();
    const updateRotation = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      // 33.3 RPM = 200 degrees per second
      setRotationDeg(prev => (prev + delta * 200) % 360);
      animFrameRef.current = requestAnimationFrame(updateRotation);
    };

    animFrameRef.current = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, isCueStuttering, isScratching]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScratching(true);

    const rect = platterRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      lastAngleRef.current = angle;
    }

    onPlatterDown?.(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScratching) {
      onPlatterMove?.(e);
      return;
    }

    const rect = platterRef.current?.getBoundingClientRect();
    if (rect && lastAngleRef.current !== null) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      
      let delta = angle - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      lastAngleRef.current = angle;
      setRotationDeg(prev => (prev + delta) % 360);
      onScratchDelta?.(delta);
    }

    onPlatterMove?.(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsScratching(false);
    lastAngleRef.current = null;
    onPlatterUp?.(e);
  };

  return (
    <div className="flex-grow flex items-center justify-center relative select-none min-h-0 min-w-0">
      <div 
        ref={platterRef}
        onPointerDown={onRimDown}
        onPointerMove={onRimMove}
        onPointerUp={onRimUp}
        className={cn(
          "rounded-full border-2 border-zinc-800 bg-black flex items-center justify-center cursor-grab active:cursor-grabbing relative transition-shadow duration-200",
          isScratching && "border-amber-500 shadow-neon-glow"
        )}
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
          style={{ 
            backgroundColor: isScratching ? '#EAB308' : isPlaying ? themeColor : 'rgb(244, 63, 94)',
            transform: `rotate(${rotationDeg}deg)`,
            transformOrigin: `50% ${jogSize / 2}px`
          }}
        />

        {/* Inner Platter (Spinning artwork with rotational physics) */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={cn(
            "rounded-full border border-zinc-900 overflow-hidden relative bg-contain bg-center bg-no-repeat bg-black select-none pointer-events-auto z-10 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
          )}
          style={{ 
            width: `${innerPlatterSize}px`,
            height: `${innerPlatterSize}px`,
            backgroundImage: `url(${sessionImg})`,
            transform: `rotate(${rotationDeg}deg)`
          }}
        >
          {/* Center Spindle Hole */}
          <div className="w-3 h-3 rounded-full bg-black border border-zinc-800 z-10 flex items-center justify-center shadow-md">
            <div 
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300 z-20"
              style={{ backgroundColor: isScratching ? '#EAB308' : isPlaying ? themeColor : '#3F3F46' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default JogWheelPlatter;
