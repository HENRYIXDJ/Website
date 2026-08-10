'use client';

import React from 'react';

interface PlayheadScrubberProps {
  progress: number;
  duration: number;
  activeColorBg: string;
  onSeek: (seekTime: number) => void;
  showTimestamps?: boolean;
  className?: string;
}

export function PlayheadScrubber({
  progress,
  duration,
  activeColorBg,
  onSeek,
  showTimestamps = true,
  className = '',
}: PlayheadScrubberProps) {
  const [, setIsScrubbing] = React.useState(false);

  const progressPct = duration ? Math.min(100, (progress / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * duration);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div
        onClick={handleSeek}
        onMouseDown={() => setIsScrubbing(true)}
        onMouseUp={() => setIsScrubbing(false)}
        onMouseMove={(e) => {
          if (e.buttons === 1) handleSeek(e);
        }}
        className="relative w-full h-2 bg-zinc-900 border border-zinc-800/80 cursor-pointer group/scrubber overflow-hidden select-none"
      >
        {/* Progress fill */}
        <div
          className={`h-full ${activeColorBg} transition-all duration-75`}
          style={{ width: `${progressPct}%` }}
        />

        {/* Scrubber Playhead Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] opacity-0 group-hover/scrubber:opacity-100 transition-opacity"
          style={{ left: `calc(${progressPct}% - 2px)` }}
        />
      </div>

      {showTimestamps && (
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 tracking-wider select-none">
          <span>{formatTime(progress)}</span>
          <span className="text-zinc-500">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
