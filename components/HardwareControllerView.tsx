'use client';

import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/audioStore';
import { formatPlayheadTime } from '@/lib/mixes';
import { SingleDeckWaveform } from './SingleDeckWaveform';
import { analyzeTrack, getCurrentPhrase } from '@/lib/proTrackAnalysis';

interface HardwareControllerViewProps {
  deviceName: string;
  isDepth?: boolean;
  onOpenTracklist: (deckId: 1 | 2) => void;
  onOpenMIDI: () => void;
}

export function HardwareControllerView({
  deviceName,
  isDepth = true,
  onOpenTracklist,
  onOpenMIDI,
}: HardwareControllerViewProps) {
  const decks = useAudioStore(s => s.decks);
  const deck1 = decks[1] || {};
  const deck2 = decks[2] || {};

  const analysis1 = analyzeTrack(deck1.title || '', deck1.bpm || 120, deck1.duration || 300, deck1.pitch || 0);
  const analysis2 = analyzeTrack(deck2.title || '', deck2.bpm || 120, deck2.duration || 300, deck2.pitch || 0);

  const phrase1 = getCurrentPhrase(deck1.progress || 0, analysis1.phrases);
  const phrase2 = getCurrentPhrase(deck2.progress || 0, analysis2.phrases);

  return (
    <div className="w-full h-full flex flex-col bg-black text-white font-mono select-none overflow-hidden p-2 gap-2">
      
      {/* 1. HARDWARE LINKED HEADER BANNER */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase">
              ⚡ CONTROLLER LINKED // {deviceName || 'GENERIC MIDI HARDWARE'}
            </span>
            <span className="text-[7px] text-zinc-500 uppercase">
              HARDWARE SCREEN MIRROR MODE ACTIVE // PHYSICAL KNOBS & FADERS MAPPED
            </span>
          </div>
        </div>

        <button
          onClick={onOpenMIDI}
          className="px-2 py-1 bg-black border border-zinc-800 hover:border-zinc-700 rounded-none text-[8px] font-bold text-zinc-300 hover:text-white uppercase cursor-pointer transition-all flex items-center gap-1"
        >
          <Cpu className="w-3 h-3 text-primary" />
          <span>MIDI MAPPINGS</span>
        </button>
      </div>

      {/* 2. DUAL STACKED FULL-WIDTH OSCILLOSCOPE WAVEFORMS */}
      <div className="w-full flex flex-col bg-black border border-zinc-900 p-2 gap-1.5 shrink-0">
        {/* Deck 1 Waveform */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[8px] font-bold">
            <span className="text-[#d8163f] truncate max-w-[240px]">1 // {deck1.title || 'NO TRACK'}</span>
            <div className="flex items-center gap-3 text-zinc-400 text-[7.5px]">
              <span className="bg-zinc-900 border border-zinc-800 text-emerald-400 px-1 py-0.2 uppercase font-bold">{phrase1}</span>
              <span>-{formatPlayheadTime(Math.max(0, (deck1.duration || 0) - (deck1.progress || 0)))}</span>
            </div>
          </div>
          <div className="w-full h-11 bg-zinc-950 rounded-none overflow-hidden border border-zinc-900 relative">
            <SingleDeckWaveform deckId={1} deck={deck1} isDepth={isDepth} />
          </div>
        </div>

        {/* Deck 2 Waveform */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[8px] font-bold">
            <span className="text-[#22d3ee] truncate max-w-[240px]">2 // {deck2.title || 'NO TRACK'}</span>
            <div className="flex items-center gap-3 text-zinc-400 text-[7.5px]">
              <span className="bg-zinc-900 border border-zinc-800 text-emerald-400 px-1 py-0.2 uppercase font-bold">{phrase2}</span>
              <span>-{formatPlayheadTime(Math.max(0, (deck2.duration || 0) - (deck2.progress || 0)))}</span>
            </div>
          </div>
          <div className="w-full h-11 bg-zinc-950 rounded-none overflow-hidden border border-zinc-900 relative">
            <SingleDeckWaveform deckId={2} deck={deck2} isDepth={isDepth} />
          </div>
        </div>
      </div>

      {/* 3. DUAL HIGH-DENSITY OLED HARDWARE SCREENS */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        
        {/* DECK 1 OLED SCREEN HUD */}
        <div 
          className="flex flex-col bg-zinc-950 border border-zinc-900 p-2.5 justify-between relative"
          style={{ borderTop: `3px solid #d8163f` }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-zinc-900 pb-1">
            <span className="text-[9px] font-black text-[#d8163f]">DECK 1 // HARDWARE HUD</span>
            <button 
              onClick={() => onOpenTracklist(1)}
              className="text-[7.5px] bg-black border border-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 uppercase font-bold"
            >
              BROWSER 🎵
            </button>
          </div>

          {/* Track Title */}
          <div className="my-1.5">
            <span className="text-[7px] text-zinc-500 font-bold uppercase">TRACK TITLE</span>
            <div className="text-sm font-bold text-white truncate uppercase tracking-tight">{deck1.title || 'NO TRACK LOADED'}</div>
          </div>

          {/* Key Readout Grid */}
          <div className="grid grid-cols-3 gap-2 bg-black border border-zinc-900 p-2 text-center my-1">
            <div>
              <div className="text-[6.5px] text-zinc-500 font-bold uppercase">BPM</div>
              <div className="text-base font-black text-white">{((deck1.bpm || 120) * (1 + (deck1.pitch || 0) / 100)).toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[6.5px] text-zinc-500 font-bold uppercase">CAMELOT KEY</div>
              <div className="text-sm font-black text-amber-400">{analysis1.transposedKey}</div>
            </div>
            <div>
              <div className="text-[6.5px] text-zinc-500 font-bold uppercase">PITCH</div>
              <div className={cn("text-sm font-black", (deck1.pitch || 0) >= 0 ? "text-emerald-400" : "text-amber-400")}>
                {(deck1.pitch || 0) >= 0 ? `+${(deck1.pitch || 0).toFixed(1)}%` : `${(deck1.pitch || 0).toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Phrase & Auto-Gain Readouts */}
          <div className="flex justify-between items-center text-[7.5px] bg-black border border-zinc-900 p-1.5 text-zinc-400 font-bold uppercase">
            <span>PHRASE: <strong className="text-emerald-400">{phrase1}</strong></span>
            <span>GAIN: <strong className="text-zinc-200">{analysis1.autoGainDb >= 0 ? `+${analysis1.autoGainDb}dB` : `${analysis1.autoGainDb}dB`}</strong></span>
            <span>PUNCH: <strong className="text-amber-400">{analysis1.crestFactor.rating}</strong></span>
          </div>
        </div>

        {/* DECK 2 OLED SCREEN HUD */}
        <div 
          className="flex flex-col bg-zinc-950 border border-zinc-900 p-2.5 justify-between relative"
          style={{ borderTop: `3px solid #22d3ee` }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-zinc-900 pb-1">
            <span className="text-[9px] font-black text-[#22d3ee]">DECK 2 // HARDWARE HUD</span>
            <button 
              onClick={() => onOpenTracklist(2)}
              className="text-[7.5px] bg-black border border-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 uppercase font-bold"
            >
              BROWSER 🎵
            </button>
          </div>

          {/* Track Title */}
          <div className="my-1.5">
            <span className="text-[7px] text-zinc-500 font-bold uppercase">TRACK TITLE</span>
            <div className="text-sm font-bold text-white truncate uppercase tracking-tight">{deck2.title || 'NO TRACK LOADED'}</div>
          </div>

          {/* Key Readout Grid */}
          <div className="grid grid-cols-3 gap-2 bg-black border border-zinc-900 p-2 text-center my-1">
            <div>
              <div className="text-[6.5px] text-zinc-500 font-bold uppercase">BPM</div>
              <div className="text-base font-black text-white">{((deck2.bpm || 120) * (1 + (deck2.pitch || 0) / 100)).toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[6.5px] text-zinc-500 font-bold uppercase">CAMELOT KEY</div>
              <div className="text-sm font-black text-amber-400">{analysis2.transposedKey}</div>
            </div>
            <div>
              <div className="text-[6.5px] text-zinc-500 font-bold uppercase">PITCH</div>
              <div className={cn("text-sm font-black", (deck2.pitch || 0) >= 0 ? "text-emerald-400" : "text-amber-400")}>
                {(deck2.pitch || 0) >= 0 ? `+${(deck2.pitch || 0).toFixed(1)}%` : `${(deck2.pitch || 0).toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Phrase & Auto-Gain Readouts */}
          <div className="flex justify-between items-center text-[7.5px] bg-black border border-zinc-900 p-1.5 text-zinc-400 font-bold uppercase">
            <span>PHRASE: <strong className="text-emerald-400">{phrase2}</strong></span>
            <span>GAIN: <strong className="text-zinc-200">{analysis2.autoGainDb >= 0 ? `+${analysis2.autoGainDb}dB` : `${analysis2.autoGainDb}dB`}</strong></span>
            <span>PUNCH: <strong className="text-amber-400">{analysis2.crestFactor.rating}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HardwareControllerView;
