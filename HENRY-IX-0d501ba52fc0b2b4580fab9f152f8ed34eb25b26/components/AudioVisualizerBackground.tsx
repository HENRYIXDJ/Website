'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useMotionTemplate } from 'framer-motion';
import { useAudio } from './AudioProvider';

/**
 * AudioVisualizerBackground
 *
 * Uses OffscreenCanvas API (Chrome 69+, Firefox 105+, Safari 17+) to run
 * the entire render loop inside a Web Worker, keeping the main thread free.
 *
 * Graceful fallback: if OffscreenCanvas is not supported (older Safari),
 * rendering falls back to the classic on-canvas approach.
 */
export default function AudioVisualizerBackground({
  isDepth,
  mouseX,
  mouseY,
  isPlaying,
}: {
  isDepth: boolean;
  mouseX: any;
  mouseY: any;
  isPlaying: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtx = useAudio();
  const analyser = audioCtx?.analyserNode;

  // Worker and RAF refs
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const offscreenInitialisedRef = useRef(false);
  const fallbackRef = useRef(false); // true if OffscreenCanvas not supported

  const isPlayingRef = useRef(isPlaying);
  const isDepthRef = useRef(isDepth);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    isDepthRef.current = isDepth;
  }, [isPlaying, isDepth]);

  // ── On mount: decide OffscreenCanvas vs. fallback ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If we've already initialized either path, don't try again
    if (offscreenInitialisedRef.current || fallbackRef.current) return;

    const supportsOffscreen = typeof canvas.transferControlToOffscreen === 'function';

    if (supportsOffscreen && typeof Worker !== 'undefined') {
      // ── OffscreenCanvas path ───────────────────────────────────────────
      try {
        const offscreen = canvas.transferControlToOffscreen();
        const worker = new Worker('/workers/visualizer.worker.js');
        workerRef.current = worker;
        offscreenInitialisedRef.current = true;

        worker.postMessage(
          {
            type: 'init',
            canvas: offscreen,
            width: window.innerWidth,
            height: window.innerHeight,
            isDepth,
          },
          [offscreen] // Transfer ownership — zero copy
        );

        // Main thread: send a lightweight frequency snapshot every frame
        const bufferLength = analyser ? analyser.frequencyBinCount : 64;
        dataArrayRef.current = new Uint8Array(bufferLength);

        const tick = () => {
          if (analyser && dataArrayRef.current) {
            analyser.getByteFrequencyData(dataArrayRef.current);
          }
          // Pass raw array directly — structured cloning of a tiny typed array
          // is optimised by the browser and avoids the per-frame allocation that
          // .slice() caused (which was triggering GC micro-stutters at 60fps).
          const mX = mouseX && mouseX.get ? mouseX.get() : window.innerWidth / 2;
          const mY = mouseY && mouseY.get ? mouseY.get() : window.innerHeight / 2;

          workerRef.current?.postMessage({
            type: 'frame',
            frequencyData: dataArrayRef.current,
            isPlaying: isPlayingRef.current,
            mouseX: isFinite(mX) ? mX : window.innerWidth / 2,
            mouseY: isFinite(mY) ? mY : window.innerHeight / 2,
            isDepth: isDepthRef.current,
          });

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        // Resize: tell the worker
        const handleResize = () => {
          worker.postMessage({ type: 'resize', width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);

        return () => {
          cancelAnimationFrame(rafRef.current);
          window.removeEventListener('resize', handleResize);
          worker.postMessage({ type: 'stop' });
          worker.terminate();
          workerRef.current = null;
        };
      } catch (e) {
        // If transferControlToOffscreen fails, fall through to fallback
        console.warn('OffscreenCanvas setup failed, falling back:', e);
        offscreenInitialisedRef.current = false;
        fallbackRef.current = true;
      }
    } else {
      fallbackRef.current = true;
    }

    // Only run fallback if OffscreenCanvas initialization failed
    if (fallbackRef.current && !offscreenInitialisedRef.current) {
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) return;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      const bufferLength = analyser ? analyser.frequencyBinCount : 64;
      const dataArray = new Uint8Array(bufferLength);
      let bassSmooth = 0, midSmooth = 0, highSmooth = 0;

      const renderFallback = () => {
        ctx2d.clearRect(0, 0, width, height);

        let bass = 0, mid = 0, high = 0;
        if (analyser && isPlayingRef.current) {
          analyser.getByteFrequencyData(dataArray);
          const bassEnd = Math.min(15, bufferLength);
          for (let i = 0; i < bassEnd; i++) bass += dataArray[i] || 0;
          bass /= bassEnd;
          for (let i = 16; i < Math.min(80, bufferLength); i++) mid += dataArray[i] || 0;
          mid /= Math.min(64, bufferLength);
          for (let i = 81; i < Math.min(150, bufferLength); i++) high += dataArray[i] || 0;
          high /= Math.min(69, bufferLength);
        }

        bassSmooth += (bass - bassSmooth) * 0.15;
        midSmooth += (mid - midSmooth) * 0.15;
        highSmooth += (high - highSmooth) * 0.15;

        if (!isFinite(bassSmooth)) bassSmooth = 0;
        if (!isFinite(midSmooth)) midSmooth = 0;
        if (!isFinite(highSmooth)) highSmooth = 0;

        let mX = mouseX && mouseX.get ? mouseX.get() : width / 2;
        let mY = mouseY && mouseY.get ? mouseY.get() : height / 2;
        if (!isFinite(mX)) mX = width / 2;
        if (!isFinite(mY)) mY = height / 2;

        if (isPlayingRef.current) {
          ctx2d.save();
          ctx2d.globalCompositeOperation = 'screen';

          let outerRadius = 80 + highSmooth * 1.5;
          if (!isFinite(outerRadius) || outerRadius <= 0) outerRadius = 80;
          const outerGlow = ctx2d.createRadialGradient(mX, mY, 0, mX, mY, outerRadius);
          outerGlow.addColorStop(0, isDepthRef.current ? 'rgba(216, 22, 63, 0.06)' : 'rgba(216, 22, 63, 0.03)');
          outerGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.02)');
          outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx2d.fillStyle = outerGlow;
          ctx2d.beginPath();
          ctx2d.arc(mX, mY, outerRadius, 0, Math.PI * 2);
          ctx2d.fill();

          let innerRadius = 30 + bassSmooth * 2.2;
          if (!isFinite(innerRadius) || innerRadius <= 0) innerRadius = 30;
          const innerGlow = ctx2d.createRadialGradient(mX, mY, 0, mX, mY, innerRadius);
          innerGlow.addColorStop(0, isDepthRef.current ? 'rgba(216, 22, 63, 0.22)' : 'rgba(216, 22, 63, 0.12)');
          innerGlow.addColorStop(0.4, 'rgba(216, 22, 63, 0.04)');
          innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx2d.fillStyle = innerGlow;
          ctx2d.beginPath();
          ctx2d.arc(mX, mY, innerRadius, 0, Math.PI * 2);
          ctx2d.fill();
          ctx2d.restore();
        }

        const barCount = 48;
        const barWidth = width / barCount;
        const themeColor = isDepthRef.current ? 'rgba(216, 22, 63,' : 'rgba(24, 24, 27,';
        ctx2d.save();
        ctx2d.globalAlpha = 0.07;
        for (let i = 0; i < barCount; i++) {
          const sampleIdx = Math.max(0, Math.min(bufferLength - 1, Math.floor(Math.pow(i / barCount, 1.8) * Math.max(1, bufferLength - 10))));
          const rawVal = isPlayingRef.current && analyser ? (dataArray[sampleIdx] || 0) : 0;
          let barHeight = (rawVal / 255) * (height * 0.22);
          barHeight = isPlayingRef.current ? Math.max(4, barHeight + Math.sin(i * 0.15 + performance.now() * 0.005) * 2) : 4;
          const grad = ctx2d.createLinearGradient(i * barWidth, height, i * barWidth, height - barHeight);
          grad.addColorStop(0, `${themeColor} 0.8)`);
          grad.addColorStop(0.5, `${themeColor} 0.3)`);
          grad.addColorStop(1, `${themeColor} 0.0)`);
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(i * barWidth + 2, height - barHeight, barWidth - 4, barHeight);
        }
        ctx2d.restore();

        rafRef.current = requestAnimationFrame(renderFallback);
      };

      rafRef.current = requestAnimationFrame(renderFallback);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(rafRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyser]);

  // ── Sync isPlaying / mouse / isDepth changes to OffscreenCanvas worker ─
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !offscreenInitialisedRef.current) return;

    const mX = mouseX && mouseX.get ? mouseX.get() : window.innerWidth / 2;
    const mY = mouseY && mouseY.get ? mouseY.get() : window.innerHeight / 2;

    worker.postMessage({
      type: 'frame',
      isPlaying,
      mouseX: isFinite(mX) ? mX : window.innerWidth / 2,
      mouseY: isFinite(mY) ? mY : window.innerHeight / 2,
      isDepth,
    });
  }, [isPlaying, isDepth, mouseX, mouseY]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Canvas — controlled by OffscreenCanvas worker or fallback */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* CSS fallback radial glow for older browsers / SSR */}
      <motion.div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-40 z-0"
        style={{
          background: useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, ${
            isDepth ? 'rgba(211, 15, 49, 0.08)' : 'rgba(211, 15, 49, 0.04)'
          }, transparent 60%)`,
        }}
      />

      {/* Subtle scanline overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
