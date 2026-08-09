'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface UsbDropzoneOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  leftDeckId: number;
  rightDeckId: number;
  dragTargetDeck: number | null;
  onDragTargetDeckChange: (deckId: number | null) => void;
  onFileDrop: (deckId: number, file: File) => void;
  onLockout: () => void;
}

export function UsbDropzoneOverlay({
  isOpen,
  onClose,
  leftDeckId,
  rightDeckId,
  dragTargetDeck,
  onDragTargetDeckChange,
  onFileDrop,
  onLockout,
}: UsbDropzoneOverlayProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-md"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac)$/i.test(file.name)) {
            onFileDrop(leftDeckId, file);
          } else {
            onLockout();
          }
        }
      }}
    >
      {/* USB Enclosure Card */}
      <div className="w-full max-w-xl bg-black border-2 border-dashed border-zinc-900 rounded-none p-8 flex flex-col items-center gap-6 relative overflow-hidden">
        
        {/* Spinning Record visual indicator */}
        <div className="w-20 h-20 rounded-full border-2 border-zinc-800 flex items-center justify-center relative animate-[spin_6s_linear_infinite]">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
        </div>

        <div className="flex flex-col gap-2 text-center font-mono">
          <span className="text-primary font-black text-lg md:text-xl tracking-[0.25em] uppercase animate-pulse">
            INSERT VIRTUAL USB
          </span>
          <span className="text-zinc-500 text-[10px] tracking-widest uppercase">
            DROP AUDIO FILE (.mp3, .wav, .m4a) ONTO A DECK DROPZONE
          </span>
        </div>

        {/* Target Dropzones Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4 font-mono">
          {[
            { label: 'LOAD TO DECK LEFT', id: leftDeckId, name: 'LEFT' },
            { label: 'LOAD TO DECK RIGHT', id: rightDeckId, name: 'RIGHT' }
          ].map(target => (
            <div
              key={target.name}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDragTargetDeckChange(target.id);
              }}
              onDragLeave={() => onDragTargetDeckChange(null)}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                onDragTargetDeckChange(null);
                
                const files = e.dataTransfer?.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac)$/i.test(file.name)) {
                    onFileDrop(target.id, file);
                  } else {
                    onLockout();
                  }
                }
              }}
              className={cn(
                "border-2 border-dashed rounded-none p-6 flex flex-col items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer h-36 text-center select-none",
                dragTargetDeck === target.id
                  ? "border-primary bg-primary/10 scale-105 shadow-[0_0_20px_rgba(216,22,63,0.3)]"
                  : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40"
              )}
            >
              <span className="text-2xl">💾</span>
              <span className="text-[10px] font-black tracking-widest uppercase text-white">
                {target.label}
              </span>
              <span className="text-[8px] text-zinc-500 tracking-wider">
                DECK {target.id}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-2 text-zinc-500 hover:text-white font-mono text-[9px] tracking-widest uppercase cursor-pointer"
        >
          [ CANCEL ]
        </button>
      </div>
    </div>
  );
}

export default UsbDropzoneOverlay;
