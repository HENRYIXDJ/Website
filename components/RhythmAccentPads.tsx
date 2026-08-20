'use client';

import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audioEngine } from '@/lib/AudioEngine';
import { useAudioStore } from '@/store/audioStore';
import { playClick } from '@/lib/audioUtils';

interface RhythmAccentPadsProps {
  themeColor?: string;
}

export function RhythmAccentPads({ themeColor = '#D8163F' }: RhythmAccentPadsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePad, setActivePad] = useState<string | null>(null);

  const decks = useAudioStore(s => s.decks);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const activeDeckObj = decks[leftActiveDeck] || decks[1];
  const activeBpm = (activeDeckObj?.bpm || 124) * (1 + (activeDeckObj?.pitch || 0) / 100);

  // Pure Web Audio Synthesizers for Zero-Latency Analog Hits
  const triggerAnalogSound = (soundType: '808_KICK' | '909_CLAP' | 'METALLIC_HAT' | 'STUTTER_LASER') => {
    setActivePad(soundType);
    setTimeout(() => setActivePad(null), 120);

    const ctx = audioEngine.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const masterDest = audioEngine.getMasterGainNode() || ctx.destination;

    // 1. 808 SUB KICK
    if (soundType === '808_KICK') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(masterDest);

      osc.start(now);
      osc.stop(now + 0.36);
    }

    // 2. 909 CLAP
    else if (soundType === '909_CLAP') {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = ctx.createGain();
      // Multi-burst clap envelope
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.setValueAtTime(0.01, now + 0.015);
      gain.gain.setValueAtTime(0.8, now + 0.03);
      gain.gain.setValueAtTime(0.01, now + 0.045);
      gain.gain.setValueAtTime(0.9, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(masterDest);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.23);
    }

    // 3. METALLIC HI-HAT
    else if (soundType === 'METALLIC_HAT') {
      const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 10000;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 7000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      ratios.forEach(ratio => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 40 * ratio;
        osc.connect(bandpass);
        osc.start(now);
        osc.stop(now + 0.07);
      });

      bandpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(masterDest);
    }

    // 4. BEAT STUTTER LASER
    else if (soundType === 'STUTTER_LASER') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(masterDest);

      osc.start(now);
      osc.stop(now + 0.17);
    }
  };

  return (
    <div className="bg-zinc-950 border-t border-zinc-900 font-mono select-none">
      {/* Header Toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/90 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[8px] font-black tracking-widest text-zinc-300 uppercase">
            ANALOG ACCENT PADS // 808 & 909 LIVE SAMPLER
          </span>
          <span className="text-[7px] text-zinc-500 font-bold">
            [{activeBpm.toFixed(0)} BPM SYNC]
          </span>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1 text-[7.5px] font-black uppercase text-zinc-400 hover:text-white cursor-pointer"
        >
          <span>{isOpen ? 'COLLAPSE' : 'EXPAND'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Pads Bar (Shown when expanded or compact preview) */}
      {isOpen && (
        <div className="p-2 grid grid-cols-4 gap-1.5 bg-black/60">
          {/* Pad 1: 808 Sub Kick */}
          <button
            onClick={() => triggerAnalogSound('808_KICK')}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-none border transition-all cursor-pointer select-none active:scale-95",
              activePad === '808_KICK'
                ? "bg-red-600 border-red-400 text-white shadow-[0_0_12px_rgba(220,38,38,0.8)] scale-95"
                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-red-600/50 hover:bg-zinc-900"
            )}
          >
            <span className="text-[7px] font-black text-red-400">PAD 1</span>
            <span className="text-[8.5px] font-bold uppercase mt-0.5">808 KICK</span>
            <span className="text-[6px] text-zinc-500 font-mono">SUB 42HZ</span>
          </button>

          {/* Pad 2: 909 Clap */}
          <button
            onClick={() => triggerAnalogSound('909_CLAP')}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-none border transition-all cursor-pointer select-none active:scale-95",
              activePad === '909_CLAP'
                ? "bg-cyan-500 border-cyan-300 text-black shadow-[0_0_12px_rgba(34,211,238,0.8)] scale-95"
                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-cyan-500/50 hover:bg-zinc-900"
            )}
          >
            <span className="text-[7px] font-black text-cyan-400">PAD 2</span>
            <span className="text-[8.5px] font-bold uppercase mt-0.5">909 CLAP</span>
            <span className="text-[6px] text-zinc-500 font-mono">BURST NOISE</span>
          </button>

          {/* Pad 3: Metallic Hat */}
          <button
            onClick={() => triggerAnalogSound('METALLIC_HAT')}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-none border transition-all cursor-pointer select-none active:scale-95",
              activePad === 'METALLIC_HAT'
                ? "bg-emerald-500 border-emerald-300 text-black shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-95"
                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/50 hover:bg-zinc-900"
            )}
          >
            <span className="text-[7px] font-black text-emerald-400">PAD 3</span>
            <span className="text-[8.5px] font-bold uppercase mt-0.5">CLOSED HAT</span>
            <span className="text-[6px] text-zinc-500 font-mono">METALLIC 10K</span>
          </button>

          {/* Pad 4: Stutter Laser */}
          <button
            onClick={() => triggerAnalogSound('STUTTER_LASER')}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-none border transition-all cursor-pointer select-none active:scale-95",
              activePad === 'STUTTER_LASER'
                ? "bg-amber-500 border-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-95"
                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-900"
            )}
          >
            <span className="text-[7px] font-black text-amber-400">PAD 4</span>
            <span className="text-[8.5px] font-bold uppercase mt-0.5">LASER FX</span>
            <span className="text-[6px] text-zinc-500 font-mono">PITCH SWEEP</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default RhythmAccentPads;
