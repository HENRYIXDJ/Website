'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Square, Download, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setRecorder, RecordingState } from '@/lib/audioRecorder';
import { formatTime } from '@/lib/mixes';
import { playClick } from '@/lib/audioUtils';
import { useAudioStore } from '@/store/audioStore';

interface SetRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetRecordingModal({ isOpen, onClose }: SetRecordingModalProps) {
  const [recorderState, setRecorderState] = useState<RecordingState>(setRecorder.getState());
  const [format, setFormat] = useState<'wav' | 'mp3' | 'webm'>('wav');
  const [setName, setSetName] = useState('HENRY_IX_LIVE_SESSION');

  const playedTrackIds = useAudioStore(s => s.playedTrackIds || []);

  useEffect(() => {
    const unsub = setRecorder.subscribe((st) => {
      setRecorderState({ ...st });
    });
    return () => unsub();
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleToggleRecord = async () => {
    if (recorderState.isRecording) {
      playClick(700, 'square', 0.05);
      await setRecorder.stopRecording();
    } else {
      playClick(1200, 'sine', 0.05);
      setRecorder.startRecording(format);
    }
  };

  const handleDownload = () => {
    playClick(1000, 'sine', 0.03);
    setRecorder.downloadRecordedSet(setName.replace(/\s+/g, '_'));
  };

  const handleDownloadCueSheet = () => {
    playClick(1000, 'sine', 0.03);
    const dateStr = new Date().toISOString().slice(0, 10);
    let text = `=================================================\n`;
    text += `HENRY IX LIVE DJ SET RECORDING - TRACKLIST & CUE SHEET\n`;
    text += `DATE: ${dateStr}\n`;
    text += `SESSION NAME: ${setName}\n`;
    text += `RECORDED DURATION: ${formatTime(recorderState.duration)}\n`;
    text += `TOTAL TRACKS PLAYED: ${playedTrackIds.length}\n`;
    text += `=================================================\n\n`;
    if (playedTrackIds.length === 0) {
      text += `No distinct tracks logged during this take.\n`;
    } else {
      playedTrackIds.forEach((tId, idx) => {
        text += `[${(idx + 1).toString().padStart(2, '0')}] ${tId}\n`;
      });
    }
    text += `\nExported from HENRY IX Web DJ Pro Audio Console\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${setName.replace(/\s+/g, '_')}_CUESHEET.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playClick();
              onClose();
            }
          }}
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none font-mono"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] p-5 relative flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full border", recorderState.isRecording ? "bg-primary border-primary animate-ping" : "bg-zinc-800 border-zinc-700")} />
                <span className="text-xs font-black tracking-widest text-zinc-100 uppercase">
                  MASTER AUDIO RECORDER // CASSETTE DECK
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    playClick();
                    onClose();
                  }}
                  title="Minimize & Mix (Recording will continue in background)"
                  className="p-1 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    playClick();
                    onClose();
                  }}
                  title="Close Modal"
                  className="p-1 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Skeuomorphic Cassette Tape Graphic */}
            <div className="relative w-full bg-zinc-900 border-2 border-zinc-800 p-3 flex flex-col gap-2 overflow-hidden shadow-inner">
              {/* Cassette Screw Accents */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />

              {/* Label Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1 text-[8px] text-zinc-400 font-black">
                <span className="text-primary font-bold">TYPE II // HIGH BIAS CHROME</span>
                <span className="text-zinc-500 font-mono tracking-widest">{recorderState.format.toUpperCase()} 44.1kHz</span>
              </div>

              {/* Tape Spindles Window */}
              <div className="relative w-full h-16 bg-black border border-zinc-800 rounded-none flex items-center justify-around px-8 shadow-inner overflow-hidden">
                {/* Left Spindle */}
                <div className={cn(
                  "w-12 h-12 rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center relative",
                  recorderState.isRecording && "animate-[spin_4s_linear_infinite]"
                )}>
                  <div className="w-4 h-4 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                  <div className="absolute w-1 h-3 bg-zinc-600 top-0.5" />
                  <div className="absolute w-1 h-3 bg-zinc-600 bottom-0.5" />
                  <div className="absolute h-1 w-3 bg-zinc-600 left-0.5" />
                  <div className="absolute h-1 w-3 bg-zinc-600 right-0.5" />
                </div>

                {/* Central Tape View Window */}
                <div className="flex flex-col items-center justify-center gap-1 z-10">
                  <span className="text-[14px] font-black tracking-widest font-mono text-zinc-100">
                    {formatTime(recorderState.duration)}
                  </span>
                  <span className={cn(
                    "text-[7px] font-bold tracking-widest px-1.5 py-0.2 uppercase font-mono border",
                    recorderState.isRecording 
                      ? "bg-red-950/80 border-red-500 text-red-400 animate-pulse" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-500"
                  )}>
                    {recorderState.isRecording ? "REC ● ACTIVE" : "STANDBY"}
                  </span>
                </div>

                {/* Right Spindle */}
                <div className={cn(
                  "w-12 h-12 rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center relative",
                  recorderState.isRecording && "animate-[spin_3s_linear_infinite]"
                )}>
                  <div className="w-4 h-4 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                  <div className="absolute w-1 h-3 bg-zinc-600 top-0.5" />
                  <div className="absolute w-1 h-3 bg-zinc-600 bottom-0.5" />
                  <div className="absolute h-1 w-3 bg-zinc-600 left-0.5" />
                  <div className="absolute h-1 w-3 bg-zinc-600 right-0.5" />
                </div>
              </div>

              {/* Tape Brand Footer */}
              <div className="flex items-center justify-between text-[7px] text-zinc-500 font-bold uppercase pt-1">
                <span>MASTER CASSETTE C-90</span>
                <span className="text-zinc-400">HX-PRO NR ON</span>
              </div>
            </div>

            {/* Session Settings & Metadata */}
            <div className="grid grid-cols-2 gap-3 text-[8.5px]">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase">SET / TAPE TITLE:</span>
                <input
                  type="text"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  disabled={recorderState.isRecording}
                  className="w-full bg-black border border-zinc-800 text-zinc-200 px-2 py-1 focus:outline-none focus:border-primary disabled:opacity-50 text-[9px] font-bold"
                  placeholder="SET_TITLE"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase">CODEC:</span>
                <div className="flex items-center border border-zinc-800 bg-black p-0.5">
                  {(['wav', 'mp3', 'webm'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => {
                        playClick();
                        setFormat(fmt);
                      }}
                      disabled={recorderState.isRecording}
                      className={cn(
                        "flex-1 py-1 text-center font-black uppercase transition-colors cursor-pointer",
                        format === fmt ? "bg-primary text-black font-black" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-zinc-500 font-bold uppercase">SESSION STATS & CUE EXPORT:</span>
                <div className="p-1.5 bg-black border border-zinc-800 text-zinc-400 flex items-center justify-between gap-2">
                  <span className="text-zinc-300">PLAYED: <strong className="text-white">{playedTrackIds.length} TRACKS</strong> (44.1KHZ PCM)</span>
                  <button
                    onClick={handleDownloadCueSheet}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[8px] font-bold uppercase transition-colors cursor-pointer shrink-0"
                    title="Export .txt tracklist with timestamps"
                  >
                    📄 EXPORT TRACKLIST (.TXT)
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
              <button
                onClick={handleToggleRecord}
                className={cn(
                  "flex-1 py-2.5 px-4 font-mono font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border",
                  recorderState.isRecording
                    ? "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
                    : "bg-primary hover:bg-red-600 text-black hover:text-white border-primary shadow-neon-glow"
                )}
              >
                {recorderState.isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>STOP RECORDING</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>● START RECORDING</span>
                  </>
                )}
              </button>

              {recorderState.isRecording && (
                <button
                  onClick={() => {
                    playClick();
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-[8px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  <Minimize2 className="w-3 h-3 text-primary" />
                  <span>MINIMIZE & MIX</span>
                </button>
              )}

              {recorderState.recordedBlob && !recorderState.isRecording && (
                <button
                  onClick={handleDownload}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD AUDIO ({recorderState.format.toUpperCase()})</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SetRecordingModal;
