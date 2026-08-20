'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Eye, Sparkles, Radio, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audioEngine } from '@/lib/AudioEngine';
import { useAudioStore } from '@/store/audioStore';
import { playClick } from '@/lib/audioUtils';
import { detectCamelotKey } from '@/lib/proTrackAnalysis';
import {
  VisualizerEngineMode,
  VisualizerColorTheme,
  VisualizerSymmetry,
  VisualizerAudioSource,
  VisualizerRenderState,
  renderVectorOscilloscope,
  renderCyberGeometry,
  renderWarpTunnel,
  renderSpectrogramTerrain,
  renderParticleVortex,
  renderAsciiMatrix,
  applyCRTScanlines,
  applyChromaticAberration,
  applyKaleidoscope,
} from '@/lib/visualizerEngines';

interface StageVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StageVisualizerModal({ isOpen, onClose }: StageVisualizerModalProps) {
  const [engineMode, setEngineMode] = useState<VisualizerEngineMode>('VECTOR_OSCILLOSCOPE');
  const [colorTheme, setColorTheme] = useState<VisualizerColorTheme>('SYMMETRIC');
  const [symmetry, setSymmetry] = useState<VisualizerSymmetry>('NONE');
  const [audioSource, setAudioSource] = useState<VisualizerAudioSource>('MASTER');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCRTScanlines, setShowCRTScanlines] = useState(true);
  const [showBloom, setShowBloom] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);

  // Live DSP spectrum bar meters for HUD
  const [hudBands, setHudBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isFrozenRef = useRef(isFrozen);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  const decks = useAudioStore(s => s.decks);
  const activeDeckId = Object.keys(decks).find(k => decks[Number(k)]?.isPlaying)
    ? Number(Object.keys(decks).find(k => decks[Number(k)]?.isPlaying))
    : 1;
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

  // Handle microphone input switching
  useEffect(() => {
    if (audioSource === 'MIC') {
      audioEngine.enableMicrophoneInput().catch(() => {});
    } else {
      audioEngine.disableMicrophoneInput();
    }
    return () => {
      if (audioSource === 'MIC') {
        audioEngine.disableMicrophoneInput();
      }
    };
  }, [audioSource]);

  // Performance Keyboard Hotkeys (1-6, C, K, S, B, A, Space, F, V, Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === '1') {
        playClick(900, 'sine', 0.02);
        setEngineMode('VECTOR_OSCILLOSCOPE');
      } else if (e.key === '2') {
        playClick(950, 'sine', 0.02);
        setEngineMode('CYBER_GEOMETRY');
      } else if (e.key === '3') {
        playClick(1000, 'sine', 0.02);
        setEngineMode('WARP_TUNNEL');
      } else if (e.key === '4') {
        playClick(1050, 'sine', 0.02);
        setEngineMode('SPECTROGRAM_TERRAIN');
      } else if (e.key === '5') {
        playClick(1100, 'sine', 0.02);
        setEngineMode('PARTICLE_VORTEX');
      } else if (e.key === '6') {
        playClick(1150, 'sine', 0.02);
        setEngineMode('ASCII_MATRIX');
      } else if (e.key.toLowerCase() === 'c') {
        playClick(850, 'sine', 0.02);
        setColorTheme(prev =>
          prev === 'SYMMETRIC' ? 'RED' :
          prev === 'RED' ? 'CYAN' :
          prev === 'CYAN' ? 'AMBER' :
          prev === 'AMBER' ? 'ACID' : 'SYMMETRIC'
        );
      } else if (e.key.toLowerCase() === 'k') {
        playClick(880, 'sine', 0.02);
        setSymmetry(prev =>
          prev === 'NONE' ? '4_AXIS' :
          prev === '4_AXIS' ? '8_AXIS' : 'NONE'
        );
      } else if (e.key.toLowerCase() === 's') {
        playClick(750, 'sine', 0.02);
        setShowCRTScanlines(prev => !prev);
      } else if (e.key.toLowerCase() === 'b') {
        playClick(800, 'sine', 0.02);
        setShowBloom(prev => !prev);
      } else if (e.key.toLowerCase() === 'a') {
        playClick(820, 'sine', 0.02);
        setAudioSource(prev =>
          prev === 'MASTER' ? 'DECK_1' :
          prev === 'DECK_1' ? 'DECK_2' :
          prev === 'DECK_2' ? 'DECK_3' :
          prev === 'DECK_3' ? 'DECK_4' :
          prev === 'DECK_4' ? 'MIC' : 'MASTER'
        );
      } else if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'v') {
        toggleFullscreen();
      } else if (e.code === 'Space') {
        e.preventDefault();
        playClick(600, 'sine', 0.03);
        setIsFrozen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Audio-reactive Render Loop (60 FPS Procedural Engine)
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let hudThrottle = 0;

    const render = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      if (!isFrozenRef.current) {
        // Resolve active analyser based on selected audio source
        let targetAnalyser: AnalyserNode | null = null;
        if (audioSource === 'MASTER') {
          targetAnalyser = audioEngine.getMasterAnalyser();
        } else if (audioSource === 'DECK_1') {
          targetAnalyser = audioEngine.getDeckAnalyser(1);
        } else if (audioSource === 'DECK_2') {
          targetAnalyser = audioEngine.getDeckAnalyser(2);
        } else if (audioSource === 'DECK_3') {
          targetAnalyser = audioEngine.getDeckAnalyser(3);
        } else if (audioSource === 'DECK_4') {
          targetAnalyser = audioEngine.getDeckAnalyser(4);
        } else if (audioSource === 'MIC') {
          targetAnalyser = audioEngine.getMicAnalyser();
        }

        const bufferLength = targetAnalyser ? targetAnalyser.frequencyBinCount : 128;
        const freqData = new Uint8Array(bufferLength);
        const timeData = new Uint8Array(bufferLength);

        if (targetAnalyser) {
          targetAnalyser.getByteFrequencyData(freqData);
          targetAnalyser.getByteTimeDomainData(timeData);
        } else {
          // Fallback procedural wave generator if sound is stopped
          const t = now * 0.003;
          for (let i = 0; i < bufferLength; i++) {
            freqData[i] = Math.floor(Math.sin(t + i * 0.1) * 45 + 50);
            timeData[i] = Math.floor(Math.sin(t * 2 + i * 0.05) * 30 + 128);
          }
        }

        // Extract 7 Logarithmic Bands & Spectral Flux Onset (Kick & Snare Isolators)
        const logBands = audioEngine.getLogFrequencyBands(targetAnalyser);
        const { isBeat, isKick, isSnare, flux, kickFlux, snareFlux } = audioEngine.getSpectralFluxTransient(targetAnalyser);

        // Update HUD spectrum bars every ~6 frames
        hudThrottle++;
        if (hudThrottle % 6 === 0) {
          setHudBands(logBands.rawBands);
        }

        // Color Theme Resolution
        let mainColor = '#D8163F'; // HENRY IX Red
        let glowColor = 'rgba(216, 22, 63, 0.55)';

        if (colorTheme === 'CYAN') {
          mainColor = '#22D3EE';
          glowColor = 'rgba(34, 211, 238, 0.55)';
        } else if (colorTheme === 'AMBER') {
          mainColor = '#F59E0B';
          glowColor = 'rgba(245, 158, 11, 0.55)';
        } else if (colorTheme === 'ACID') {
          mainColor = '#10B981';
          glowColor = 'rgba(16, 185, 129, 0.55)';
        } else if (colorTheme === 'SYMMETRIC') {
          const deckColors = ['#D8163F', '#22D3EE', '#10B981', '#EAB308'];
          mainColor = deckColors[(activeDeckId - 1) % 4] || '#D8163F';
          glowColor = `${mainColor}90`;
        }

        const renderState: VisualizerRenderState = {
          w,
          h,
          time: now,
          dt,
          bpm: activeBpm,
          colorTheme,
          mainColor,
          glowColor,
          symmetry,
          showScanlines: showCRTScanlines,
          showBloom,
          isBeat,
          isKick,
          isSnare,
          flux,
          kickFlux,
          snareFlux,
          logBands,
          timeData,
          freqData,
        };

        // Render selected procedural engine
        switch (engineMode) {
          case 'VECTOR_OSCILLOSCOPE':
            renderVectorOscilloscope(ctx, renderState);
            break;
          case 'CYBER_GEOMETRY':
            renderCyberGeometry(ctx, renderState);
            break;
          case 'WARP_TUNNEL':
            renderWarpTunnel(ctx, renderState);
            break;
          case 'SPECTROGRAM_TERRAIN':
            renderSpectrogramTerrain(ctx, renderState);
            break;
          case 'PARTICLE_VORTEX':
            renderParticleVortex(ctx, renderState);
            break;
          case 'ASCII_MATRIX':
            renderAsciiMatrix(ctx, renderState);
            break;
        }

        // Optical Post-Processing Shaders
        applyKaleidoscope(ctx, w, h, symmetry);
        applyChromaticAberration(ctx, w, h, flux, isBeat);
        applyCRTScanlines(ctx, w, h, showCRTScanlines);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isOpen,
    engineMode,
    colorTheme,
    symmetry,
    audioSource,
    showCRTScanlines,
    showBloom,
    activeDeckId,
    activeBpm,
  ]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-black flex flex-col justify-between overflow-hidden select-none"
      >
        {/* Fullscreen Visualizer Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block cursor-crosshair" />

        {/* Top Floating Stage HUD */}
        <div className="relative z-20 flex items-center justify-between p-3.5 md:p-4 bg-gradient-to-b from-black/95 via-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-primary/40 text-primary font-mono text-[9px] font-black tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>STAGE MODE // DSP ENGINE</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-zinc-300 font-mono text-[9px]">
              <span className="text-zinc-500">ACTIVE:</span>
              <span className="text-primary font-black uppercase">DECK {activeDeckId}</span>
              <span className="text-zinc-700">|</span>
              <span className="text-white font-bold truncate max-w-[200px]">{activeDeck?.title || 'HENRY IX'}</span>
              <span className="text-amber-400 font-bold">[{camelotKey.code}]</span>
              <span className="text-zinc-400 font-mono">{activeBpm.toFixed(1)} BPM</span>
            </div>

            {/* 7-Band Real-Time Spectrum Meter in HUD */}
            <div className="hidden sm:flex items-end gap-1 h-5 px-2 bg-black/70 border border-zinc-900">
              {hudBands.map((b, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-primary transition-all duration-75"
                  style={{
                    height: `${Math.max(15, b * 100)}%`,
                    opacity: 0.3 + b * 0.7,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Engine Selector Pills */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center bg-zinc-950 border border-zinc-800 p-0.5">
              {(
                [
                  'VECTOR_OSCILLOSCOPE',
                  'CYBER_GEOMETRY',
                  'WARP_TUNNEL',
                  'SPECTROGRAM_TERRAIN',
                  'PARTICLE_VORTEX',
                  'ASCII_MATRIX',
                ] as VisualizerEngineMode[]
              ).map((mode, i) => (
                <button
                  key={mode}
                  onClick={() => {
                    playClick(900 + i * 50, 'sine', 0.02);
                    setEngineMode(mode);
                  }}
                  className={cn(
                    "px-2 py-1 text-[7.5px] font-mono font-black uppercase transition-colors cursor-pointer",
                    engineMode === mode
                      ? "bg-primary text-black font-black shadow-neon-glow"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {i + 1}. {mode.replace('_', ' ').slice(0, 10)}
                </button>
              ))}
            </div>

            {/* Freeze Frame Button */}
            <button
              onClick={() => {
                playClick(600, 'sine', 0.03);
                setIsFrozen(!isFrozen);
              }}
              title="Freeze Frame (Space)"
              className={cn(
                "p-1.5 border font-mono text-[8px] transition-colors cursor-pointer",
                isFrozen ? "border-amber-500 text-amber-400 bg-amber-500/20" : "border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* CRT Toggle Button */}
            <button
              onClick={() => {
                playClick();
                setShowCRTScanlines(!showCRTScanlines);
              }}
              title="Toggle CRT Scanline & Barrel Distortion (S)"
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
              title="Toggle Fullscreen (F/V)"
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

        {/* Bottom Floating Telemetry & Switcher Bar */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 md:p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent font-mono text-[8px] text-zinc-400">
          <div className="flex items-center gap-3">
            {/* Audio Source Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-bold uppercase flex items-center gap-1">
                <Radio className="w-3 h-3 text-primary" /> SRC:
              </span>
              {(['MASTER', 'DECK_1', 'DECK_2', 'DECK_3', 'DECK_4', 'MIC'] as const).map(src => (
                <button
                  key={src}
                  onClick={() => {
                    playClick();
                    setAudioSource(src);
                  }}
                  className={cn(
                    "px-1.5 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer",
                    audioSource === src
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-zinc-900 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {src.replace('_', ' ')}
                </button>
              ))}
            </div>

            <span className="hidden md:inline text-zinc-700">|</span>

            {/* Symmetry Selector */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-zinc-500 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> SYM (K):
              </span>
              {(['NONE', '4_AXIS', '8_AXIS'] as const).map(sym => (
                <button
                  key={sym}
                  onClick={() => {
                    playClick();
                    setSymmetry(sym);
                  }}
                  className={cn(
                    "px-1.5 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer",
                    symmetry === sym
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                      : "border-zinc-900 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {sym.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Color Themes */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 uppercase">THEME (C):</span>
            {(['SYMMETRIC', 'RED', 'CYAN', 'AMBER', 'ACID'] as const).map(th => (
              <button
                key={th}
                onClick={() => {
                  playClick();
                  setColorTheme(th);
                }}
                className={cn(
                  "px-1.5 py-0.5 border text-[7px] font-black uppercase transition-colors cursor-pointer",
                  colorTheme === th
                    ? "bg-white text-black border-white"
                    : "border-zinc-900 text-zinc-500 hover:text-white"
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
