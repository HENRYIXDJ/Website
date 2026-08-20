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
            <div className="relative w-full h-36 bg-zinc-900 border-2 border-zinc-800 p-3 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Cassette Screw Accents */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-700" />

              {/* Label Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1 text-[8px] text-zinc-400 font-black">
                <span className="text-primary font-bold">TYPE II // HIGH BIAS CHROME</span>
                <span className="text-zinc-500">44.1 KHZ / 32-BIT FLOAT</span>
              </div>

              {/* Spools & Central Window */}
              <div className="flex items-center justify-center gap-6 my-auto">
                {/* Left Spool */}
                <div className={cn("w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center", recorderState.isRecording && "animate-spin-slow")}>
                  <div className="w-4 h-4 rounded-full border border-zinc-600 bg-zinc-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  </div>
                </div>

                {/* Center Window */}
                <div className="w-28 h-8 bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[7px] text-zinc-500 font-bold uppercase">RECORD TIME</span>
                  <span className={cn("text-sm font-black font-mono tracking-widest", recorderState.isRecording ? "text-primary animate-pulse" : "text-zinc-300")}>
                    {formatTime(recorderState.duration)}
                  </span>
                </div>

                {/* Right Spool */}
                <div className={cn("w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center", recorderState.isRecording && "animate-spin-slow")}>
                  <div className="w-4 h-4 rounded-full border border-zinc-600 bg-zinc-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Cassette Footer Info */}
              <div className="flex items-center justify-between text-[7px] text-zinc-500 font-bold">
                <span>HENRY IX SOUND SYSTEMS</span>
                <span className={cn(recorderState.isRecording ? "text-red-400 font-black animate-pulse" : "text-zinc-500")}>
                  {recorderState.isRecording ? '● MASTER TAPE RUNNING' : 'READY TO RECORD'}
                </span>
              </div>
            </div>

            {/* Set Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-wider">
                SET / RECORDING TITLE:
              </label>
              <input
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 text-xs font-mono font-bold text-zinc-200 focus:border-primary outline-none"
                placeholder="HENRY_IX_LIVE_SET"
              />
            </div>

            {/* Format Selector & Stats */}
            <div className="grid grid-cols-2 gap-3 text-[8px]">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase">AUDIO ENCODING:</span>
                <div className="flex items-center gap-1 bg-black border border-zinc-800 p-0.5">
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

              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase">SESSION STATS:</span>
                <div className="p-1.5 bg-black border border-zinc-800 text-zinc-400 flex flex-col justify-center gap-0.5">
                  <span className="text-zinc-300">PLAYED IN SET: <strong className="text-white">{playedTrackIds.length} TRACKS</strong></span>
                  <span className="text-zinc-500">MASTER BUS: 44.1KHZ PCM</span>
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
