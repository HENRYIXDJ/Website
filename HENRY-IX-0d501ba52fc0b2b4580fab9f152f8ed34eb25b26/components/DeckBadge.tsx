'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type DeckId = 1 | 2 | 3 | 4;

export const DECK_COLORS: Record<DeckId, { main: string; glow: string; text: string; bg: string; border: string }> = {
  1: {
    main: '#D8163F',
    glow: 'rgba(216, 22, 63, 0.4)',
    text: 'text-[#D8163F]',
    bg: 'bg-[#D8163F]',
    border: 'border-[#D8163F]',
  },
  2: {
    main: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.4)',
    text: 'text-cyan-400',
    bg: 'bg-cyan-400',
    border: 'border-cyan-400',
  },
  3: {
    main: '#10B981',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-400',
    bg: 'bg-emerald-400',
    border: 'border-emerald-400',
  },
  4: {
    main: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.4)',
    text: 'text-yellow-400',
    bg: 'bg-yellow-400',
    border: 'border-yellow-400',
  },
};

interface DeckBadgeProps {
  deckId: DeckId;
  variant?: 'badge' | 'button';
  label?: string;
  isActive?: boolean;
  isLoaded?: boolean;
  isPlaying?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DeckBadge({
  deckId,
  variant = 'badge',
  label,
  isActive = false,
  isLoaded = false,
  isPlaying = false,
  onClick,
  className,
  size = 'md',
}: DeckBadgeProps) {
  const colors = DECK_COLORS[deckId] || DECK_COLORS[1];
  const displayLabel = label || `D${deckId}`;

  const sizeClasses = 
    size === 'sm' ? 'w-5 h-5 text-[7px]' :
    size === 'lg' ? 'w-8 h-8 text-[10px]' :
    'w-6 h-6 text-[8.5px]';

  if (variant === 'button') {
    return (
      <button
        onClick={onClick}
        title={`Load to Deck ${deckId}`}
        className={cn(
          "rounded-none font-mono font-black uppercase transition-all cursor-pointer flex items-center justify-center relative select-none shrink-0 border",
          sizeClasses,
          isLoaded
            ? "bg-black font-black"
            : "bg-black text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-600",
          className
        )}
        style={{
          borderColor: isLoaded ? colors.main : undefined,
          color: isLoaded ? colors.main : undefined,
          boxShadow: isLoaded ? `0 0 8px ${colors.glow}` : undefined,
        }}
      >
        <span>{displayLabel}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-none font-mono font-black uppercase flex items-center justify-center shrink-0 border select-none",
        sizeClasses,
        isActive || isLoaded ? "bg-black" : "bg-black/60 text-zinc-600 border-zinc-800",
        className
      )}
      style={{
        borderColor: (isActive || isLoaded) ? colors.main : undefined,
        color: (isActive || isLoaded) ? colors.main : undefined,
        boxShadow: (isActive || isPlaying) ? `0 0 8px ${colors.glow}` : undefined,
      }}
    >
      <span>{displayLabel}</span>
    </div>
  );
}

export default DeckBadge;
