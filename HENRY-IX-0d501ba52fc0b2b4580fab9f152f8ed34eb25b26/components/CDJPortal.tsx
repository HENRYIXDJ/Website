'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Play, Pause, CircleDot, Music2, Disc, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- MODULAR IMPORTS ---
import { playClick, playTick, playTabClick } from '@/lib/audioUtils';
import { audioEngine } from '@/lib/AudioEngine';
import { SynthesizerKnob, RotaryKnob, SplitFlapText, LEDEqualizer } from '@/components/DJComponents';
import AudioVisualizerBackground from './AudioVisualizerBackground';
import { useAudio } from './AudioProvider';
import { useAudioStore } from '@/store/audioStore';


const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getSessionImage = (title: string) => {
  if (!title) return '/Knight Club Artwork/Session 1.jpg';
  if (title.includes('Knight Club') && title.includes('Session 1')) return '/Knight Club Artwork/Session 1.jpg';
  if (title.includes('Knight Club') && title.includes('Session 2')) return '/Knight Club Artwork/Session 2.jpg';
  if (title.includes('Knight Club') && title.includes('Session 3')) return '/Knight Club Artwork/Session 3.jpg';
  if (title.includes('Knight Club') && title.includes('Session 4')) return '/Knight Club Artwork/Session 4.jpg';
  
  if (title.includes('Royal Court') && title.includes('Session 1')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.png';
  if (title.includes('Royal Court') && title.includes('Session 2')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.png';
  
  if (title.includes('Corner New Cross') && title.includes('Night 1')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Artwork/CNC%20N1%20Artwork.png';
  if (title.includes('Corner New Cross') && title.includes('Night 2')) return 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Artwork/CNC%20N2%20Artwork.png';

  // Fallbacks if just matching session
  if (title.includes('Session 1')) return '/Knight Club Artwork/Session 1.jpg';
  if (title.includes('Session 2')) return '/Knight Club Artwork/Session 2.jpg';
  if (title.includes('Session 3')) return '/Knight Club Artwork/Session 3.jpg';
  if (title.includes('Session 4')) return '/Knight Club Artwork/Session 4.jpg';
  
  return '/Knight Club Artwork/Session 1.jpg';
};

const getTrackDescription = (title: string, isLocalFile: boolean) => {
  const lower = title.toLowerCase();
  if (lower.includes('knight club')) return "Born to jest, forced to Joust.";
  if (lower.includes('royal court')) return "Lose your mind in The Great Hall.";
  if (lower.includes('corner new cross')) return "Recorded live. A past residency.";
  return `Recorded live. Features high quality uncompressed audio ${isLocalFile ? "directly from the studio." : "via SoundCloud Integration."}`;
};


// RotaryKnob is imported from @/components/DJComponents

// A custom responsive double-deck horizontal scrolling waveform monitor - Stacked Beatgrid Controller
function DualDeckWaveforms({ 
  leftDeck, 
  rightDeck, 
  isDepth,
  audioElementsRef
}: { 
  leftDeck: any; 
  rightDeck: any; 
  isDepth: boolean;
  audioElementsRef?: React.RefObject<Record<number, HTMLAudioElement | null>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftDeckRef = useRef(leftDeck);
  const rightDeckRef = useRef(rightDeck);
  const hashCacheRef = useRef<Record<string, { f1: number; f2: number; f3: number }>>({});

  const lastFrameTimeRef = useRef<number>(0);
  const smoothProgressRef = useRef<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const lastReportedProgressRef = useRef<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const [dragState, setDragState] = useState<{
    deckNum: number;
    startX: number;
    startTime: number;
    duration: number;
    startOffset: number;
    isShift: boolean;
  } | null>(null);

  const dragStateRef = useRef(dragState);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Sync refs to prevent canvas useEffect re-triggering and starving browser repaint
  useEffect(() => {
    leftDeckRef.current = leftDeck;
    rightDeckRef.current = rightDeck;
  }, [leftDeck, rightDeck]);

  // Helper for deterministic hash to generate unique waveform for each track
  const hashCode = (str: string) => {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

  // Get waveform height at a specific time sample (deterministic audio fingerprinting mimicking real mastered EDM)
  const getWaveformHeight = (trackId: string, idx: number, duration = 300) => {
    if (!trackId) return 0.02;
    
    // Convert idx back to track progress
    const barTime = idx / 14;
    const progress = Math.max(0, Math.min(1, barTime / duration));
    
    // Deterministic seed based on trackId
    let hash = 0;
    for (let i = 0; i < trackId.length; i++) {
      hash = (hash << 5) - hash + trackId.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    
    // Deterministic variations in structure based on seed
    const introLen = 0.1 + (seed % 5) * 0.02; // 0.10 to 0.18
    const breakdownStart = 0.45 + ((seed >> 2) % 5) * 0.03; // 0.45 to 0.57
    const breakdownLen = 0.12 + ((seed >> 4) % 4) * 0.03; // 0.12 to 0.21
    const secondDropStart = breakdownStart + breakdownLen;
    const outroStart = 0.85 + ((seed >> 6) % 3) * 0.03; // 0.85 to 0.91
    
    let envelope = 0.15;
    let transientFrequency = 8; // ticks spacing
    let transientStrength = 0.4;
    let compressIntensity = 1.0; // multiplier to represent high limiter density
    
    if (progress < introLen) {
      // 1. Intro Beats: periodic kicks
      envelope = 0.25;
      transientFrequency = 14; // every 1 second
      transientStrength = 0.65;
      compressIntensity = 0.4;
    } else if (progress < breakdownStart - 0.08) {
      // 2. Main Drop 1 / Verse: dense beats
      envelope = 0.7;
      transientFrequency = 7; // double speed kicks
      transientStrength = 0.35;
      compressIntensity = 1.0;
    } else if (progress < breakdownStart) {
      // 3. Build-up 1: accelerating transients, ramping volume
      const buildProgress = (progress - (breakdownStart - 0.08)) / 0.08;
      envelope = 0.3 + 0.5 * buildProgress;
      transientFrequency = buildProgress > 0.75 ? 2 : buildProgress > 0.4 ? 4 : 7;
      transientStrength = 0.3 + 0.35 * buildProgress;
      compressIntensity = 0.6 + 0.4 * buildProgress;
    } else if (progress < secondDropStart - 0.08) {
      // 4. Breakdown / Melodic section: quiet, no heavy transients
      const breakProgress = (progress - breakdownStart) / (breakdownLen - 0.08);
      envelope = 0.18 + 0.12 * Math.sin(breakProgress * Math.PI);
      transientFrequency = 28; // very sparse
      transientStrength = 0.15;
      compressIntensity = 0.3;
    } else if (progress < secondDropStart) {
      // 5. Build-up 2: massive accelerating rise
      const buildProgress = (progress - (secondDropStart - 0.08)) / 0.08;
      envelope = 0.25 + 0.65 * buildProgress;
      transientFrequency = buildProgress > 0.8 ? 1 : buildProgress > 0.5 ? 2 : 4;
      transientStrength = 0.2 + 0.5 * buildProgress;
      compressIntensity = 0.5 + 0.5 * buildProgress;
    } else if (progress < outroStart) {
      // 6. Main Climax / Drop 2: ultimate heavy compressed energy
      envelope = 0.85;
      transientFrequency = 7;
      transientStrength = 0.25;
      compressIntensity = 1.2;
    } else {
      // 7. Outro: sparse decay
      const outroProgress = (progress - outroStart) / (1 - outroStart);
      envelope = 0.4 * (1 - outroProgress) + 0.05;
      transientFrequency = 14;
      transientStrength = 0.5 * (1 - outroProgress);
      compressIntensity = 0.4 * (1 - outroProgress);
    }
    
    // Add multi-layered pink/white noise for real analog master tracks
    const t1 = Math.sin(idx * 0.47 + seed) * 0.15;
    const t2 = Math.cos(idx * 0.93 - seed) * 0.10;
    const t3 = Math.sin(idx * 3.17 + (seed % 10)) * 0.06;
    const t4 = Math.sin(idx * 9.71) * 0.04;
    const spectralNoise = t1 + t2 + t3 + t4;
    
    // Add kick drum transient spikes (pure vertical impulses)
    const isKick = (idx % transientFrequency === 0);
    const kickTransient = isKick ? (transientStrength + 0.08 * Math.sin(idx * 1.3)) : 0.0;
    
    // Calculate final composite height
    let value = (envelope + spectralNoise) * compressIntensity + kickTransient;
    
    // Add extra random tiny organic micro-variation (simulate minor ambient instruments)
    const organicJitter = Math.sin(idx * 0.015) * 0.05 + (Math.sin(idx * 12.5) * 0.02);
    value += organicJitter;
    
    // Apply compressor ceiling to emulate dynamic range compression of masters
    const compressed = value > 0.75 
      ? 0.75 + (value - 0.75) * 0.25 // smooth soft-knee limiter
      : value;
      
    // Return clamped amplitude
    return Math.max(0.02, Math.min(0.98, compressed));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const render = () => {
      // Ensure canvas matches dynamic container dimensions
      const width = canvas.parentElement?.clientWidth || 800;
      const height = 100;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. CHASSIS BACKGROUND
      ctx.fillStyle = '#070709'; // Deep dark chassis background
      ctx.fillRect(0, 0, width, height);

      // Horizontal central splits
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      
      const topLaneHeight = 44;
      const bottomLaneHeight = 44;
      const gutterHeight = 12;
      const topLaneY = 0;
      const gutterY = topLaneHeight;
      const bottomLaneY = gutterY + gutterHeight;

      // Draw gutters
      ctx.fillStyle = '#040405';
      ctx.fillRect(0, gutterY, width, gutterHeight);
      ctx.strokeStyle = '#1a1a1f';
      ctx.beginPath();
      ctx.moveTo(0, gutterY);
      ctx.lineTo(width, gutterY);
      ctx.moveTo(0, gutterY + gutterHeight);
      ctx.lineTo(width, gutterY + gutterHeight);
      ctx.stroke();

      // Middle Sync Beat-align guidelines
      ctx.strokeStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      const pixelsPerSecond = 55;
      const barWidth = 4;
      const gap = 1;
      const step = barWidth + gap;

      const now = performance.now();
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = now;
      }
      const rawDt = (now - lastFrameTimeRef.current) / 1000;
      const dt = Math.min(0.1, rawDt); // clamp to avoid giant jumps
      lastFrameTimeRef.current = now;

      // Calculate smooth progresses for both decks
      const getSmoothProgress = (deck: any, dtVal: number) => {
        if (!deck) return 0;
        const deckNum = deck.deckNum;
        
        let targetProgress = deck.progress || 0;
        let isCurrentlyPlaying = deck.isPlaying;

        if (!deck.scMode && audioElementsRef?.current) {
          const audio = audioElementsRef.current[deckNum];
          if (audio && audio.src) {
            targetProgress = audio.currentTime;
            isCurrentlyPlaying = !audio.paused;
          }
        }

        const currentSmooth = smoothProgressRef.current[deckNum] ?? targetProgress;
        const reportedLast = lastReportedProgressRef.current[deckNum] ?? targetProgress;
        
        const hasJumped = Math.abs(targetProgress - reportedLast) > 0.3 || Math.abs(currentSmooth - targetProgress) > 0.5;

        if (hasJumped) {
          smoothProgressRef.current[deckNum] = targetProgress;
          lastReportedProgressRef.current[deckNum] = targetProgress;
          return targetProgress;
        }

        lastReportedProgressRef.current[deckNum] = targetProgress;

        if (isCurrentlyPlaying) {
          const pitchModifier = 1 + (deck.pitch || 0) / 100;
          let nextSmooth = currentSmooth + dtVal * pitchModifier;

          // Nudge drift correction
          const drift = targetProgress - nextSmooth;
          nextSmooth += drift * 0.05;

          smoothProgressRef.current[deckNum] = nextSmooth;
          return nextSmooth;
        } else {
          smoothProgressRef.current[deckNum] = targetProgress;
          return targetProgress;
        }
      };

      const progressLeft = getSmoothProgress(leftDeckRef.current, dt);
      const progressRight = getSmoothProgress(rightDeckRef.current, dt);

      // Check phase alignment (kick drums match)
      const bpmLeft = leftDeckRef.current ? leftDeckRef.current.bpm * (1 + (leftDeckRef.current.pitch || 0) / 100) : 120;
      const bpmRight = rightDeckRef.current ? rightDeckRef.current.bpm * (1 + (rightDeckRef.current.pitch || 0) / 100) : 120;

      const beatIntervalLeft = 60 / bpmLeft;
      const beatIntervalRight = 60 / bpmRight;

      const phaseLeft = (progressLeft % beatIntervalLeft) / beatIntervalLeft;
      const phaseRight = (progressRight % beatIntervalRight) / beatIntervalRight;
      const isPhaseAligned = Math.abs(phaseLeft - phaseRight) < 0.08 || 
                             Math.abs(phaseLeft - phaseRight - 1) < 0.08 || 
                             Math.abs(phaseLeft - phaseRight + 1) < 0.08;

      const drawDeckWave = (deck: any, progress: number, laneY: number, laneH: number, isLeft: boolean) => {
        if (!deck) return;
        const isLocked = deck.id === 'locked';

        ctx.save();
        ctx.translate(0, laneY);

        // Grid lines behind waveform
        ctx.strokeStyle = 'rgba(39, 39, 42, 0.2)';
        ctx.lineWidth = 0.5;

        // Current adjusted BPM
        const currentBpm = deck.bpm * (1 + (deck.pitch || 0) / 100);
        const beatInterval = 60 / currentBpm;
        const beatFreq = (2 * Math.PI) / beatInterval;

        const centerX = width / 2;

        const offset = deck.firstBeatOffset || 0;
        const visibleRangeSec = centerX / pixelsPerSecond;
        const startBeat = Math.floor((progress - offset - visibleRangeSec) / beatInterval);
        const endBeat = Math.ceil((progress - offset + visibleRangeSec) / beatInterval);

        // Draw Beatgrid lines and BAR numbers / ticks
        for (let b = startBeat; b <= endBeat; b++) {
          const beatTime = offset + b * beatInterval;
          const x = centerX + (beatTime - progress) * pixelsPerSecond;
          if (x >= 0 && x <= width) {
            const isMajorBar = b % 4 === 0;
            ctx.strokeStyle = isMajorBar ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = isMajorBar ? 1.5 : 0.75;
            ctx.beginPath();
            ctx.moveTo(x, 2);
            ctx.lineTo(x, laneH - 2);
            ctx.stroke();

            // Draw BAR label or small triangle ticks on outer boundaries
            if (isMajorBar && b >= 0) {
              ctx.fillStyle = 'rgba(255, 255, 255, 1)';
              ctx.font = 'bold 8.5px monospace';
              ctx.shadowColor = 'rgba(0,0,0,1)';
              ctx.shadowBlur = 4;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              const barNum = Math.floor(b / 4) + 1;
              ctx.fillText(`BAR ${barNum}`, x, 3);
              ctx.shadowBlur = 0; // reset
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
              ctx.beginPath();
              if (isLeft) {
                // Top boundary pointing down
                ctx.moveTo(x - 2, 0);
                ctx.lineTo(x + 2, 0);
                ctx.lineTo(x, 3);
              } else {
                // Bottom boundary pointing up
                ctx.moveTo(x - 2, laneH);
                ctx.lineTo(x + 2, laneH);
                ctx.lineTo(x, laneH - 3);
              }
              ctx.fill();
            }
          }
        }

        if (isLocked) {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.02)';
          ctx.fillRect(0, 0, width, laneH);
          
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.1)';
          ctx.lineWidth = 4;
          const stripeWidth = 24;
          const stripeOffset = (progress * 15) % stripeWidth;
          ctx.beginPath();
          for (let x = -stripeWidth; x < width + stripeWidth; x += stripeWidth) {
            ctx.moveTo(x + stripeOffset, 0);
            ctx.lineTo(x + stripeOffset + 12, laneH);
          }
          ctx.stroke();

          ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText("COMING SOON // PRE-SEQUENCER LOCK", width / 2, laneH / 2);
        } else {
          const halfH = laneH / 2;
          const PEAK_DENSITY = 4; // Matches the generated trackWaveforms density

          const getPeakHeight = (time: number) => {
            if (time < 0 || time > (deck.duration || 300)) return 0.02;
            if (deck.waveformPeaks && deck.waveformPeaks.length > 0) {
              const exactIdx = time * PEAK_DENSITY;
              const idxBase = Math.floor(exactIdx);
              const fract = exactIdx - idxBase;
              
              const p0 = deck.waveformPeaks[idxBase] !== undefined 
                ? deck.waveformPeaks[idxBase] 
                : 0.02;
              const p1 = deck.waveformPeaks[idxBase + 1] !== undefined 
                ? deck.waveformPeaks[idxBase + 1] 
                : p0;
              return p0 + (p1 - p0) * fract;
            } else {
              const idx = Math.floor(time * 14);
              return getWaveformHeight(deck.id, idx, deck.duration || 300);
            }
          };

          const points: { drawX: number; lowH: number; midH: number; highH: number }[] = [];

          for (let drawX = 0; drawX < width; drawX += 2) {
            const barTime = progress + (drawX - centerX) / pixelsPerSecond;
            const hVal = getPeakHeight(barTime);

            const eqLow = deck.eqLow ?? 50;
            const eqMid = deck.eqMid ?? 50;
            const eqHi = deck.eqHi ?? 50;
            const volume = deck.volume ?? 80;
            
            const lowMod = eqLow / 50;
            const midMod = eqMid / 50;
            const hiMod = eqHi / 50;
            const volumeMod = volume / 80;
            
            // Dynamic frequency decomposition: Low, Mid, High stacked waves
            // Align low-frequency volume peak with exactly the beat line (using Math.cos instead of Math.sin)
            const baseLow = hVal * (0.6 + 0.4 * Math.abs(Math.cos((barTime - offset) * beatFreq)));
            const baseMid = hVal * (0.55 + 0.45 * Math.abs(Math.cos((barTime - offset) * 1.8 + 0.5)));
            const baseHigh = hVal * (0.4 + 0.6 * Math.abs(Math.cos((barTime - offset) * beatFreq * 4 + 1.2)));

            const lowHeight = Math.max(1, baseLow * (laneH - 6) * lowMod * volumeMod);
            const midHeight = Math.max(1, baseMid * (laneH - 10) * midMod * volumeMod);
            const highHeight = Math.max(1, baseHigh * (laneH - 14) * hiMod * volumeMod);

            points.push({ drawX, lowH: lowHeight, midH: midHeight, highH: highHeight });
          }

          // 1. Low Band (Vivid Cyan/Blue foundation)
          ctx.fillStyle = 'rgba(0, 162, 255, 1)';
          ctx.beginPath();
          ctx.moveTo(0, halfH);
          for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].drawX, halfH - points[i].lowH / 2);
          }
          for (let i = points.length - 1; i >= 0; i--) {
            ctx.lineTo(points[i].drawX, halfH + points[i].lowH / 2);
          }
          ctx.closePath();
          ctx.fill();

          // 2. Mid Band (Vivid Neon Orange)
          ctx.fillStyle = 'rgba(255, 120, 0, 1)';
          ctx.beginPath();
          ctx.moveTo(0, halfH);
          for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].drawX, halfH - points[i].midH / 2);
          }
          for (let i = points.length - 1; i >= 0; i--) {
            ctx.lineTo(points[i].drawX, halfH + points[i].midH / 2);
          }
          ctx.closePath();
          ctx.fill();

          // 3. High Band (Pure Bright White)
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.beginPath();
          ctx.moveTo(0, halfH);
          for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].drawX, halfH - points[i].highH / 2);
          }
          for (let i = points.length - 1; i >= 0; i--) {
            ctx.lineTo(points[i].drawX, halfH + points[i].highH / 2);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      };

      drawDeckWave(leftDeckRef.current, progressLeft, topLaneY, topLaneHeight, true);
      drawDeckWave(rightDeckRef.current, progressRight, bottomLaneY, bottomLaneHeight, false);

      const isSyncGlow = leftDeckRef.current?.isPlaying && rightDeckRef.current?.isPlaying && isPhaseAligned;

      // 2. CENTER PLAYHEAD LINE (GLOWING CRIMSON)
      ctx.save();
      ctx.strokeStyle = '#d8163f';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#d8163f';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.restore();

      // Top tip indicator (Deck A)
      ctx.save();
      ctx.fillStyle = isSyncGlow ? '#10b981' : '#ef4444';
      if (isSyncGlow) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(width / 2 - 5, 0);
      ctx.lineTo(width / 2 + 5, 0);
      ctx.lineTo(width / 2, 6);
      ctx.fill();
      ctx.restore();

      // Bottom tip indicator (Deck B)
      ctx.save();
      ctx.fillStyle = isSyncGlow ? '#10b981' : '#06b6d4';
      if (isSyncGlow) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(width / 2 - 5, height);
      ctx.lineTo(width / 2 + 5, height);
      ctx.lineTo(width / 2, height - 6);
      ctx.fill();
      ctx.restore();

      // Sleek phase sync diamond in the center gutter
      ctx.save();
      ctx.fillStyle = isSyncGlow ? '#10b981' : '#27272a';
      if (isSyncGlow) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(width / 2 - 4, gutterY + 4);
      ctx.lineTo(width / 2, gutterY + 1);
      ctx.lineTo(width / 2 + 4, gutterY + 4);
      ctx.lineTo(width / 2, gutterY + 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. GLOSSY HUD BADGE OVERLAY DURING DRAGGING
      const drag = dragStateRef.current;
      if (drag) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 10, 12, 0.9)';
        ctx.strokeStyle = drag.isShift ? '#f59e0b' : '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.font = 'bold 9px monospace';
        
        const badgeY = drag.deckNum === leftDeckRef.current?.deckNum ? 8 : height - 22;
        const offsetVal = (leftDeckRef.current?.deckNum === drag.deckNum 
          ? leftDeckRef.current?.firstBeatOffset 
          : rightDeckRef.current?.firstBeatOffset) || 0;
          
        const timeVal = leftDeckRef.current?.deckNum === drag.deckNum ? progressLeft : progressRight;
        
        const text = drag.isShift 
          ? `[SHIFT] GRID ADJUST: Offset ${offsetVal.toFixed(3)}s (Release to save)` 
          : `[DRAG] SCRATCH SEEK: ${timeVal.toFixed(2)}s`;
          
        const textWidth = ctx.measureText(text).width;
        const badgeW = textWidth + 16;
        const badgeH = 14;
        const badgeX = (width - badgeW) / 2;
        
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
          ctx.fill();
          ctx.stroke();
        }
        
        ctx.fillStyle = drag.isShift ? '#f59e0b' : '#3b82f6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, badgeY + badgeH / 2 + 0.5);
        ctx.restore();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [audioElementsRef]);

  const pixelsPerSecond = 55;

  const handleStart = (clientX: number, clientY: number, isShift: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleY = y * (100 / rect.height);
    let targetDeck: any = null;

    if (scaleY >= 0 && scaleY <= 44) {
      targetDeck = leftDeckRef.current;
    } else if (scaleY >= 56 && scaleY <= 100) {
      targetDeck = rightDeckRef.current;
    }

    if (!targetDeck || targetDeck.id === 'locked') return;

    const deckNum = targetDeck.deckNum;
    const audio = audioElementsRef?.current?.[deckNum];
    const startTime = audio ? audio.currentTime : (targetDeck.progress || 0);
    const duration = audio ? audio.duration : (targetDeck.duration || 300);
    const startOffset = targetDeck.firstBeatOffset || 0;

    setDragState({
      deckNum,
      startX: clientX,
      startTime,
      duration,
      startOffset,
      isShift
    });
  };

  const handleMove = (clientX: number) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const deltaX = clientX - drag.startX;
    const deltaSec = deltaX / pixelsPerSecond;

    if (drag.isShift) {
      const newOffset = drag.startOffset + deltaSec;
      useAudioStore.getState().setDeck(drag.deckNum, { firstBeatOffset: newOffset });
    } else {
      const audio = audioElementsRef?.current?.[drag.deckNum];
      const newTime = Math.max(0, Math.min(drag.duration, drag.startTime - deltaSec));
      if (audio) {
        // eslint-disable-next-line react-hooks/immutability
        audio.currentTime = newTime;
      }
      useAudioStore.getState().setDeck(drag.deckNum, { progress: newTime });
    }
  };

  const handleEnd = () => {
    setDragState(null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStart(e.clientX, e.clientY, e.shiftKey);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handleMove(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    handleEnd();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    handleEnd();
  };

  const cursorClass = dragState 
    ? (dragState.isShift ? 'cursor-ew-resize' : 'cursor-grabbing') 
    : 'cursor-grab';

  const leftBpm = leftDeck ? (leftDeck.bpm * (1 + (leftDeck.pitch || 0) / 100)).toFixed(2) : "0.00";
  const rightBpm = rightDeck ? (rightDeck.bpm * (1 + (rightDeck.pitch || 0) / 100)).toFixed(2) : "0.00";

  return (
    <div className={cn(
      "w-full rounded-xl bg-zinc-950 border p-2 md:p-2.5 z-10 shrink-0 select-none shadow-2xl relative flex flex-col gap-1 overflow-hidden",
      isDepth ? "border-zinc-900" : "border-black/10"
    )}>
      <div className="flex justify-between items-center w-full shrink-0 font-mono text-[9px] md:text-[10px]">
        <div className="flex items-center gap-3 font-bold text-zinc-500 uppercase tracking-widest leading-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-orange-500 font-black">DECK A</span>
            <span className="text-zinc-700">{"//"}</span>
            <span className="text-zinc-300 max-w-[150px] truncate">{leftDeck?.title || "EMPTY"}</span>
          </div>
          <div className="bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/80 text-orange-400 font-bold">
            {leftBpm} <span className="text-[7px] text-zinc-500 font-normal">BPM</span>
          </div>
        </div>

        <div className="text-[7.5px] text-zinc-600 font-black tracking-[0.25em] uppercase text-center hidden lg:block">
          STACKED BEATGRID CONTROLLER v9.5
        </div>

        <div className="flex items-center gap-3 font-bold text-zinc-500 uppercase tracking-widest leading-none">
          <div className="bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/80 text-cyan-400 font-bold">
            {rightBpm} <span className="text-[7px] text-zinc-500 font-normal">BPM</span>
          </div>
          <div className="flex items-center gap-1 text-right">
            <span className="text-zinc-300 max-w-[150px] truncate">{rightDeck?.title || "EMPTY"}</span>
            <span className="text-zinc-700">{"//"}</span>
            <span className="text-cyan-400 font-black">DECK B</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="relative w-full h-[100px] bg-black rounded border border-zinc-900 overflow-hidden shadow-inner flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/[0.005] pointer-events-none z-10" />
        <canvas 
          ref={canvasRef} 
          className={cn("w-full h-full block touch-none", cursorClass)} 
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      </div>

      <div className="flex justify-between items-center w-full font-mono text-[7px] text-zinc-500 tracking-wider shrink-0 uppercase border-t border-zinc-900/50 pt-1.5 px-1 select-none">
        <div className="flex items-center gap-2">
          <span className="text-orange-500/80 font-bold">GRID QUANTIZE 1/4</span>
          <span className="text-zinc-700">|</span>
          <span className={cn("font-bold", leftDeck?.isPlaying ? "text-green-500" : "text-zinc-600")}>
            {leftDeck?.isPlaying ? "● MASTER_SYNC_LOCKED" : "○ SYNC_READY"}
          </span>
        </div>
        <div className="hidden sm:block text-zinc-600">
          <span>PLAYHEAD CENTRAL SNAP INDEX</span>
        </div>
        <div className="flex items-center gap-2 text-right">
          <span className={cn("font-bold", rightDeck?.isPlaying ? "text-green-500" : "text-zinc-600")}>
            {rightDeck?.isPlaying ? "● SLAVE_SYNC_LOCKED" : "○ SYNC_READY"}
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-cyan-500/80 font-bold">GRID QUANTIZE 1/4</span>
        </div>
      </div>
    </div>
  );
}

function MixArchive({ 
  isDepth, 
  activeView,
  setActiveView,
  decks,
  setDecks,
  crossfader,
  setCrossfader,
  leftActiveDeck,
  setLeftActiveDeck,
  rightActiveDeck,
  setRightActiveDeck,
  playTrack,
  playLockoutBlip,
  togglePlayGlobal,
  widgetRefs,
  initAudioDSP,
  loadLocalFile,
  seekLocalBuffer,
  audioElementsRef,
  playPendingRef,
  scratchingRef,
  alignSyncPlayback
}: { 
  isDepth: boolean; 
  activeView: 'cdj' | 'tracklist';
  setActiveView: React.Dispatch<React.SetStateAction<'cdj' | 'tracklist'>>;
  decks: any;
  setDecks: React.Dispatch<React.SetStateAction<any>>;
  crossfader: number;
  setCrossfader: (val: number) => void;
  leftActiveDeck: 1 | 2;
  setLeftActiveDeck: (val: 1 | 2) => void;
  rightActiveDeck: 3 | 4;
  setRightActiveDeck: (val: 3 | 4) => void;
  playTrack: (track: any, targetDeckId?: number) => void; 
  playLockoutBlip: () => void;
  togglePlayGlobal: (deckId: number) => void;
  widgetRefs: React.MutableRefObject<Record<number, any>>;
  initAudioDSP: () => AudioContext | null;
  loadLocalFile?: (deckId: number, file: File) => void;
  seekLocalBuffer?: (deckId: number, seekTime: number) => void;
  audioElementsRef?: React.RefObject<Record<number, HTMLAudioElement | null>>;
  playPendingRef?: React.MutableRefObject<Record<number, boolean>>;
  scratchingRef?: React.MutableRefObject<Record<number, boolean>>;
  alignSyncPlayback?: (deckId: number) => void;
}) {
  const decksRef = useRef(decks);
  useEffect(() => { decksRef.current = decks; }, [decks]);

  const archiveRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [embedSCPlayerId, setEmbedSCPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'knight club' | 'royal court' | 'corner new cross'>('all');

  // --- Slip Mode and Loop Roll states ---
  const [slipMode, setSlipMode] = useState<Record<number, boolean>>({
    1: false, 2: false, 3: false, 4: false
  });
  const slipModeRef = useRef(slipMode);
  useEffect(() => { slipModeRef.current = slipMode; }, [slipMode]);

  const [activeRoll, setActiveRoll] = useState<Record<number, { division: number; startTime: number; virtualTime: number } | null>>({
    1: null, 2: null, 3: null, 4: null
  });
  const activeRollRef = useRef(activeRoll);
  useEffect(() => { activeRollRef.current = activeRoll; }, [activeRoll]);

  // --- Scratch physics and visual rotation refs ---
  const scratchStateRef = useRef<Record<number, {
    isScratching: boolean;
    lastAngle: number;
    centerX: number;
    centerY: number;
    wasPlaying: boolean;
    velocity: number;
    platterAngle: number;
    lastTime: number;
  }>>({
    1: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 },
    2: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 },
    3: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 },
    4: { isScratching: false, lastAngle: 0, centerX: 0, centerY: 0, wasPlaying: false, velocity: 0, platterAngle: 0, lastTime: 0 }
  });

  const platterRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // --- Global Deck Controls for hotkeys and platters ---

  const getQuantizedDelay = (targetDeckId: number): number => {
    const deckB = decks[targetDeckId];
    if (!deckB || !deckB.quantizeEnabled) return 0;

    // Find active master deck
    const otherDeckId = (targetDeckId === 1 || targetDeckId === 2) ? rightActiveDeck : leftActiveDeck;
    const deckA = decks[otherDeckId];
    const audioA = audioElementsRef?.current?.[otherDeckId];
    if (!deckA || !deckA.isPlaying || !audioA || audioA.paused) return 0;

    const beatIntervalA = 60 / deckA.bpm;
    const quantizeInterval = beatIntervalA / 4; // 1/4 beat division snap

    const timeA = audioA.currentTime;
    const currentOffset = timeA % quantizeInterval;
    const timeToNext = quantizeInterval - currentOffset;

    const realTimeToNext = timeToNext / (1 + (deckA.pitch || 0) / 100);
    return realTimeToNext * 1000; // in milliseconds
  };

  const triggerHotCue = (deckId: number, percentage: number, cueIndex?: number) => {
    const deck = decks[deckId];
    const isLocked = deck?.id === 'locked';
    if (isLocked) {
      playLockoutBlip();
      return;
    }

    const executeCue = () => {
      initAudioDSP();
      const widget = widgetRefs.current[deckId];
      playClick(1200, 'sine', 0.02);

      const duration = deck.duration || 300;
      let seekPosSec = percentage * duration;

      // Use absolute custom cue point if defined
      if (deck.cuePoints && cueIndex !== undefined && deck.cuePoints[cueIndex] !== undefined) {
        seekPosSec = deck.cuePoints[cueIndex];
      }

      if (deck.scMode && widget) {
        try {
          widget.seekTo(seekPosSec * 1000);
        } catch (e) {
          setDecks((prev: any) => ({
            ...prev,
            [deckId]: { ...prev[deckId], progress: seekPosSec }
          }));
        }
      } else {
        if (seekLocalBuffer) {
          seekLocalBuffer(deckId, seekPosSec);
        }

        setDecks((prev: any) => ({
          ...prev,
          [deckId]: { ...prev[deckId], progress: seekPosSec }
        }));
      }
    };

    const delay = getQuantizedDelay(deckId);
    if (delay > 10) {
      setTimeout(executeCue, delay);
    } else {
      executeCue();
    }
  };

  const triggerSync = (deckId: number, otherDeckId: number) => {
    const deck = decks[deckId];
    const otherDeck = decks[otherDeckId];
    if (deck && otherDeck && deck.id !== 'locked') {
      const targetBpm = otherDeck.bpm * (1 + (otherDeck.pitch || 0) / 100);
      const requiredPitch = ((targetBpm / deck.bpm) - 1) * 100;
      const clampedPitch = Math.max(-8, Math.min(8, requiredPitch));
      setDecks((prev: any) => ({
        ...prev,
        [deckId]: { ...prev[deckId], pitch: clampedPitch }
      }));
      playClick(800, 'sine', 0.02);
    }
  };

  // --- Manual Looping ---
  const handleLoopIn = (deckId: number) => {
    const audio = audioElementsRef?.current?.[deckId];
    if (!audio) return;
    useAudioStore.getState().setDeck(deckId, { loopIn: audio.currentTime, isLoopActive: false, loopOut: null });
    playClick(1100, 'sine', 0.02);
  };
  const handleLoopOut = (deckId: number) => {
    const audio = audioElementsRef?.current?.[deckId];
    const deck = decks[deckId];
    if (!audio || !deck) return;
    if (deck.loopIn !== undefined && deck.loopIn !== null && audio.currentTime > deck.loopIn) {
      useAudioStore.getState().setDeck(deckId, { loopOut: audio.currentTime, isLoopActive: true });
      playClick(1000, 'sine', 0.02);
    }
  };
  const handleReloop = (deckId: number) => {
    const audio = audioElementsRef?.current?.[deckId];
    const deck = decks[deckId];
    if (deck?.loopIn !== undefined && deck?.loopIn !== null && audio) {
      // eslint-disable-next-line react-hooks/immutability
      audio.currentTime = deck.loopIn;
      useAudioStore.getState().setDeck(deckId, { isLoopActive: true });
      playClick(900, 'sine', 0.02);
    }
  };
  const handleExitLoop = (deckId: number) => {
    useAudioStore.getState().setDeck(deckId, { isLoopActive: false });
    playClick(800, 'sine', 0.02);
  };

  // --- Beat Loop Roll Helpers ---
  const startLoopRoll = (deckId: number, division: number) => {
    const audio = audioElementsRef?.current?.[deckId];
    if (!audio || audio.paused) return;
    
    playClick(1000, 'sine', 0.02);
    setActiveRoll(prev => ({
      ...prev,
      [deckId]: {
        division,
        startTime: audio.currentTime,
        virtualTime: audio.currentTime
      }
    }));
  };

  const stopLoopRoll = (deckId: number) => {
    setActiveRoll(prev => {
      const roll = prev[deckId];
      if (!roll) return prev;
      
      playClick(900, 'sine', 0.02);
      const audio = audioElementsRef?.current?.[deckId];
      if (audio) {
        if (slipMode[deckId]) {
          let targetTime = roll.virtualTime;
          if (targetTime > audio.duration) targetTime = audio.duration;
          audio.currentTime = targetTime;
        }
      }
      return { ...prev, [deckId]: null };
    });
  };

  // --- Platter Physics & Loop Roll Tick useEffect ---
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const updateTick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      [1, 2, 3, 4].forEach((deckId) => {
        const state = scratchStateRef.current[deckId];
        const deck = decksRef.current[deckId];
        const el = platterRefs.current[deckId];
        if (!state || !deck) return;

        const audio = audioElementsRef?.current?.[deckId];
        const isActuallyPlaying = deck.scMode ? deck.isPlaying : (audio ? !audio.paused : deck.isPlaying);

        // 1. Scratch / Platter Physics
        if (state.isScratching) {
          if (el) {
            el.style.transform = `rotate(${state.platterAngle}rad)`;
          }
        } else if (Math.abs(state.velocity) > 0.001) {
          state.velocity *= 0.95; // Platter friction
          state.platterAngle += state.velocity;
          
          if (!deck.scMode && audio && audio.duration) {
            const timeDelta = (state.velocity / (2 * Math.PI)) * 2.5; // 2.5s per full rotation
            let nextTime = audio.currentTime + timeDelta;
            if (nextTime < 0) nextTime = 0;
            if (nextTime > audio.duration) nextTime = audio.duration;
            audio.currentTime = nextTime;
          }
          
          if (el) {
            el.style.transform = `rotate(${state.platterAngle}rad)`;
          }
        } else {
          if (isActuallyPlaying) {
            const pitchModifier = 1 + (deck.pitch || 0) / 100;
            const rotSpeed = ((2 * Math.PI) / 3.0) * pitchModifier; // 3 seconds per rotation
            state.platterAngle += rotSpeed * dt;
          }
          if (el) {
            el.style.transform = `rotate(${state.platterAngle}rad)`;
          }
        }

        // 2. Loop Roll Sweeping
        const roll = activeRollRef.current[deckId];
        if (roll && audio && !audio.paused) {
          const pitchModifier = 1 + (deck.pitch || 0) / 100;
          roll.virtualTime += dt * pitchModifier;
          
          const currentBpm = deck.bpm * pitchModifier;
          const beatDuration = 60 / currentBpm;
          const rollDuration = beatDuration * roll.division;
          
          if (audio.currentTime >= roll.startTime + rollDuration) {
            audio.currentTime = roll.startTime;
          }
        }
        
        // 3. Manual Loop Sweeping
        if (deck.isLoopActive && deck.loopIn !== null && deck.loopOut !== null && audio && !audio.paused) {
          if (audio.currentTime >= deck.loopOut) {
            audio.currentTime = deck.loopIn;
          }
        }
      });

      frameId = requestAnimationFrame(updateTick);
    };

    frameId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(frameId);
  }, [audioElementsRef]);

  // --- Keyboard DJ Hotkeys useEffect ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      const leftDeckId = leftActiveDeck;
      const rightDeckId = rightActiveDeck;

      // Left Deck controls
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        togglePlayGlobal(leftDeckId);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        triggerHotCue(leftDeckId, 0.0, 0);
      } else if (e.key === '1') {
        e.preventDefault();
        triggerHotCue(leftDeckId, 0.0, 0);
      } else if (e.key === '2') {
        e.preventDefault();
        triggerHotCue(leftDeckId, 0.25, 1);
      } else if (e.key === '3') {
        e.preventDefault();
        triggerHotCue(leftDeckId, 0.5, 2);
      } else if (e.key === '4') {
        e.preventDefault();
        triggerHotCue(leftDeckId, 0.75, 3);
      }

      // Right Deck controls
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePlayGlobal(rightDeckId);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        triggerHotCue(rightDeckId, 0.0, 0);
      } else if (e.key === '7') {
        e.preventDefault();
        triggerHotCue(rightDeckId, 0.0, 0);
      } else if (e.key === '8') {
        e.preventDefault();
        triggerHotCue(rightDeckId, 0.25, 1);
      } else if (e.key === '9') {
        e.preventDefault();
        triggerHotCue(rightDeckId, 0.5, 2);
      } else if (e.key === '0') {
        e.preventDefault();
        triggerHotCue(rightDeckId, 0.75, 3);
      }

      // Mixer Arrow crossfader controls
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCrossfader(Math.max(0, crossfader - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCrossfader(Math.min(100, crossfader + 5));
      }

      // SYNC triggers
      else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        // Read directly from decksRef to avoid stale closures
        const d1 = decksRef.current[leftDeckId];
        const d2 = decksRef.current[rightDeckId];
        if (d1 && d2 && d1.id !== 'locked') {
          playClick(800, 'sine', 0.02);
          const isBothPlaying = d1.isPlaying && d2.isPlaying;
          const nextSyncState = isBothPlaying ? true : !d1.syncEnabled;
          setDecks((prev: any) => ({
            ...prev,
            [leftDeckId]: { ...prev[leftDeckId], syncEnabled: nextSyncState }
          }));
          if (isBothPlaying && alignSyncPlayback) {
            alignSyncPlayback(leftDeckId);
          }
        }
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        const d1 = decksRef.current[rightDeckId];
        const d2 = decksRef.current[leftDeckId];
        if (d1 && d2 && d1.id !== 'locked') {
          playClick(800, 'sine', 0.02);
          const isBothPlaying = d1.isPlaying && d2.isPlaying;
          const nextSyncState = isBothPlaying ? true : !d1.syncEnabled;
          setDecks((prev: any) => ({
            ...prev,
            [rightDeckId]: { ...prev[rightDeckId], syncEnabled: nextSyncState }
          }));
          if (isBothPlaying && alignSyncPlayback) {
            alignSyncPlayback(rightDeckId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftActiveDeck, rightActiveDeck, crossfader, setCrossfader, togglePlayGlobal, alignSyncPlayback]);

  // Average the parameters of all playing decks for the central mixer display
  const playingDecks = Object.values(decks).filter((d: any) => d.isPlaying);
  let activeBpm = 120;
  let activeEqHi = 50;
  let activeEqMid = 50;
  let activeEqLow = 50;
  
  if (playingDecks.length > 0) {
    activeBpm = playingDecks.reduce((sum: number, d: any) => sum + (d.bpm * (1 + (d.pitch || 0) / 100)), 0) / playingDecks.length;
    activeEqHi = playingDecks.reduce((sum: number, d: any) => sum + d.eqHi, 0) / playingDecks.length;
    activeEqMid = playingDecks.reduce((sum: number, d: any) => sum + d.eqMid, 0) / playingDecks.length;
    activeEqLow = playingDecks.reduce((sum: number, d: any) => sum + d.eqLow, 0) / playingDecks.length;
  } else {
    // If no deck is playing, track the active selected left deck's EQs/BPM
    const leftDeck = decks[leftActiveDeck] || decks[1];
    activeBpm = leftDeck.bpm * (1 + (leftDeck.pitch || 0) / 100);
    activeEqHi = leftDeck.eqHi;
    activeEqMid = leftDeck.eqMid;
    activeEqLow = leftDeck.eqLow;
  }

  const isMixActiveInDecks = (mixId: string) => {
    return Object.values(decks).some((d: any) => d.id === mixId);
  };
  const isMixPlayingInDecks = (mixId: string) => {
    return Object.values(decks).some((d: any) => d.id === mixId && d.isPlaying);
  };

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }


  
  const mixGroups = [
    {
      title: "Knight Club",
      mixes: [
        { id: 'kc-1', title: 'Knight Club: Session 1', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%201%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/knight-club-session-1', bpm: 145, isLocalFile: true, cuePoints: [0, 1127, 2112, 2772] },
        { id: 'kc-2', title: 'Knight Club: Session 2', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%202%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/knight-club-session-2', bpm: 152, isLocalFile: true, cuePoints: [0, 2468, 4084, 6270] },
        { id: 'kc-3', title: 'Knight Club: Session 3', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%203%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/knight-club-session-3', bpm: 150, isLocalFile: true, cuePoints: [0, 1940, 3685, 5509] },
        { id: 'kc-4', title: 'Knight Club: Session 4', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%204%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/33baa30a-4980-40da-94c2-41085314ec43', bpm: 155, isLocalFile: true, cuePoints: [0, 1834, 3582, 5552] }
      ]
    },
    {
      title: "Royal Court",
      mixes: [
        { id: 'rc-1', title: 'Royal Court: Session 1', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Audio/Royal%20Court%20Session%201%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/session-1', bpm: 124, isLocalFile: true },
        { id: 'rc-2', title: 'Royal Court: Session 2', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Audio/Royal%20Court%20Session%202%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/01-best-yet', bpm: 125, isLocalFile: true }
      ]
    },
    {
      title: "Corner New Cross",
      mixes: [
        { id: 'cnc-1', title: 'Corner New Cross: Night 1', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Audio/Corner%20New%20Cross%20Night%201%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/corner-new-cross-night-1', bpm: 128, isLocalFile: true },
        { id: 'cnc-2', title: 'Corner New Cross: Night 2', url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Audio/Corner%20New%20Cross%20Night%202%20MP3.mp3', link: 'https://soundcloud.com/henryixdj/corner-new-cross-night-2', bpm: 132, isLocalFile: true }
      ]
    }
  ];

  // Helper to determine active playing deck for background visualizer
  const getActiveVisualizerState = () => {
    const active = Object.values(decks).find((d: any) => d.isPlaying);
    return active ? { isPlaying: true } : { isPlaying: false };
  };

  const activeVisualizer = getActiveVisualizerState();

  const renderPlatter = (deckId: 1 | 2 | 3 | 4) => {
    const deck = decks[deckId];
    const isLocked = deck?.id === 'locked';
    const isPlaying = deck.isPlaying;
    const themeColor = 
      deckId === 1 ? 'rgba(211,15,49,1)' : // red
      deckId === 2 ? 'rgba(34,211,238,1)' : // cyan
      deckId === 3 ? 'rgba(16,185,129,1)' : // green
      'rgba(234,179,8,1)'; // yellow
      
    const neonGlow = 
      deckId === 1 ? 'shadow-[0_0_15px_rgba(211,15,49,0.12)]' :
      deckId === 2 ? 'shadow-[0_0_15px_rgba(34,211,238,0.12)]' :
      deckId === 3 ? 'shadow-[0_0_15px_rgba(16,185,129,0.12)]' :
      'shadow-[0_0_15px_rgba(234,179,8,0.12)]';

    const borderGlow =
      deckId === 1 ? 'border-primary/40' :
      deckId === 2 ? 'border-cyan-500/40' :
      deckId === 3 ? 'border-emerald-500/40' :
      'border-yellow-500/40';

    const sessionNum = deck.title?.match(/Session\s+(\d+)/)?.[1] || "";
    const sessionImg = getSessionImage(deck.title);

    return (
      <div className={cn(
        "rounded-xl p-1.5 flex flex-col justify-between items-center bg-zinc-950 border min-h-[200px] h-full flex-grow relative transition-colors duration-300 w-full z-10 select-none",
        isDepth ? "border-zinc-900 shadow-xl" : "border-black/10",
        isPlaying && borderGlow,
        isPlaying && neonGlow
      )}>
        {/* Platter design dots */}
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none z-0" style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }} />

        {/* Deck Selectors Switchboard integrated inside chassis */}
        <div className="flex gap-1 w-full z-20 select-none pb-1.5 border-b border-zinc-900/60 mb-1.5 shrink-0">
          {(deckId === 1 || deckId === 2) ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLeftActiveDeck(1);
                  playClick(900, 'sine', 0.02);
                }}
                className={cn(
                  "flex-grow py-2 rounded-lg text-[9.5px] font-mono tracking-widest font-black border transition-all cursor-pointer text-center hover:bg-zinc-900 active:scale-95 shadow-md",
                  leftActiveDeck === 1 
                    ? "bg-primary border-primary text-black shadow-[0_0_8px_rgba(211,15,49,0.3)] font-black" 
                    : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
              >
                DECK 1 (KC)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLeftActiveDeck(2);
                  playClick(900, 'sine', 0.02);
                }}
                className={cn(
                  "flex-grow py-2 rounded-lg text-[9.5px] font-mono tracking-widest font-black border transition-all cursor-pointer text-center hover:bg-zinc-900 active:scale-95 shadow-md",
                  leftActiveDeck === 2 
                    ? "bg-cyan-400 border-cyan-400 text-black shadow-[0_0_8px_rgba(34,211,238,0.3)] font-black" 
                    : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
              >
                DECK 2 (RC)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRightActiveDeck(3);
                  playClick(900, 'sine', 0.02);
                }}
                className={cn(
                  "flex-grow py-2 rounded-lg text-[9.5px] font-mono tracking-widest font-black border transition-all cursor-pointer text-center hover:bg-zinc-900 active:scale-95 shadow-md",
                  rightActiveDeck === 3 
                    ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.3)] font-black" 
                    : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
              >
                DECK 3 (CNC)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRightActiveDeck(4);
                  playClick(900, 'sine', 0.02);
                }}
                className={cn(
                  "flex-grow py-2 rounded-lg text-[9.5px] font-mono tracking-widest font-black border transition-all cursor-pointer text-center hover:bg-zinc-900 active:scale-95 shadow-md",
                  rightActiveDeck === 4 
                    ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.3)] font-black" 
                    : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
              >
                DECK 4 (KC)
              </button>
            </>
          )}
        </div>

        {/* Deck Header */}
        <div className="w-full flex justify-between items-center pb-1 z-10 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isPlaying ? "animate-pulse" : ""
            )} style={{ backgroundColor: themeColor }} />
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: themeColor }}>
              {isLocked ? "DECK_04 // ACCESS_DENIED" : `DECK_0${deckId} // SC_STREAM`}
            </span>
          </div>
          {isLocked ? (
            <span className="font-mono text-[8px] text-zinc-600 tracking-[0.05em] uppercase font-bold">
              DECK_LOCKED
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playClick(900, 'sine', 0.02);
                setSlipMode(prev => ({ ...prev, [deckId]: !prev[deckId] }));
              }}
              className={cn(
                "px-2 py-0.5 rounded text-[8px] font-mono tracking-widest font-bold border transition-colors cursor-pointer select-none active:scale-95",
                slipMode[deckId]
                  ? "bg-primary border-primary text-black shadow-[0_0_8px_rgba(211,15,49,0.3)] font-black"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              SLIP MODE
            </button>
          )}
        </div>

        {/* Jogwheel, Sync/Master, and Pitch Slider area */}
        <div className="w-full flex items-center justify-between gap-2.5 my-1 z-10 relative">
          {/* Left Side: SYNC, MASTER, GRID controls */}
          <div className="flex flex-col gap-1 items-center w-12 shrink-0">
            {/* SYNC button */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[5px] text-zinc-600 font-mono tracking-widest font-bold" title="Click to sync. Shift-click to toggle Beat/BPM mode.">SYNC</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    playLockoutBlip();
                    return;
                  }
                  playClick(800, 'sine', 0.02);
                  
                  if (e.shiftKey) {
                    const nextMode = deck.syncMode === 'BPM' ? 'BEAT' : 'BPM';
                    setDecks((prev: any) => ({
                      ...prev,
                      [deckId]: { ...prev[deckId], syncMode: nextMode }
                    }));
                  } else {
                    const otherDeckId = (deckId === 1 || deckId === 2) ? rightActiveDeck : leftActiveDeck;
                    const otherDeck = decks[otherDeckId];
                    const isBothPlaying = deck.isPlaying && otherDeck && otherDeck.isPlaying;
                    const nextSyncState = isBothPlaying ? true : !deck.syncEnabled;
                    setDecks((prev: any) => ({
                      ...prev,
                      [deckId]: { ...prev[deckId], syncEnabled: nextSyncState }
                    }));
                    if (isBothPlaying && alignSyncPlayback) {
                      alignSyncPlayback(deckId);
                    }
                  }
                }}
                className={cn(
                  "w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-[9px] font-black transition-all cursor-pointer active:scale-95 flex-col leading-none",
                  isLocked 
                    ? "bg-zinc-950 border-zinc-900/50 text-zinc-800 cursor-not-allowed"
                    : deck.syncEnabled
                      ? deck.syncMode === 'BPM'
                        ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.6)] font-black"
                        : "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.6)] font-black"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                <span>SYNC</span>
                {deck.syncEnabled && (
                  <span className="text-[5.5px] mt-0.5 font-bold uppercase tracking-tighter opacity-80">
                    {deck.syncMode || 'BEAT'}
                  </span>
                )}
              </button>
            </div>

            {/* MASTER button */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[5px] text-zinc-600 font-mono tracking-widest font-bold">MASTER</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    playLockoutBlip();
                    return;
                  }
                  playClick(850, 'sine', 0.02);
                }}
                className={cn(
                  "w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-[10px] font-black transition-all cursor-pointer active:scale-95",
                  isLocked 
                    ? "bg-zinc-950 border-zinc-900/50 text-zinc-800 cursor-not-allowed"
                    : isPlaying
                      ? "bg-primary/10 border-primary text-primary shadow-[0_0_8px_rgba(211,15,49,0.3)]"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                MST
              </button>
            </div>

            {/* QUANTIZE button */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[5px] text-zinc-600 font-mono tracking-widest font-bold">QUANTIZE</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    playLockoutBlip();
                    return;
                  }
                  playClick(900, 'sine', 0.02);
                  setDecks((prev: any) => ({
                    ...prev,
                    [deckId]: { ...prev[deckId], quantizeEnabled: !prev[deckId].quantizeEnabled }
                  }));
                }}
                className={cn(
                  "w-12 h-9 rounded-xl border flex items-center justify-center font-mono text-[8.5px] font-black transition-all cursor-pointer active:scale-95",
                  isLocked
                    ? "bg-zinc-950 border-zinc-900/50 text-zinc-800 cursor-not-allowed"
                    : deck.quantizeEnabled
                      ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)] font-black"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                Q
              </button>
            </div>
          </div>

          {/* Center Column: Jogwheel with pointer event handlers for scratching */}
          <div 
            onDragOver={(e) => {
              if (isLocked) return;
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              if (isLocked) return;
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file && loadLocalFile) {
                loadLocalFile(deckId, file);
              }
            }}
            onPointerDown={(e) => {
              if (isLocked) {
                playLockoutBlip();
                return;
              }
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              const cX = rect.left + rect.width / 2;
              const cY = rect.top + rect.height / 2;
              const angle = Math.atan2(e.clientY - cY, e.clientX - cX);
              const audio = audioElementsRef?.current?.[deckId];
              const wasPlaying = deck.isPlaying;

              if (scratchingRef) scratchingRef.current[deckId] = true;

              if (wasPlaying) {
                if (deck.scMode) {
                  const widget = widgetRefs.current[deckId];
                  if (widget) {
                    try { widget.pause(); } catch (err) {}
                  }
                } else if (audio) {
                  audio.pause();
                }
              }

              scratchStateRef.current[deckId] = {
                isScratching: true,
                lastAngle: angle,
                centerX: cX,
                centerY: cY,
                wasPlaying,
                velocity: 0,
                platterAngle: scratchStateRef.current[deckId].platterAngle,
                lastTime: performance.now()
              };
              playClick(600, 'sine', 0.01);
            }}
            onPointerMove={(e) => {
              const state = scratchStateRef.current[deckId];
              if (!state.isScratching) return;
              const angle = Math.atan2(e.clientY - state.centerY, e.clientX - state.centerX);
              let delta = angle - state.lastAngle;
              if (delta > Math.PI) delta -= 2 * Math.PI;
              if (delta < -Math.PI) delta += 2 * Math.PI;
              
              state.platterAngle += delta;
              state.lastAngle = angle;
              
              const now = performance.now();
              const dt = (now - state.lastTime) / 1000;
              if (dt > 0) {
                state.velocity = delta;
                state.lastTime = now;
              }
              
              const audio = audioElementsRef?.current?.[deckId];
              if (!deck.scMode && audio && audio.duration) {
                const timeDelta = (delta / (2 * Math.PI)) * 2.5;
                let nextTime = audio.currentTime + timeDelta;
                if (nextTime < 0) nextTime = 0;
                if (nextTime > audio.duration) nextTime = audio.duration;
                audio.currentTime = nextTime;
              }
            }}
            onPointerUp={(e) => {
              const state = scratchStateRef.current[deckId];
              if (!state.isScratching) return;
              e.currentTarget.releasePointerCapture(e.pointerId);
              state.isScratching = false;

              if (scratchingRef) scratchingRef.current[deckId] = false;

              if (state.wasPlaying) {
                if (deck.scMode) {
                  const widget = widgetRefs.current[deckId];
                  if (widget) {
                    try { widget.play(); } catch (err) {}
                  }
                } else {
                  const audio = audioElementsRef?.current?.[deckId];
                  if (audio) {
                    audio.play().catch(() => {});
                  }
                }
              }
            }}
            onPointerCancel={(e) => {
              const state = scratchStateRef.current[deckId];
              if (!state.isScratching) return;
              e.currentTarget.releasePointerCapture(e.pointerId);
              state.isScratching = false;

              if (scratchingRef) scratchingRef.current[deckId] = false;

              if (state.wasPlaying) {
                if (deck.scMode) {
                  const widget = widgetRefs.current[deckId];
                  if (widget) {
                    try { widget.play(); } catch (err) {}
                  }
                } else {
                  const audio = audioElementsRef?.current?.[deckId];
                  if (audio) {
                    audio.play().catch(() => {});
                  }
                }
              }
            }}
            className={cn("relative rounded-full pointer-events-auto mx-auto shrink-0 my-2 select-none touch-none", isLocked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing")}
          >
            <div
              ref={(el) => { platterRefs.current[deckId] = el; }}
              className={cn(
                "w-40 h-40 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center relative shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden transition-colors duration-300",
                isPlaying && borderGlow
              )}
              style={{
                boxShadow: isPlaying ? `0 0 25px ${themeColor}2a, inset 0 0 40px rgba(0,0,0,0.9)` : 'inset 0 0 40px rgba(0,0,0,0.9)'
              }}
            >
              {/* Full Artwork Background */}
              {sessionImg && !isLocked && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={sessionImg} 
                  alt="Track Artwork" 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity filter brightness-110 contrast-125 saturate-50 pointer-events-none"
                />
              )}

              {/* Tint Overlay to keep UI legible */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none rounded-full" />

              {/* Grooves */}
              <div className="absolute inset-2 rounded-full border border-dashed border-zinc-800/60 pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-zinc-800/40 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border border-dashed border-zinc-800/50 pointer-events-none" />
              <div className="absolute inset-14 rounded-full border border-zinc-800/30 pointer-events-none" />

              {/* Jogwheel Center spindle */}
              <div className="w-12 h-12 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-700/50 flex items-center justify-center overflow-hidden relative z-10 shadow-inner">
                {isLocked ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 select-none bg-zinc-950">
                    <CircleDot className="w-4 h-4 text-yellow-500 animate-pulse relative z-10" />
                    <span className="text-[5px] text-yellow-500 font-mono tracking-widest font-black uppercase mt-1 relative z-10">LOCKED</span>
                  </div>
                ) : (sessionImg) ? (
                  <div className="w-full h-full relative p-1 flex flex-col justify-center items-center text-center">
                    <div className="text-[4.5px] font-mono font-bold tracking-widest uppercase text-center relative z-10 text-white drop-shadow-md">
                      {sessionNum ? `S-${sessionNum}` : deck.title.substring(0, 10).toUpperCase()}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-1 shadow-inner border border-zinc-500" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Disc className="w-4 h-4 animate-pulse" style={{ color: themeColor }} />
                    <span className="text-[4px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5 font-bold">
                      {deck.title.split(':')[0] || "TRACK"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Tempo Slider */}
          <div className="flex flex-col items-center w-12 shrink-0 select-none">
            <span className="text-[5.5px] text-zinc-500 font-mono uppercase tracking-widest font-black leading-none mb-1">TEMPO</span>
            
            {/* Zero Reset Button */}
            <button 
              onClick={() => {
                if (!isLocked) {
                  setDecks((prev: any) => ({
                    ...prev,
                    [deckId]: { ...prev[deckId], pitch: 0, syncEnabled: false }
                  }));
                  playClick(1000, 'sine', 0.04);
                } else {
                  playLockoutBlip();
                }
              }}
              disabled={isLocked}
              className="mb-1 w-7 h-4 rounded bg-zinc-800 border border-zinc-700 text-[6px] font-bold text-zinc-300 flex flex-col items-center justify-center shadow hover:bg-zinc-700 active:bg-zinc-600 active:scale-95 transition-all"
            >
              ZERO
            </button>

            <div className="relative h-36 w-6 bg-zinc-950 border border-zinc-900 rounded flex flex-col items-center justify-center overflow-hidden shadow-inner">
              {/* Pitch grid lines ticks */}
              <div className="absolute inset-y-1 flex flex-col justify-between w-full pointer-events-none opacity-40">
                {[...Array(9)].map((_, idx) => (
                  <div key={idx} className={cn("h-[0.5px] bg-zinc-700 mx-auto", idx === 4 ? "w-6 bg-zinc-400" : "w-3")} />
                ))}
              </div>

              <input 
                type="range"
                min="-16"
                max="16"
                step="0.05"
                value={deck.pitch || 0}
                title="Pitch Slider"
                placeholder="Pitch Slider"
                onChange={(e) => {
                  if (!isLocked) {
                    const pitchVal = parseFloat(e.target.value);
                    setDecks((prev: any) => ({
                      ...prev,
                      [deckId]: { ...prev[deckId], pitch: pitchVal, syncEnabled: false }
                    }));
                    if (Math.abs(pitchVal) < 0.1) {
                      playClick(880, 'sine', 0.004); // noon snap tactile tick
                    }
                  } else {
                    playLockoutBlip();
                  }
                }}
                disabled={isLocked}
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl'
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              {/* Zero position indicator marker line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] border-b border-dashed border-zinc-700/60 pointer-events-none" />

              {/* Fader Cap */}
              <div 
                className="absolute w-6 h-5 bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 rounded flex items-center justify-center shadow pointer-events-none"
                style={{ 
                  bottom: `calc(${(( (deck.pitch || 0) + 16) / 32) * 100}% - 10px)`,
                  transform: 'translateY(50%)'
                }}
              >
                <div className="w-full h-[1px] bg-cyan-400 shadow-[0_0_2px_#22d3ee]" />
              </div>
            </div>
            
            <span className="text-[6.5px] font-bold text-zinc-500 font-mono mt-1 w-full text-center tracking-widest truncate">
              {deck.pitch >= 0 ? `+${(deck.pitch || 0).toFixed(2)}%` : `${(deck.pitch || 0).toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Digital LCD screen */}
        <div className="w-full bg-zinc-950 border border-zinc-900 rounded p-2 font-mono text-[9.5px] z-10 shadow-inner flex flex-col gap-1 select-none shrink-0 border-l-2" style={{ borderLeftColor: themeColor }}>
          <div className="flex items-center justify-end text-zinc-500 text-[7px] tracking-widest border-b border-zinc-900/50 pb-1 uppercase">
            <span style={{ color: isLocked ? 'rgb(234,179,8)' : isPlaying ? themeColor : 'transparent' }}>
              {isLocked ? "ACCESS_DENIED" : isPlaying ? "● PLAY" : ""}
            </span>
          </div>
          
          <div className="flex flex-col mt-0.5 min-w-0">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold leading-none mb-1">SELECT MIX</span>
            {isLocked ? (
              <span className="font-bold truncate tracking-wider text-yellow-500 font-mono text-[9px] py-1">
                COMING SOON // LCK
              </span>
            ) : (
              <div className="flex gap-1 items-center">
                <select
                  value={deck.id}
                  title="Select Mix Track"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const track = mixGroups.flatMap(g => g.mixes).find(m => m.id === selectedId);
                    if (track) {
                      playTrack(track, deckId);
                    }
                  }}
                  className="bg-zinc-950 text-zinc-300 font-bold border border-zinc-900 rounded-xl px-4 py-2.5 text-[11.5px] tracking-wider uppercase font-mono focus:outline-none focus:border-zinc-800 cursor-pointer flex-grow select-none transition-colors"
                  style={{
                    color: isPlaying ? themeColor : 'rgb(212, 212, 216)',
                    borderColor: isPlaying ? `${themeColor}40` : 'rgb(24, 24, 27)',
                    boxShadow: isPlaying ? `0 0 8px ${themeColor}10` : 'none'
                  }}
                >
                  {mixGroups.map((group) => (
                    <optgroup key={group.title} label={group.title.toUpperCase()} className="bg-zinc-950 text-zinc-500 font-bold font-mono text-[8px] tracking-widest">
                      {group.mixes.map((mix) => (
                        <option key={mix.id} value={mix.id} className="bg-zinc-950 text-zinc-300 uppercase">
                          {mix.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {deck.id === 'local' ? (
                    <option value="local" className="bg-zinc-950 text-zinc-300 font-bold uppercase">
                      {deck.title}
                    </option>
                  ) : (
                    <option value="local" disabled className="bg-zinc-950 text-zinc-500">
                      -- CUSTOM UPLOAD --
                    </option>
                  )}
                </select>
                
                <button
                  onClick={() => {
                    const fileInput = fileInputRefs.current[deckId];
                    if (fileInput) fileInput.click();
                  }}
                  className="p-2.5 px-3.5 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                  title="Load custom audio file"
                >
                  <Music2 size={16} className={cn(isPlaying && "animate-pulse")} />
                </button>

                <button
                  onClick={() => togglePlayGlobal(deckId)}
                  className="p-2.5 px-3.5 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-md"
                  style={{
                    color: isPlaying ? themeColor : 'rgb(161, 161, 170)',
                    borderColor: isPlaying ? `${themeColor}40` : 'rgb(24, 24, 27)',
                    backgroundColor: isPlaying ? `${themeColor}08` : 'rgb(9, 9, 11)'
                  }}
                  title="Toggle Play / Pause"
                >
                  {isPlaying ? <Pause size={16} className="fill-current animate-pulse" /> : <Play size={16} className="fill-current ml-0.5" />}
                </button>

                <input
                  type="file"
                  ref={el => { fileInputRefs.current[deckId] = el; }}
                  title="Upload Audio File"
                  placeholder="Upload Audio File"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && loadLocalFile) {
                      loadLocalFile(deckId, file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1 border-t border-zinc-900/40 pt-1.5">
            <div className="flex flex-col">
              <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-bold">TEMPO</span>
              <span className="font-bold text-zinc-400">
                {isLocked ? "130.00 BPM" : `${(deck.bpm * (1 + (deck.pitch || 0) / 100)).toFixed(2)} BPM`}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-bold">PLAYHEAD</span>
              <span id={`lcd-time-${deckId}`} className="font-bold text-zinc-400 font-mono">
                {isLocked ? "LOCKED" : formatTime(deck.progress || 0)}
              </span>
            </div>
          </div>
          
          {/* New LCD status indicators for SYNC and QUANTIZE */}
          <div className="grid grid-cols-2 gap-2 mt-0.5 border-t border-zinc-900/20 pt-1 select-none">
            <div className="flex flex-col">
              <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-bold">SYNC MODE</span>
              <span className={cn(
                "font-black text-[7.5px] font-mono tracking-wide uppercase transition-colors duration-300",
                !deck.syncEnabled 
                  ? "text-zinc-600" 
                  : deck.syncMode === 'BPM' 
                    ? "text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.35)]" 
                    : "text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.35)]"
              )}>
                {deck.syncEnabled ? `${deck.syncMode || 'BEAT'} SYNC` : "SYNC OFF"}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-bold">QUANTIZE</span>
              <span className={cn(
                "font-black text-[7.5px] font-mono tracking-wide uppercase transition-colors duration-300",
                deck.quantizeEnabled 
                  ? "text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.35)]" 
                  : "text-zinc-600"
              )}>
                {deck.quantizeEnabled ? "QTZ 1/4 ON" : "QTZ OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* Hot Cue Pads */}
        <div className="w-full flex flex-col gap-0.5 shrink-0 z-10 select-none">
          <span className="text-[6px] text-zinc-600 font-mono tracking-widest font-bold uppercase mb-0.5">HOT CUES</span>
          <div className="w-full grid grid-cols-4 gap-1">
            {[
              { label: "CUE 1", val: 0.0 },
              { label: "CUE 2", val: 0.25 },
              { label: "CUE 3", val: 0.5 },
              { label: "CUE 4", val: 0.75 }
            ].map((pad, idx) => (
              <motion.button
                key={idx}
                onClick={() => triggerHotCue(deckId, pad.val, idx)}
                whileHover={isLocked ? {} : { scale: 1.05 }}
                whileTap={isLocked ? {} : { scale: 0.95 }}
                className={cn(
                  "py-1.5 rounded-lg text-[10px] font-mono font-black tracking-widest border uppercase transition-colors cursor-pointer text-center shadow-md active:scale-95",
                  isLocked
                    ? "bg-zinc-900/50 border-zinc-900/40 text-zinc-700 cursor-not-allowed"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 active:bg-zinc-800"
                )}
              >
                {pad.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Manual Loop Controls */}
        <div className="w-full flex flex-col gap-0.5 shrink-0 z-10 select-none my-1">
          <span className="text-[6px] text-zinc-600 font-mono tracking-widest font-black uppercase mb-0.5">MANUAL LOOP</span>
          <div className="w-full grid grid-cols-4 gap-1">
            <button
              onClick={() => { if (!isLocked) handleLoopIn(deckId); }}
              className={cn("py-1 rounded text-[8.5px] font-mono font-black tracking-wider border transition-colors cursor-pointer select-none text-center shadow active:scale-95",
                isLocked ? "bg-zinc-900/50 border-zinc-900/40 text-zinc-700 cursor-not-allowed" :
                (deck.loopIn !== null && deck.loopIn !== undefined) ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              IN
            </button>
            <button
              onClick={() => { if (!isLocked) handleLoopOut(deckId); }}
              className={cn("py-1 rounded text-[8.5px] font-mono font-black tracking-wider border transition-colors cursor-pointer select-none text-center shadow active:scale-95",
                isLocked ? "bg-zinc-900/50 border-zinc-900/40 text-zinc-700 cursor-not-allowed" :
                deck.isLoopActive ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              OUT
            </button>
            <button
              onClick={() => { if (!isLocked) handleExitLoop(deckId); }}
              className={cn("py-1 rounded text-[8.5px] font-mono font-black tracking-wider border transition-colors cursor-pointer select-none text-center shadow active:scale-95",
                isLocked ? "bg-zinc-900/50 border-zinc-900/40 text-zinc-700 cursor-not-allowed" :
                deck.isLoopActive ? "bg-red-500 border-red-500 text-black shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              EXIT
            </button>
            <button
              onClick={() => { if (!isLocked) handleReloop(deckId); }}
              className={cn("py-1 rounded text-[8.5px] font-mono font-black tracking-wider border transition-colors cursor-pointer select-none text-center shadow active:scale-95",
                isLocked ? "bg-zinc-900/50 border-zinc-900/40 text-zinc-700 cursor-not-allowed" :
                (deck.loopIn !== null && !deck.isLoopActive) ? "bg-green-500 border-green-500 text-black shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              RELOOP
            </button>
          </div>
        </div>

        {/* Beat Loop Roll Pads */}
        <div className="w-full flex flex-col gap-0.5 shrink-0 z-10 select-none my-1">
          <span className="text-[6px] text-zinc-600 font-mono tracking-widest font-black uppercase mb-0.5">BEAT LOOP ROLL</span>
          <div className="w-full grid grid-cols-4 gap-1">
            {[
              { label: "1/8", val: 0.125 },
              { label: "1/4", val: 0.25 },
              { label: "1/2", val: 0.5 },
              { label: "1 BAR", val: 1.0 }
            ].map((pad, idx) => {
              const isRollActive = activeRoll[deckId]?.division === pad.val;
              return (
                <button
                  key={idx}
                  onPointerDown={(e) => {
                    if (isLocked) {
                      playLockoutBlip();
                      return;
                    }
                    e.preventDefault();
                    startLoopRoll(deckId, pad.val);
                  }}
                  onPointerUp={(e) => {
                    if (isLocked) return;
                    e.preventDefault();
                    stopLoopRoll(deckId);
                  }}
                  onPointerCancel={(e) => {
                    if (isLocked) return;
                    e.preventDefault();
                    stopLoopRoll(deckId);
                  }}
                  className={cn(
                    "py-1 rounded text-[8.5px] font-mono font-black tracking-wider border transition-colors cursor-pointer select-none text-center shadow active:scale-95",
                    isLocked
                      ? "bg-zinc-900/50 border-zinc-900/40 text-zinc-700 cursor-not-allowed"
                      : isRollActive
                        ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  {pad.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Play mechanical button */}
        <div className="w-full flex justify-center items-center shrink-0 z-10 select-none mt-1">
          <motion.button
            onClick={() => togglePlayGlobal(deckId)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "py-2 rounded-xl font-mono text-[13px] uppercase tracking-[0.25em] font-black border transition-colors shadow-lg flex items-center gap-2.5 cursor-pointer w-full justify-center active:scale-[0.98] hover:shadow-[0_0_15px_rgba(216,22,63,0.15)]",
              isLocked
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500/80 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.15)] font-black"
                : isPlaying
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  : "bg-primary border-primary text-black hover:bg-white hover:border-white hover:text-black shadow-[0_0_10px_rgba(216,22,63,0.3)]"
            )}
            style={{
              backgroundColor: isPlaying && !isLocked ? 'transparent' : undefined,
              borderColor: isPlaying && !isLocked ? themeColor : undefined,
              color: isPlaying && !isLocked ? themeColor : undefined
            }}
          >
            {isLocked ? (
              <>
                <X className="w-5.5 h-5.5" />
                LOCKED
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-5.5 h-5.5 fill-current" />
                PAUSE
              </>
            ) : (
              <>
                <Play className="w-5.5 h-5.5 fill-current ml-0.5" />
                PLAY
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  };

  const renderMixer = () => {
    return (
      <div className={cn(
        "rounded-xl p-2.5 px-3 flex flex-col justify-between bg-zinc-950 border min-h-[180px] h-full flex-grow relative transition-all duration-300 shadow-2xl z-10 w-full",
        isDepth ? "border-zinc-900" : "border-black/10"
      )}>
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none z-0" style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }} />

        {/* Mixer plate tag */}
        <div className="w-full flex justify-between items-center border-b border-zinc-900/60 pb-1 z-10 shrink-0 select-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="font-mono text-[8px] text-primary tracking-[0.2em] font-bold">
              MIXER CORE v4.1 // TB-303
            </span>
          </div>
          <span className="font-mono text-[6px] text-zinc-600 tracking-[0.1em] font-bold">
            UK PATENT_PEND
          </span>
        </div>

        {/* LED EQ screen */}
        <div className="w-full my-0.5 z-10 shrink-0">
          <LEDEqualizer 
            isPlaying={Object.values(decks).some((d: any) => d.isPlaying)} 
            bpm={activeBpm} 
            eqHi={activeEqHi}
            eqMid={activeEqMid}
            eqLow={activeEqLow}
          />
        </div>

        {/* Mixer Channels Grid */}
        <div className="grid grid-cols-4 gap-2.5 my-2.5 items-start justify-center z-10 flex-grow select-none">
          {[1, 2, 3, 4].map(id => {
            const deck = decks[id];
            const isLocked = deck?.id === 'locked';
            const isActive = (id <= 2 ? leftActiveDeck === id : rightActiveDeck === id);
            
            const channelColor = 
              id === 1 ? 'rgba(211,15,49,1)' : // red
              id === 2 ? 'rgba(34,211,238,1)' : // cyan
              id === 3 ? 'rgba(16,185,129,1)' : // green
              'rgba(234,179,8,1)'; // yellow

            return (
              <div 
                key={id}
                className={cn(
                  "flex flex-col items-center gap-3.5 py-2 px-1 rounded-xl transition-all border",
                  isActive ? "bg-zinc-900/30 border-zinc-800/80" : "border-transparent opacity-60 hover:opacity-90"
                )}
              >
                <span 
                  className="font-mono text-[7.5px] font-black tracking-widest uppercase leading-none"
                  style={{ color: channelColor }}
                >
                  CH {id}
                </span>

                <div className="flex flex-col gap-2">
                  <RotaryKnob 
                    label="TRIM"
                    value={deck.trim ?? 50}
                    size="lg"
                    onChange={(val) => {
                      audioEngine.setTrim(id, val);
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], trim: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="HI"
                    value={deck.eqHi}
                    size="lg"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setEQ(id, 'high', val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], eqHi: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="MID"
                    value={deck.eqMid}
                    size="lg"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setEQ(id, 'mid', val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], eqMid: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="LOW"
                    value={deck.eqLow}
                    size="lg"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setEQ(id, 'low', val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], eqLow: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                  <RotaryKnob 
                    label="FLT"
                    value={deck.filter}
                    size="lg"
                    onChange={(val) => {
                      // 1. Instant audio DSP update (zero latency)
                      audioEngine.setFilter(id, val);
                      // 2. Update Zustand for UI display
                      setDecks((prev: any) => ({
                        ...prev,
                        [id]: { ...prev[id], filter: val }
                      }));
                    }}
                    disabled={isLocked}
                  />
                </div>

                {/* Vertical Fader */}
                <div className="flex flex-col items-center gap-1 mt-2 relative w-10">
                  <span className="text-[6.5px] text-zinc-500 font-mono uppercase tracking-widest leading-none font-bold">
                    VOL
                  </span>
                  
                  <div className="relative h-32 w-6 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-center overflow-hidden shadow-inner">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={deck.volume}
                      title="Volume Fader"
                      placeholder="Volume Fader"
                      onChange={(e) => {
                        if (!isLocked) {
                          const val = Number(e.target.value);
                          // 1. Instant audio DSP update (zero latency)
                          const state = useAudioStore.getState();
                          const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, state.crossfader);
                          audioEngine.setGain(id, val, cfMult, state.isMuted);

                          // 2. Update Zustand for UI display
                          setDecks((prev: any) => ({
                            ...prev,
                            [id]: { ...prev[id], volume: val }
                          }));
                        } else {
                          playLockoutBlip();
                        }
                      }}
                      disabled={isLocked}
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl'
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />

                    <div 
                      className="absolute bottom-0 w-full"
                      style={{ 
                        height: `${deck.volume}%`,
                        backgroundColor: channelColor,
                        opacity: 0.15
                      }}
                    />

                    <div className="absolute inset-y-1 flex flex-col justify-between w-full pointer-events-none opacity-40">
                      {[...Array(11)].map((_, idx) => (
                        <div key={idx} className={cn("h-[1px] bg-zinc-700 w-3 mx-auto", idx === 0 && "w-5 bg-zinc-500")} />
                      ))}
                    </div>

                    {/* Fader Cap */}
                    <div 
                      className="absolute w-6 h-5 bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 rounded flex items-center justify-center shadow pointer-events-none"
                      style={{ 
                        bottom: `calc(${deck.volume}% - 10px)`,
                        transform: 'translateY(50%)'
                      }}
                    >
                      <div className="w-full h-[1px] bg-primary shadow-[0_0_2px_#d8163f]" />
                    </div>
                  </div>
                </div>

                {/* headphones cue fader assign */}
                <button
                  onClick={() => {
                    if (isLocked) {
                      playLockoutBlip();
                      return;
                    }
                    playClick(750, 'sine', 0.02);
                    const nextAssign = 
                      deck.crossfaderAssign === 'L' ? 'R' :
                      deck.crossfaderAssign === 'R' ? 'THRU' : 'L';
                    
                    // 1. Instant audio DSP update (zero latency)
                    const state = useAudioStore.getState();
                    const cfMult = audioEngine.computeCrossfaderGain(nextAssign, state.crossfader);
                    audioEngine.setGain(id, deck.volume, cfMult, state.isMuted);

                    // 2. Update Zustand for UI display
                    setDecks((prev: any) => ({
                      ...prev,
                      [id]: { ...prev[id], crossfaderAssign: nextAssign }
                    }));
                  }}
                  className={cn(
                    "mt-2 px-2 py-0.5 rounded text-[7.5px] font-mono font-bold tracking-widest border transition-colors cursor-pointer leading-none",
                    isLocked
                      ? "bg-zinc-950 border-zinc-900/50 text-zinc-800 cursor-not-allowed"
                      : deck.crossfaderAssign === 'L' ? "bg-primary/20 border-primary/30 text-primary"
                      : deck.crossfaderAssign === 'R' ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  {deck.crossfaderAssign}
                </button>
              </div>
            );
          })}
        </div>

        {/* Master Crossfader */}
        <div className="w-full flex flex-col items-center gap-0.5 border-t border-zinc-900/80 pt-1 z-10 shrink-0 select-none">
          <div className="flex justify-between w-full text-[6px] text-zinc-500 font-mono tracking-wider px-1 uppercase font-bold">
            <span>A/B DECK</span>
            <span>CROSSFADER</span>
            <span>C/D DECK</span>
          </div>

          <div className="relative w-full h-5 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-center px-4 overflow-hidden select-none shadow-inner">
            <input 
              type="range"
              min="0"
              max="100"
              value={crossfader}
              title="Crossfader"
              placeholder="Crossfader"
              onChange={(e) => {
                const val = Number(e.target.value);
                setCrossfader(val);
                if (Math.abs(val - 50) < 3) {
                  playClick(880, 'sine', 0.004);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            <div className="w-[95%] h-[1px] bg-zinc-800 absolute" />

            <div 
              className="absolute h-5 bg-gradient-to-r from-zinc-700 to-zinc-900 border border-zinc-600 rounded flex items-center justify-center shadow pointer-events-none"
              style={{ 
                left: `calc(${crossfader}% - 12.5px)`,
                width: '25px'
              }}
            >
              <div className="h-full w-[1px] bg-primary shadow-[0_0_2px_#d8163f]" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [searchQuery, setSearchQuery] = useState('');

  const renderTracklist = () => {
    const filteredMixes = mixGroups
      .filter(g => activeTab === 'all' || g.title.toLowerCase() === activeTab)
      .flatMap(g => g.mixes);

    return (
      <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        <h2 className="text-2xl md:text-4xl font-sans font-bold text-primary tracking-widest uppercase glitch" data-text="01 / MIX ARCHIVE">01 / MIX ARCHIVE</h2>
        
        {/* Horizontal Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-900 pb-4 font-mono select-none">
          {(['all', 'knight club', 'royal court', 'corner new cross'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  playTabClick();
                }}
                onMouseEnter={() => playTick()}
                className={cn(
                  "px-4 py-2 rounded-md text-[9px] md:text-[10px] tracking-widest font-black uppercase border transition-all cursor-pointer active:scale-95 flex items-center gap-2",
                  isActive
                    ? "bg-primary border-primary text-black shadow-[0_0_10px_rgba(216,22,63,0.4)]"
                    : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isActive ? "bg-black animate-pulse" : "bg-zinc-600")} />
                {tab}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredMixes.map(track => {
            const isPlaying = activeVisualizer.isPlaying && (
              decks[leftActiveDeck]?.title === track.title || 
              decks[rightActiveDeck]?.title === track.title
            );
            const playingOnDecks: number[] = [];
            if (decks[1]?.title === track.title && decks[1]?.isPlaying) playingOnDecks.push(1);
            if (decks[2]?.title === track.title && decks[2]?.isPlaying) playingOnDecks.push(2);
            if (decks[3]?.title === track.title && decks[3]?.isPlaying) playingOnDecks.push(3);
            if (decks[4]?.title === track.title && decks[4]?.isPlaying) playingOnDecks.push(4);

            return (
              <div 
                key={track.id}
                onMouseEnter={() => playTick()}
                className={cn(
                  "group flex flex-col gap-4 p-4 rounded-xl border bg-zinc-950/80 hover:bg-zinc-900/60 transition-all duration-300",
                  playingOnDecks.length > 0 ? "border-primary/40 shadow-[0_0_20px_rgba(216,22,63,0.1)]" : "border-zinc-800"
                )}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-800/80 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getSessionImage(track.title)} 
                    alt={track.title}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
                      playingOnDecks.length > 0 && "animate-[pulse_4s_ease-in-out_infinite]"
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Detached Play Button */}
                  <div 
                    onClick={() => {
                      if (isPlaying && playingOnDecks.length > 0) {
                        // Use proper toggle function to pause
                        playingOnDecks.forEach(id => togglePlayGlobal(id));
                      } else {
                        // Play track on the left active deck
                        playTrack(track, leftActiveDeck);
                      }
                      playClick(1000, 'sine', 0.04);
                    }}
                    className={cn(
                      "absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-xl backdrop-blur-md transition-all duration-300 border-2",
                      isPlaying 
                        ? "bg-primary text-black border-primary/20 scale-110 shadow-[0_0_15px_rgba(216,22,63,0.5)]" 
                        : "bg-black/40 text-white border-white/10 hover:bg-white hover:text-black hover:scale-110"
                    )}
                  >
                    {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-1">
                  <h3 className="font-bold text-lg md:text-xl text-white uppercase tracking-wide truncate">{track.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
                      {track.isLocalFile ? "Local Wave / M4A" : "SoundCloud Stream"}
                    </span>
                    {playingOnDecks.length > 0 && (
                      <span className="text-primary font-bold animate-pulse text-[10px] tracking-widest">
                        LIVE [D{playingOnDecks.join(', ')}]
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-2 line-clamp-2">
                     {getTrackDescription(track.title, track.isLocalFile)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <section id="vault" className="w-full relative pt-2 pb-2 px-2 md:px-4 max-w-[1800px] mx-auto overflow-y-auto md:overflow-hidden flex flex-col justify-start md:justify-center @container h-auto md:h-[calc(100dvh-5rem)]">

 
      <div 
        ref={archiveRef} 
        onMouseMove={handleMouseMove}
        className={cn(
          "relative w-full rounded-xl border border-dashed overflow-y-auto md:overflow-hidden flex flex-col gap-2 p-2 md:p-2.5 h-auto md:h-full",
          isDepth ? "border-zinc-800 bg-zinc-950/40" : "border-black/20"
        )}
      >
        <AudioVisualizerBackground isDepth={isDepth} mouseX={mouseX} mouseY={mouseY} isPlaying={activeVisualizer.isPlaying} />

        {/* Persistent Retro-Futuristic Header with Toggle Button */}
        <div className="w-full flex justify-between items-center z-30 font-mono select-none px-3 py-2 shrink-0 border-b border-zinc-900 bg-black/60 backdrop-blur rounded-lg mb-1">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#D8163F]" />
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-xs glitch" data-text="HENRY IX // CDJ PORTFOLIO">
              HENRY IX // CDJ PORTFOLIO
            </span>
          </div>
          <button
            onClick={() => {
              if (setActiveView) {
                setActiveView(activeView === 'cdj' ? 'tracklist' : 'cdj');
                playClick(800, 'sine', 0.02);
              }
            }}
            className={cn(
              "px-4 py-1.5 rounded-md font-mono text-[9px] md:text-[10px] tracking-widest font-black uppercase border transition-all cursor-pointer active:scale-95 flex items-center gap-2",
              activeView === 'tracklist'
                ? "bg-primary border-primary text-black shadow-[0_0_10px_rgba(216,22,63,0.4)]"
                : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", activeView === 'tracklist' ? "bg-black animate-pulse" : "bg-zinc-600")} />
            {activeView === 'cdj' ? 'TRACKLIST VIEW' : 'DECK VIEW'}
          </button>
        </div>

        {activeView === 'cdj' ? (
          <>
            {/* Stacked Dual Deck Waveforms at the top */}
            <DualDeckWaveforms 
              leftDeck={{ ...decks[leftActiveDeck], deckNum: leftActiveDeck }} 
              rightDeck={{ ...decks[rightActiveDeck], deckNum: rightActiveDeck }} 
              isDepth={isDepth} 
              audioElementsRef={audioElementsRef}
            />

            {/* 3-Column DJ Controller Panel */}
            <div className="w-full flex flex-col md:flex-row gap-4 items-stretch justify-center relative select-none flex-grow min-h-0 h-auto md:h-full">
              {/* Left Platter controller (A/B) */}
              <div className="w-full md:w-[38%] flex flex-col h-full min-h-0">
                {renderPlatter(leftActiveDeck)}
              </div>

              {/* Central 4-Channel Mixer */}
              <div className="w-full md:w-[24%] flex flex-col h-full min-h-0">
                {renderMixer()}
              </div>
              {/* Right Platter controller (C/D) */}
              <div className="w-full md:w-[38%] flex flex-col h-full min-h-0">
                {renderPlatter(rightActiveDeck)}
              </div>
            </div>
          </>
        ) : (
          renderTracklist()
        )}
      </div>
    </section>
  );
}

export default function CDJPortal({ isDepth = true, activeView: initialActiveView = 'cdj' }: { isDepth?: boolean, activeView?: 'cdj' | 'tracklist' }) {
  const [activeView, setActiveView] = useState<'cdj' | 'tracklist'>(initialActiveView);

  // Reactive deck state from Zustand — granular subscriptions, no cascade
  const decks = useAudioStore(s => s.decks);
  const crossfader = useAudioStore(s => s.crossfader);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);
  const { setDecks, setCrossfader, setLeftActiveDeck, setRightActiveDeck } = useAudioStore();

  // Non-reactive engine refs + imperative functions from context
  const {
    playTrack, playLockoutBlip, togglePlayGlobal,
    widgetRefs, initAudioDSP, loadLocalFile, seekLocalBuffer,
    audioElementsRef, playPendingRef, scratchingRef, alignSyncPlayback
  } = useAudio();

  return (
    <MixArchive 
      isDepth={isDepth} 
      activeView={activeView} 
      setActiveView={setActiveView}
      decks={decks}
      setDecks={setDecks}
      crossfader={crossfader}
      setCrossfader={setCrossfader}
      leftActiveDeck={leftActiveDeck}
      setLeftActiveDeck={setLeftActiveDeck}
      rightActiveDeck={rightActiveDeck}
      setRightActiveDeck={setRightActiveDeck}
      playTrack={playTrack}
      playLockoutBlip={playLockoutBlip}
      togglePlayGlobal={togglePlayGlobal}
      widgetRefs={widgetRefs}
      initAudioDSP={initAudioDSP}
      loadLocalFile={loadLocalFile}
      seekLocalBuffer={seekLocalBuffer}
      audioElementsRef={audioElementsRef}
      playPendingRef={playPendingRef}
      scratchingRef={scratchingRef}
      alignSyncPlayback={alignSyncPlayback}
    />
  );
}
