'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonColor = 'primary' | 'red' | 'cyan' | 'green' | 'yellow' | 'amber' | 'purple' | 'zinc';

export interface TactileButtonProps {
  label: string;
  subLabel?: string;
  color?: ButtonColor;
  isOn?: boolean;
  isFlashing?: boolean;
  shape?: 'square' | 'circle' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export function TactileButton({
  label,
  subLabel,
  color = 'amber',
  isOn = false,
  isFlashing = false,
  shape = 'square',
  size = 'md',
  onPointerDown,
  onPointerUp,
  onClick,
  disabled = false,
  title,
  className,
}: TactileButtonProps) {
  const activeStyles: Record<ButtonColor, string> = {
    primary: 'bg-[#D8163F] border-[#D8163F] text-black shadow-[0_0_8px_rgba(216,22,63,0.4)]',
    red: 'bg-red-500 border-red-400 text-black shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    cyan: 'bg-cyan-400 border-cyan-300 text-black shadow-[0_0_8px_rgba(34,211,238,0.4)]',
    green: 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    yellow: 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_8px_rgba(234,179,8,0.4)]',
    amber: 'bg-amber-500 border-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    purple: 'bg-purple-500 border-purple-400 text-black shadow-[0_0_8px_rgba(168,85,247,0.4)]',
    zinc: 'bg-zinc-800 border-zinc-700 text-white shadow-[0_0_6px_rgba(255,255,255,0.2)]',
  };

  const idleStyles = 'bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700';

  const sizeClasses = 
    size === 'sm' ? 'text-[6px] h-6 px-1.5' :
    size === 'lg' ? 'text-[9px] h-10 px-3' :
    'text-[7.5px] h-7 px-2.5';

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      {subLabel && (
        <span className="text-[5.5px] font-mono font-bold text-zinc-500 uppercase h-3.5 flex items-center justify-center">
          {subLabel}
        </span>
      )}
      <button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
        disabled={disabled}
        title={title || label}
        className={cn(
          "font-mono font-black uppercase transition-all cursor-pointer flex items-center justify-center border leading-none shrink-0 select-none",
          shape === 'circle' ? "rounded-full" : "rounded-none",
          sizeClasses,
          isOn ? activeStyles[color] : idleStyles,
          isFlashing && "animate-pulse",
          className
        )}
      >
        <span>{label}</span>
      </button>
    </div>
  );
}

export default TactileButton;
