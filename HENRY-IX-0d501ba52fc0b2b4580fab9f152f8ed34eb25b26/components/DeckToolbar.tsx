'use client';

import React from 'react';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/mixes';
import { RecordingState } from '@/lib/audioRecorder';

interface DeckToolbarProps {
  deckCount: 2 | 4;
  onDeckCountChange: (count: 2 | 4) => void;
  midiDeviceName: string;
  onOpenMIDI: () => void;
  usbFolderName: string | null;
  isUsbLoading: boolean;
  onConnectUsb: () => void;
  recordingState: RecordingState;
  onToggleRecording: () => void;
  onSaveRecording: () => void;
  onOpenShortcuts: () => void;
}

export function DeckToolbar({
  deckCount,
  onDeckCountChange,
  midiDeviceName,
  onOpenMIDI,
  usbFolderName,
  isUsbLoading,
  onConnectUsb,
  recordingState,
  onToggleRecording,
  onSaveRecording,
  onOpenShortcuts,
}: DeckToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* 2-Deck vs 4-Deck Toggle */}
      <div className="flex items-center bg-black border border-zinc-900 rounded-none p-0.5 font-mono text-[7.5px] md:text-[8px]">
        {([2, 4] as const).map((count) => (
          <button
            key={count}
            onClick={() => onDeckCountChange(count)}
            className={cn(
              "px-2 py-0.5 font-bold tracking-wider transition-all cursor-pointer",
              deckCount === count
                ? "bg-primary text-black"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {count} DECK
          </button>
        ))}
      </div>

      {/* Controller Link Button */}
      <button
        onClick={onOpenMIDI}
        className={cn(
          "px-2.5 py-1 rounded-none text-[7.5px] md:text-[8px] font-mono font-bold tracking-wider uppercase transition-all border cursor-pointer flex items-center gap-1.5 active:scale-95",
          midiDeviceName 
            ? "bg-emerald-950 border-emerald-800 text-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
        )}
      >
        <Cpu className="w-3 h-3" />
        {midiDeviceName ? `LINKED: ${midiDeviceName}` : 'Controller Link'}
      </button>

      {/* CONNECT USB / LOCAL LIBRARY Button */}
      <button
        onClick={onConnectUsb}
        disabled={isUsbLoading}
        className={cn(
          "px-2.5 py-1 rounded-none text-[7.5px] md:text-[8px] font-mono font-bold tracking-wider uppercase transition-all border cursor-pointer flex items-center gap-1.5 active:scale-95",
          usbFolderName
            ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_8px_rgba(216,22,63,0.3)]"
            : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
        )}
      >
        <span>💾</span>
        {isUsbLoading ? 'SCANNING USB...' : usbFolderName ? `USB: ${usbFolderName}` : 'CONNECT USB'}
      </button>

      {/* LIVE SET RECORDING ENGINE BUTTON */}
      <button
        onClick={onToggleRecording}
        className={cn(
          "px-2.5 py-1 rounded-none text-[7.5px] md:text-[8px] font-mono font-bold tracking-wider uppercase transition-all border cursor-pointer flex items-center gap-1.5 active:scale-95",
          recordingState.isRecording
            ? "bg-red-950 border-red-800 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", recordingState.isRecording ? "bg-red-500 animate-ping" : "bg-zinc-600")} />
        {recordingState.isRecording
          ? `REC [ ${formatTime(recordingState.duration)} ]`
          : 'REC SET'}
      </button>

      {/* DOWNLOAD RECORDED SET BUTTON */}
      {recordingState.recordedBlob && !recordingState.isRecording && (
        <button
          onClick={onSaveRecording}
          className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-none text-emerald-400 font-mono text-[7.5px] md:text-[8px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-bounce"
        >
          <span>⬇ SAVE SET (.WAV)</span>
        </button>
      )}

      {/* Key Mapping Button */}
      <button
        onClick={onOpenShortcuts}
        className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-none text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 text-[7.5px] md:text-[8px] font-bold tracking-wider uppercase"
      >
        <span>⌨️</span> Key Mapping
      </button>
    </div>
  );
}

export default DeckToolbar;
