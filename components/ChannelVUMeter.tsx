'use client';

import React, { useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/AudioEngine';

interface ChannelVUMeterProps {
  deckId: number;
  trim: number;
  volume: number;
  isPlaying: boolean;
}

const TOTAL_LEDS = 12;

export function ChannelVUMeter({ deckId, trim, volume, isPlaying }: ChannelVUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let level = 0;
    let peakHoldSegment = 0;
    let peakHoldTime = 0;
    const dataArray = new Uint8Array(64);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let rawSignal = 0;

      // Sample real-time audio frequency data from Web Audio Analyser node
      const analyserNode = audioEngine.getDeckAnalyser(deckId);
      if (isPlaying && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        rawSignal = avg / 255; // 0.0 to 1.0
      }

      // Calculate Trim gain factor (TRIM 50 = 1.0x, TRIM 100 = 2.5x overdrive)
      const trimMultiplier = trim <= 50 ? (trim / 50) : 1.0 + ((trim - 50) / 50) * 1.5;
      const faderMultiplier = volume / 100;

      // Peak target level incorporating audio signal, trim gain, and fader volume
      const targetLevel = rawSignal * trimMultiplier * faderMultiplier;

      // Smooth decay animation for analog VU meter physics
      level = level < targetLevel ? targetLevel : level * 0.88;

      const isClipping = targetLevel >= 0.88;
      const segmentHeight = (canvas.height - (TOTAL_LEDS - 1) * 2) / TOTAL_LEDS;
      const activeSegments = Math.round(level * TOTAL_LEDS);

      const now = performance.now();
      if (activeSegments >= peakHoldSegment) {
        peakHoldSegment = activeSegments;
        peakHoldTime = now;
      } else if (now - peakHoldTime > 1200) {
        peakHoldSegment = Math.max(0, peakHoldSegment - 0.25);
      }

      for (let i = 0; i < TOTAL_LEDS; i++) {
        // LED index 0 is top (Red peak CLIP), index 11 is bottom (Green)
        const ledIndexFromBottom = TOTAL_LEDS - 1 - i;
        const isActive = ledIndexFromBottom < activeSegments || Math.floor(peakHoldSegment) === ledIndexFromBottom;

        // Color thresholding: Green (bottom 6), Yellow (middle 3), Red (top 3 peak overdrive)
        let colorOn = '#10b981'; // Emerald Green
        let colorOff = 'rgba(16, 185, 129, 0.15)';

        if (ledIndexFromBottom === TOTAL_LEDS - 1) {
          // Topmost LED: CLIP indicator
          colorOn = '#ff0033'; // Vivid Clip Red
          colorOff = 'rgba(255, 0, 51, 0.15)';
        } else if (ledIndexFromBottom >= 9) {
          // Top 3 LEDs: Red (Overdrive / +3dB)
          colorOn = '#f43f5e'; // Pioneer Accent Red
          colorOff = 'rgba(244, 63, 94, 0.15)';
        } else if (ledIndexFromBottom >= 6) {
          // Middle 3 LEDs: Yellow (0dB)
          colorOn = '#eab308'; // Pioneer Gold/Yellow
          colorOff = 'rgba(234, 179, 8, 0.15)';
        }

        const y = i * (segmentHeight + 2);

        ctx.fillStyle = isActive ? colorOn : colorOff;
        if (isActive) {
          ctx.shadowColor = colorOn;
          ctx.shadowBlur = ledIndexFromBottom >= 9 ? 8 : 4;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(0, y, canvas.width, segmentHeight);
      }

      // If clipping, draw subtle CLIP flash
      if (isClipping) {
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = 'rgba(255, 0, 51, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillRect(0, 0, canvas.width, segmentHeight);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [deckId, trim, volume, isPlaying]);

  return (
    <div className="relative w-full max-w-[24px] h-8 flex flex-col items-center justify-center bg-black rounded-none border border-zinc-900 p-0.5 my-0.5">
      <canvas
        ref={canvasRef}
        width={8}
        height={32}
        className="w-full h-full block rounded-sm"
      />
    </div>
  );
}
