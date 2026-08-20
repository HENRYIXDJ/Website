'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audioEngine } from '@/lib/AudioEngine';
import { useAudioStore } from '@/store/audioStore';
import { playClick } from '@/lib/audioUtils';
import { detectCamelotKey } from '@/lib/proTrackAnalysis';

interface StageVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VisualizerEngineMode = 'ASCII_MATRIX' | 'VECTOR_OSCILLOSCOPE' | 'WARP_TUNNEL';

export function StageVisualizerModal({ isOpen, onClose }: StageVisualizerModalProps) {
  const [engineMode, setEngineMode] = useState<VisualizerEngineMode>('ASCII_MATRIX');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCRTScanlines, setShowCRTScanlines] = useState(true);
  const [colorTheme, setColorTheme] = useState<'RED' | 'CYAN' | 'AMBER' | 'SYMMETRIC'>('SYMMETRIC');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const decks = useAudioStore(s => s.decks);
  const activeDeckId = Object.keys(decks).find(k => decks[Number(k)]?.isPlaying) ? Number(Object.keys(decks).find(k => decks[Number(k)]?.isPlaying)) : 1;
  const activeDeck = decks[activeDeckId] || decks[1];
  const activeBpm = (activeDeck?.bpm || 124) * (1 + (activeDeck?.pitch || 0) / 100);
  const camelotKey = detectCamelotKey(activeDeck?.title || 'HENRY IX', activeBpm);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    playClick(1000, 'sine', 0.03);
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Hotkey V or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === '1') {
        setEngineMode('ASCII_MATRIX');
      } else if (e.key === '2') {
        setEngineMode('VECTOR_OSCILLOSCOPE');
      } else if (e.key === '3') {
        setEngineMode('WARP_TUNNEL');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Audio-reactive Render Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const analyser = audioEngine.getMasterAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const asciiChars = [' ', '░', '▒', '▓', '█', '┼', '─', '│', '▲', '▼', '■', '✦'];
    let rotAngle = 0;
    let tunnelZ = 0;

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      if (analyser) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
      } else {
        // Fallback procedural waveform if no active audio node
        const t = performance.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.floor(Math.sin(t + i * 0.1) * 60 + 80);
          timeData[i] = Math.floor(Math.sin(t * 2 + i * 0.05) * 40 + 128);
        }
      }

      // Calculate bass kick energy
      let bassSum = 0;
      for (let i = 0; i < 8; i++) bassSum += freqData[i];
      const bassEnergy = bassSum / (8 * 255);

      // Symmetrical / Selected accent colors
      let mainColor = '#D8163F'; // HENRY IX Red
      let glowColor = 'rgba(216, 22, 63, 0.5)';
      if (colorTheme === 'CYAN') {
        mainColor = '#22D3EE';
        glowColor = 'rgba(34, 211, 238, 0.5)';
      } else if (colorTheme === 'AMBER') {
        mainColor = '#F59E0B';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      } else if (colorTheme === 'SYMMETRIC') {
        const deckColors = ['#D8163F', '#22D3EE', '#10B981', '#EAB308'];
        mainColor = deckColors[(activeDeckId - 1) % 4] || '#D8163F';
        glowColor = `${mainColor}80`;
      }

      // Clear Canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // --- ENGINE 1: ASCII MATRIX ---
      if (engineMode === 'ASCII_MATRIX') {
        ctx.fillStyle = mainColor;
        ctx.font = '12px var(--font-ocra), monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cols = Math.floor(w / 18);
        const rows = Math.floor(h / 18);

        rotAngle += 0.01 + bassEnergy * 0.02;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const freqIdx = Math.floor(((c + r) / (cols + rows)) * (bufferLength / 2)) % bufferLength;
            const val = freqData[freqIdx] / 255;
            const distFromCenter = Math.hypot(c - cols / 2, r - rows / 2);
            const ripple = Math.sin(distFromCenter * 0.3 - rotAngle * 3) * 0.5 + 0.5;

            const combinedIntensity = Math.min(1, (val * 0.7 + ripple * 0.3) * (1 + bassEnergy * 0.8));
            const charIdx = Math.floor(combinedIntensity * (asciiChars.length - 1));
            const char = asciiChars[charIdx];

            if (char && char !== ' ') {
              ctx.globalAlpha = Math.max(0.15, combinedIntensity);
              ctx.fillStyle = combinedIntensity > 0.8 ? '#FFFFFF' : mainColor;
              ctx.fillText(char, c * 18 + 9, r * 18 + 9);
            }
          }
        }
        ctx.globalAlpha = 1.0;

        // Central Cyber Emblem
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotAngle);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2 + bassEnergy * 4;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20 * bassEnergy;

        const size = Math.min(w, h) * 0.25 * (1 + bassEnergy * 0.3);
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // --- ENGINE 2: VECTOR OSCILLOSCOPE ---
      else if (engineMode === 'VECTOR_OSCILLOSCOPE') {
        ctx.lineWidth = 2.5 + bassEnergy * 3;
        ctx.strokeStyle = mainColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;

        // Lissajous XY Scope in Center
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.3 * (1 + bassEnergy * 0.35);

        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const t1 = (timeData[i] / 128.0 - 1.0);
          const t2 = (timeData[(i + Math.floor(bufferLength / 4)) % bufferLength] / 128.0 - 1.0);

          const x = centerX + t1 * radius;
          const y = centerY + t2 * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Horizontal Stereo Time Waveform
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.shadowBlur = 8;
        const sliceWidth = w / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      // --- ENGINE 3: WARP TUNNEL ---
      else if (engineMode === 'WARP_TUNNEL') {
        tunnelZ += 0.05 + bassEnergy * 0.15;
        const centerX = w / 2;
        const centerY = h / 2;
        const rings = 18;

        for (let i = 0; i < rings; i++) {
          const ringProgress = (i / rings + tunnelZ) % 1;
          const ringRadius = Math.pow(ringProgress, 2) * Math.min(w, h) * 0.7;
          const freqIdx = Math.floor(ringProgress * (bufferLength / 2));
          const ringEnergy = freqData[freqIdx] / 255;

          ctx.strokeStyle = ringProgress > 0.8 ? '#FFFFFF' : mainColor;
          ctx.lineWidth = (1 - ringProgress) * 3 + ringEnergy * 4;
          ctx.globalAlpha = Math.min(1, ringProgress * 1.5);
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 10 * ringEnergy;

          // Polygonal 8-sided ring
          ctx.beginPath();
          const sides = 8;
          for (let s = 0; s <= sides; s++) {
            const angle = (s / sides) * Math.PI * 2 + tunnelZ * 0.5;
            const px = centerX + Math.cos(angle) * (ringRadius + ringEnergy * 40);
            const py = centerY + Math.sin(angle) * (ringRadius + ringEnergy * 40);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, engineMode, colorTheme, activeDeckId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between overflow-hidden select-none"
      >
        {/* Visualizer Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

        {/* Optional Retro CRT Scanline Overlay */}
        {showCRTScanlines && (
          <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70" />
        )}

        {/* Top Floating Stage HUD */}
        <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-primary/40 text-primary font-mono text-[9px] font-black tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>STAGE MODE // BROADCAST</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-zinc-300 font-mono text-[9px]">
              <span className="text-zinc-500">ACTIVE:</span>
              <span className="text-primary font-black uppercase">DECK {activeDeckId}</span>
              <span className="text-zinc-700">|</span>
              <span className="text-white font-bold truncate max-w-[200px]">{activeDeck?.title || 'HENRY IX'}</span>
              <span className="text-amber-400 font-bold">[{camelotKey.code}]</span>
              <span className="text-zinc-400 font-mono">{activeBpm.toFixed(1)} BPM</span>
            </div>
          </div>

          {/* Engine Selector & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5">
              {(['ASCII_MATRIX', 'VECTOR_OSCILLOSCOPE', 'WARP_TUNNEL'] as VisualizerEngineMode[]).map((mode, i) => (
                <button
                  key={mode}
                  onClick={() => {
                    playClick(900 + i * 100, 'sine', 0.02);
                    setEngineMode(mode);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[8px] font-mono font-black uppercase transition-colors cursor-pointer",
                    engineMode === mode
                      ? "bg-primary text-black font-black shadow-neon-glow"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {i + 1}. {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* CRT Toggle */}
            <button
              onClick={() => {
                playClick();
                setShowCRTScanlines(!showCRTScanlines);
              }}
              title="Toggle CRT Scanline Overlay"
              className={cn(
                "p-1.5 border font-mono text-[8px] transition-colors cursor-pointer",
                showCRTScanlines ? "border-primary text-primary bg-primary/10" : "border-zinc-800 text-zinc-500"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              title="Exit Stage Mode (Esc)"
              className="p-1.5 border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-primary hover:text-black transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Telemetry Bar */}
        <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent font-mono text-[8px] text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="tracking-widest uppercase text-zinc-500">
              AUDIO DSP: <span className="text-emerald-400 font-bold">44.1KHZ 32-BIT FLOAT</span>
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">
              KEYS: <span className="text-zinc-300 font-bold">[1] [2] [3] ENGINE // [ESC] CLOSE</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 uppercase">THEME:</span>
            {(['SYMMETRIC', 'RED', 'CYAN', 'AMBER'] as const).map(th => (
              <button
                key={th}
                onClick={() => {
                  playClick();
                  setColorTheme(th);
                }}
                className={cn(
                  "px-1.5 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer",
                  colorTheme === th ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-500 hover:text-white"
                )}
              >
                {th}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StageVisualizerModal;
