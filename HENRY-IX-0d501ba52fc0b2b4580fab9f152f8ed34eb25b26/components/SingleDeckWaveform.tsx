'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { cn } from '@/lib/utils';
import { getWaveformHeight } from '@/lib/mixes';
import { audioEngine } from '@/lib/AudioEngine';

interface SingleDeckWaveformProps {
  deckId: 1 | 2 | 3 | 4;
  deck: any;
  isDepth: boolean;
}

export function SingleDeckWaveform({
  deckId,
  deck,
  isDepth
}: SingleDeckWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef(deck);
  const smoothProgressRef = useRef<number>(deck?.progress || 0);

  // References for ultra-smooth jitter-free interpolation
  const isPlayingRef = useRef<boolean>(false);
  const lastFrameTimeRef = useRef<number>(0);
  const lastDrawnProgressRef = useRef<number>(-1);
  const lastDrawnDeckStateRef = useRef<string>('');

  // Subscribe to Zustand state for real-time phase sync calculations
  const allDecks = useAudioStore(s => s.decks);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);
  const visualLatencyOffset = useAudioStore(s => s.visualLatencyOffset);

  const allDecksRef = useRef(allDecks);
  const leftActiveDeckRef = useRef(leftActiveDeck);
  const rightActiveDeckRef = useRef(rightActiveDeck);
  const visualLatencyOffsetRef = useRef(visualLatencyOffset);

  useEffect(() => {
    allDecksRef.current = allDecks;
    leftActiveDeckRef.current = leftActiveDeck;
    rightActiveDeckRef.current = rightActiveDeck;
    visualLatencyOffsetRef.current = visualLatencyOffset;
  }, [allDecks, leftActiveDeck, rightActiveDeck, visualLatencyOffset]);

  const [dragState, setDragState] = useState<{
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

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  const pixelsPerSecond = 55;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const render = () => {
      const currentDeck = deckRef.current;
      if (!currentDeck) {
        frameId = requestAnimationFrame(render);
        return;
      }

      let targetProgress = currentDeck.progress || 0;
      let isCurrentlyPlaying = currentDeck.isPlaying;

      if (!currentDeck.scMode) {
        const audio = audioEngine.audioElements[deckId];
        if (audio && audio.src) {
          targetProgress = audio.currentTime;
          isCurrentlyPlaying = !audio.paused;
        }
      }

      const drag = dragStateRef.current;

      // Optimize CPU usage: if not playing, not dragging, and state hasn't changed, skip redrawing
      const stateKey = `${currentDeck.eqLow}_${currentDeck.eqMid}_${currentDeck.eqHi}_${currentDeck.volume}_${currentDeck.isLoopActive}_${currentDeck.mainCue}_${currentDeck.bpm}_${currentDeck.pitch}`;
      if (!isCurrentlyPlaying && !drag && lastDrawnProgressRef.current === targetProgress && lastDrawnDeckStateRef.current === stateKey) {
        frameId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.parentElement?.clientWidth || 300;
      const height = canvas.parentElement?.clientHeight || 64;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.clearRect(0, 0, width * dpr, height * dpr);

      // Support High-DPI screen drawing scale
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. CHASSIS BACKGROUND
      ctx.fillStyle = '#070709'; 
      ctx.fillRect(0, 0, width, height);

      // Horizontal central splits
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.moveTo(0, height);
      ctx.lineTo(width, height);
      ctx.stroke();

      const sysTime = performance.now();

      const pitchModifier = 1 + (currentDeck.pitch || 0) / 100;

      // Ultra-smooth interpolation using high-resolution monotonic system clock
      if (isCurrentlyPlaying) {
        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          smoothProgressRef.current = targetProgress;
          lastFrameTimeRef.current = sysTime;
        }

        const dt = (sysTime - lastFrameTimeRef.current) / 1000;
        const clampedDt = Math.max(0, Math.min(0.1, dt));
        let estProgress = smoothProgressRef.current + clampedDt * pitchModifier;

        const drift = targetProgress - estProgress;
        if (Math.abs(drift) > 0.3) {
          // Seek/Jump event: snap instantly
          estProgress = targetProgress;
        } else {
          // Gentle pull to prevent drift without wiggles/skips
          estProgress += drift * 0.08;
        }

        smoothProgressRef.current = estProgress;
      } else {
        isPlayingRef.current = false;
        smoothProgressRef.current = targetProgress;
      }
      lastFrameTimeRef.current = sysTime;

      const rawProgress = smoothProgressRef.current;
      const progress = rawProgress - (visualLatencyOffsetRef.current / 1000);

      const isLocked = currentDeck.id === 'locked';

      // Phase sync calculation (Deck A vs Deck B / Left vs Right active deck)
      let isSyncGlow = false;
      const otherActiveDeckId = (deckId === 1 || deckId === 2) ? rightActiveDeckRef.current : leftActiveDeckRef.current;
      const otherDeck = allDecksRef.current[otherActiveDeckId];
      if (otherDeck && otherDeck.id !== 'locked' && currentDeck.id !== 'locked') {
        const bpmCurrent = currentDeck.bpm * (1 + (currentDeck.pitch || 0) / 100);
        const bpmOther = otherDeck.bpm * (1 + (otherDeck.pitch || 0) / 100);

        const beatIntervalCurrent = 60 / bpmCurrent;
        const beatIntervalOther = 60 / bpmOther;

        // Get actual progress of other deck (considering raw elements if loaded locally)
        let progressOther = otherDeck.progress || 0;
        if (!otherDeck.scMode) {
          const audioOther = audioEngine.audioElements[otherActiveDeckId];
          if (audioOther && audioOther.src) {
            progressOther = audioOther.currentTime;
          }
        }

        const phaseCurrent = ((rawProgress - (currentDeck.firstBeatOffset || 0)) % beatIntervalCurrent) / beatIntervalCurrent;
        const phaseOther = ((progressOther - (otherDeck.firstBeatOffset || 0)) % beatIntervalOther) / beatIntervalOther;

        const isBothPlaying = isCurrentlyPlaying && (otherDeck.isPlaying || (audioEngine.audioElements[otherActiveDeckId] && !audioEngine.audioElements[otherActiveDeckId]?.paused));

        if (isBothPlaying) {
          const diff = Math.abs(phaseCurrent - phaseOther);
          isSyncGlow = diff < 0.08 || Math.abs(diff - 1) < 0.08 || Math.abs(diff + 1) < 0.08;
        }
      }

      if (isLocked) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.02)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.05)';
        ctx.lineWidth = 3;
        const stripeWidth = 24;
        const stripeOffset = (progress * 15) % stripeWidth;
        ctx.beginPath();
        for (let x = -stripeWidth; x < width + stripeWidth; x += stripeWidth) {
          ctx.moveTo(x + stripeOffset, 0);
          ctx.lineTo(x + stripeOffset + 12, height);
        }
        ctx.stroke();

        ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("COMING SOON", width / 2, height / 2);
      } else {
        const eqLow = currentDeck.eqLow ?? 50;
        const eqMid = currentDeck.eqMid ?? 50;
        const eqHi = currentDeck.eqHi ?? 50;
        const volume = currentDeck.volume ?? 80;
        
        const lowMod = eqLow / 50;
        const midMod = eqMid / 50;
        const hiMod = eqHi / 50;
        const volumeMod = volume / 80;

        const peaks = currentDeck.waveformPeaks || [];
        const halfH = height / 2;
        const PEAK_DENSITY = 4;
        const centerX = width / 2;

        const t_start = progress - centerX / pixelsPerSecond;
        const t_end = progress + centerX / pixelsPerSecond;

        // Build points in track coordinate space
        const points: { x: number; lowH: number; midH: number; highH: number; }[] = [];
        
        if (peaks.length > 0) {
          const i_start = Math.max(0, Math.floor(t_start * PEAK_DENSITY) - 2);
          const i_end = Math.min(peaks.length - 1, Math.ceil(t_end * PEAK_DENSITY) + 2);

          for (let i = i_start; i <= i_end; i++) {
            const t = i / PEAK_DENSITY;
            const x = t * pixelsPerSecond;
            const hVal = peaks[i];

            const baseLow = hVal * 0.9;
            const baseMid = hVal * 0.65;
            const baseHigh = hVal * 0.45;

            const lowHeight = Math.max(1.5, baseLow * (height - 4) * lowMod * volumeMod);
            const midHeight = Math.max(1.5, baseMid * (height - 8) * midMod * volumeMod);
            const highHeight = Math.max(1.5, baseHigh * (height - 12) * hiMod * volumeMod);

            points.push({ x, lowH: lowHeight, midH: midHeight, highH: highHeight });
          }
        } else {
          // Fallback static peaks using getWaveformHeight
          const sampleStep = 0.25;
          const idxStart = Math.max(0, Math.floor(t_start / sampleStep));
          const idxEnd = Math.ceil(t_end / sampleStep);
          const seedStr = currentDeck.link || currentDeck.id || '';
          const duration = currentDeck.duration || 300;

          for (let idx = idxStart; idx <= idxEnd; idx++) {
            const t = idx * sampleStep;
            const x = t * pixelsPerSecond;
            
            const idxVal = idx % 14;
            const hVal = getWaveformHeight(seedStr, idxVal, duration);

            const baseLow = hVal * 0.9;
            const baseMid = hVal * 0.65;
            const baseHigh = hVal * 0.45;

            const lowHeight = Math.max(1.5, baseLow * (height - 4) * lowMod * volumeMod);
            const midHeight = Math.max(1.5, baseMid * (height - 8) * midMod * volumeMod);
            const highHeight = Math.max(1.5, baseHigh * (height - 12) * hiMod * volumeMod);

            points.push({ x, lowH: lowHeight, midH: midHeight, highH: highHeight });
          }
        }

        // SAVE & TRANSLATE CONTEXT TO PLAYHEAD ALIGNMENT
        ctx.save();
        ctx.translate(centerX - progress * pixelsPerSecond, 0);

        // 1. Draw Beatgrid lines inside translated space
        const currentBpm = currentDeck.bpm * (1 + (currentDeck.pitch || 0) / 100);
        const beatInterval = 60 / currentBpm;
        const offset = currentDeck.firstBeatOffset || 0;
        const startBeat = Math.floor((t_start - offset) / beatInterval);
        const endBeat = Math.ceil((t_end - offset) / beatInterval);

        for (let b = startBeat; b <= endBeat; b++) {
          const beatTime = offset + b * beatInterval;
          const x = beatTime * pixelsPerSecond;
          const isMajorBar = b % 4 === 0;
          ctx.strokeStyle = isMajorBar ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = isMajorBar ? 1.25 : 0.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          if (isMajorBar && b >= 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = 'bold 7.5px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`BAR ${Math.floor(b / 4) + 1}`, x, 2);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.moveTo(x - 2, 0);
            ctx.lineTo(x + 2, 0);
            ctx.lineTo(x, 2.5);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(x - 2, height);
            ctx.lineTo(x + 2, height);
            ctx.lineTo(x, height - 2.5);
            ctx.fill();
          }
        }

        // 2. Draw Waveform bands inside translated space
        if (points.length > 0) {
          // Low Band (Vivid Cyan/Blue foundation)
          ctx.fillStyle = 'rgba(0, 162, 255, 0.4)';
          ctx.strokeStyle = 'rgba(0, 190, 255, 0.85)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[0].x, halfH);
          for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].x, halfH - points[i].lowH / 2);
          }
          for (let i = points.length - 1; i >= 0; i--) {
            ctx.lineTo(points[i].x, halfH + points[i].lowH / 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Mid Band (Vivid Neon Orange)
          ctx.fillStyle = 'rgba(255, 120, 0, 0.7)';
          ctx.strokeStyle = 'rgba(255, 150, 0, 0.95)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[0].x, halfH);
          for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].x, halfH - points[i].midH / 2);
          }
          for (let i = points.length - 1; i >= 0; i--) {
            ctx.lineTo(points[i].x, halfH + points[i].midH / 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // High Band (Pure Bright White)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(points[0].x, halfH);
          for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].x, halfH - points[i].highH / 2);
          }
          for (let i = points.length - 1; i >= 0; i--) {
            ctx.lineTo(points[i].x, halfH + points[i].highH / 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // 3. Draw Loop Overlay inside translated space
        if (currentDeck.isLoopActive && currentDeck.loopIn !== null && currentDeck.loopIn !== undefined && currentDeck.loopOut !== null && currentDeck.loopOut !== undefined) {
          const xIn = currentDeck.loopIn * pixelsPerSecond;
          const xOut = currentDeck.loopOut * pixelsPerSecond;
          
          if (xIn < xOut) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
            ctx.fillRect(xIn, 0, xOut - xIn, height);
            
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(xIn, 0);
            ctx.lineTo(xIn, height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xOut, 0);
            ctx.lineTo(xOut, height);
            ctx.stroke();
          }
        }

        // 4. Draw main cue line inside translated space
        if (currentDeck.mainCue !== undefined && currentDeck.mainCue !== null) {
          const x = currentDeck.mainCue * pixelsPerSecond;
          const color = '#f97316';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x - 5, 0);
          ctx.lineTo(x + 5, 0);
          ctx.lineTo(x + 5, 8);
          ctx.lineTo(x, 11);
          ctx.lineTo(x - 5, 8);
          ctx.closePath();
          ctx.fill();
          
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CUE', x, 4.5);
        }

        // 5. Draw Hot Cues inside translated space
        const hotCues = currentDeck.hotCues || {};
        const HOT_CUE_COLORS: Record<string, string> = {
          A: '#ef4444',
          B: '#f97316',
          C: '#eab308',
          D: '#22c55e',
          E: '#06b6d4',
          F: '#3b82f6',
          G: '#a855f7',
          H: '#ec4899'
        };

        Object.entries(hotCues).forEach(([pad, time]) => {
          if (time !== null && time !== undefined) {
            const x = (time as number) * pixelsPerSecond;
            const color = HOT_CUE_COLORS[pad] || '#ffffff';
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x - 5, 0);
            ctx.lineTo(x + 5, 0);
            ctx.lineTo(x + 5, 8);
            ctx.lineTo(x, 11);
            ctx.lineTo(x - 5, 8);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pad, x, 4.5);
          }
        });

        // RESTORE TRANSLATION TO ABSOLUTE PAGE COORDINATES
        ctx.restore();
      }

      // CENTER PLAYHEAD LINE (GLOWING CRIMSON or GREEN SYNC)
      ctx.save();
      const playheadColor = isSyncGlow ? '#10b981' : '#d8163f';
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = playheadColor;
      ctx.shadowBlur = 5;
      
      const playheadX = Math.round(width / 2);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.restore();

      // Playhead triangle top/bottom
      ctx.fillStyle = playheadColor;
      ctx.beginPath();
      ctx.moveTo(playheadX - 4, 0);
      ctx.lineTo(playheadX + 4, 0);
      ctx.lineTo(playheadX, 5);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(playheadX - 4, height);
      ctx.lineTo(playheadX + 4, height);
      ctx.lineTo(playheadX, height - 5);
      ctx.fill();

      // Central Sync diamond
      ctx.save();
      ctx.fillStyle = playheadColor;
      ctx.shadowColor = playheadColor;
      ctx.shadowBlur = isSyncGlow ? 6 : 0;
      ctx.beginPath();
      ctx.moveTo(playheadX - 4.5, Math.round(height / 2));
      ctx.lineTo(playheadX, Math.round(height / 2 - 4.5));
      ctx.lineTo(playheadX + 4.5, Math.round(height / 2));
      ctx.lineTo(playheadX, Math.round(height / 2 + 4.5));
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Drag overlay HUD (milliseconds precision)
      if (drag) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 10, 12, 0.9)';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = drag.isShift ? '#f59e0b' : '#3b82f6';
        ctx.lineWidth = 1;
        ctx.font = 'bold 8px monospace';
        
        const badgeY = height - 14;
        
        let text = '';
        if (drag.isShift) {
          const dragOffset = currentDeck.firstBeatOffset || 0;
          text = `[SHIFT] GRID ADJUST: Offset ${dragOffset.toFixed(3)}s`;
        } else {
          const dragTime = progress;
          text = `[DRAG] SCRATCH SEEK: ${dragTime.toFixed(3)}s`;
        }
        
        const textWidth = ctx.measureText(text).width;
        const badgeW = textWidth + 12;
        const badgeH = 11;
        const badgeX = (width - badgeW) / 2;
        
        ctx.beginPath();
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, badgeY + badgeH / 2 + 0.5);
        ctx.restore();
      }

      ctx.restore(); // Restore DPR scaling matrix

      lastDrawnProgressRef.current = targetProgress;
      lastDrawnDeckStateRef.current = stateKey;

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [deckId]);

  const handleStart = (clientX: number, isShift: boolean) => {
    const currentDeck = deckRef.current;
    if (!currentDeck || currentDeck.id === 'locked') return;

    const audio = audioEngine.audioElements[deckId];
    const startTime = audio ? audio.currentTime : (currentDeck.progress || 0);
    const duration = audio ? audio.duration : (currentDeck.duration || 300);
    const startOffset = currentDeck.firstBeatOffset || 0;

    setDragState({
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
      useAudioStore.getState().setDeck(deckId, { firstBeatOffset: newOffset });
    } else {
      const audio = audioEngine.audioElements[deckId];
      const dur = isFinite(drag.duration) && !isNaN(drag.duration) ? drag.duration : 300;
      const newTime = Math.max(0, Math.min(dur, drag.startTime - deltaSec));
      if (audio && isFinite(newTime) && !isNaN(newTime)) {
        // eslint-disable-next-line react-hooks/immutability
        audio.currentTime = newTime;
      }
      useAudioStore.getState().setDeck(deckId, { progress: newTime });
    }
  };

  const handleEnd = () => {
    setDragState(null);
  };

  return (
    <div className="relative w-full h-full min-h-[48px] max-h-[100px] bg-black rounded border border-zinc-900 overflow-hidden shadow-inner flex items-center justify-center mb-1 select-none shrink-0 z-10">
      <canvas 
        ref={canvasRef} 
        className={cn("w-full h-full block touch-none", dragState ? 'cursor-grabbing' : 'cursor-grab')} 
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handleStart(e.clientX, e.shiftKey);
        }}
        onPointerMove={(e) => handleMove(e.clientX)}
        onPointerUp={(e) => {
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err){}
          handleEnd();
        }}
        onPointerCancel={(e) => {
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err){}
          handleEnd();
        }}
      />
    </div>
  );
}
