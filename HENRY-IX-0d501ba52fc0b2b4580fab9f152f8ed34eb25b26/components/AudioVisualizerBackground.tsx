'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useMotionTemplate } from 'framer-motion';
import { useAudio } from './AudioProvider';

// Shared state for fallback mode particle effect
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
}
let fallbackParticles: Particle[] = [];

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
  mode = 'ambient',
}: {
  isDepth: boolean;
  mouseX: any;
  mouseY: any;
  isPlaying: boolean;
  mode?: 'ambient' | 'circular' | 'grid';
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
  const modeRef = useRef(mode);
  const isIntersectingRef = useRef(true);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    isDepthRef.current = isDepth;
    modeRef.current = mode;
  }, [isPlaying, isDepth, mode]);

  // ── On mount: decide OffscreenCanvas vs. fallback ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
      },
      { threshold: 0.0 }
    );
    observer.observe(canvas);

    // If we've already initialized either path, don't try again
    if (offscreenInitialisedRef.current || fallbackRef.current) {
      return () => observer.disconnect();
    }

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
            mode,
          },
          [offscreen] // Transfer ownership — zero copy
        );

        // Main thread: send a lightweight frequency snapshot every frame
        const bufferLength = analyser ? analyser.frequencyBinCount : 64;
        dataArrayRef.current = new Uint8Array(bufferLength);

        const tick = () => {
          if (!isIntersectingRef.current || !isPlayingRef.current) {
            rafRef.current = window.setTimeout(tick, 250) as unknown as number;
            return;
          }
          if (analyser && dataArrayRef.current) {
            analyser.getByteFrequencyData(dataArrayRef.current);
          }
          const mX = mouseX && mouseX.get ? mouseX.get() : window.innerWidth / 2;
          const mY = mouseY && mouseY.get ? mouseY.get() : window.innerHeight / 2;

          workerRef.current?.postMessage({
            type: 'frame',
            frequencyData: dataArrayRef.current,
            isPlaying: isPlayingRef.current,
            mouseX: isFinite(mX) ? mX : window.innerWidth / 2,
            mouseY: isFinite(mY) ? mY : window.innerHeight / 2,
            isDepth: isDepthRef.current,
            mode: modeRef.current,
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
          clearTimeout(rafRef.current);
          window.removeEventListener('resize', handleResize);
          worker.postMessage({ type: 'stop' });
          worker.terminate();
          workerRef.current = null;
          observer.disconnect();
        };
      } catch (e) {
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
        if (!isIntersectingRef.current || !isPlayingRef.current) {
          rafRef.current = window.setTimeout(renderFallback, 250) as unknown as number;
          return;
        }
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
        } else if (isPlayingRef.current) {
          const t = performance.now() * 0.003;
          bass = 40 + Math.sin(t) * 15;
          mid = 30 + Math.cos(t * 1.3) * 10;
          high = 20 + Math.sin(t * 2.1) * 8;
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

        const currentMode = modeRef.current;

        if (currentMode === 'ambient') {
          // --- ORIGINAL GLOWS ---
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

          // Spectrum Bars
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

        } else if (currentMode === 'circular') {
          // --- CIRCULAR NEBULA ---
          const centerPointX = width / 2;
          const centerPointY = height / 2;
          const baseRadius = Math.min(width, height) * 0.18 + bassSmooth * 0.4;
          const numPoints = 120;

          ctx2d.save();
          ctx2d.beginPath();
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2 + (isPlayingRef.current ? performance.now() * 0.0003 : 0);
            const freqIndex = Math.floor((i / numPoints) * (bufferLength / 2));
            const val = isPlayingRef.current && analyser ? (dataArray[freqIndex] || 0) : 0;
            const r = baseRadius + (val / 255) * 60;
            const x = centerPointX + Math.cos(angle) * r;
            const y = centerPointY + Math.sin(angle) * r;
            if (i === 0) ctx2d.moveTo(x, y);
            else ctx2d.lineTo(x, y);
          }
          ctx2d.closePath();
          ctx2d.strokeStyle = isDepthRef.current ? 'rgba(216, 22, 63, 0.25)' : 'rgba(24, 24, 27, 0.2)';
          ctx2d.lineWidth = 3;
          ctx2d.stroke();
          ctx2d.restore();

          if (isPlayingRef.current) {
            ctx2d.save();
            ctx2d.globalCompositeOperation = 'screen';
            const nebGlow = ctx2d.createRadialGradient(centerPointX, centerPointY, 0, centerPointX, centerPointY, baseRadius * 1.5);
            nebGlow.addColorStop(0, isDepthRef.current ? 'rgba(211, 15, 49, 0.12)' : 'rgba(211, 15, 49, 0.06)');
            nebGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.03)');
            nebGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx2d.fillStyle = nebGlow;
            ctx2d.beginPath();
            ctx2d.arc(centerPointX, centerPointY, baseRadius * 1.5, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.restore();
          }

          // Particles
          if (isPlayingRef.current && bassSmooth > 35 && fallbackParticles.length < 50 && Math.random() < 0.25) {
            fallbackParticles.push({
              x: centerPointX,
              y: centerPointY,
              vx: (Math.random() - 0.5) * (2 + bassSmooth * 0.04),
              vy: (Math.random() - 0.5) * (2 + bassSmooth * 0.04),
              life: 1.0,
              decay: 0.015 + Math.random() * 0.02,
              color: isDepthRef.current ? 'rgba(216, 22, 63,' : 'rgba(6, 182, 212,'
            });
          }
          ctx2d.save();
          fallbackParticles = fallbackParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) return false;
            ctx2d.fillStyle = `${p.color} ${p.life * 0.35})`;
            ctx2d.beginPath();
            ctx2d.arc(p.x, p.y, 1.5 + p.life * 3, 0, Math.PI * 2);
            ctx2d.fill();
            return true;
          });
          ctx2d.restore();

        } else if (currentMode === 'grid') {
          // --- RETRO 3D GRID ---
          const horizon = height * 0.55;
          const gridDepth = height - horizon;
          const lineCount = 14;
          const time = performance.now() * 0.001;
          const speed = isPlayingRef.current ? 1.0 + bassSmooth * 0.012 : 0.15;
          const offset = (time * speed * 25) % (gridDepth / lineCount);

          ctx2d.save();
          ctx2d.strokeStyle = isDepthRef.current ? 'rgba(216, 22, 63, 0.12)' : 'rgba(24, 24, 27, 0.1)';
          ctx2d.lineWidth = 1.5;

          // Draw horizontal lines
          for (let i = 0; i < lineCount; i++) {
            const py = horizon + Math.pow(i / lineCount, 1.8) * gridDepth + offset;
            if (py > height) continue;
            
            ctx2d.beginPath();
            for (let x = 0; x <= width; x += 10) {
              const xNormalized = x / width;
              const wave = Math.sin(xNormalized * Math.PI * 6 + time * 5) * (midSmooth * 0.06) * Math.pow(i / lineCount, 2);
              if (x === 0) ctx2d.moveTo(x, py + wave);
              else ctx2d.lineTo(x, py + wave);
            }
            ctx2d.stroke();
          }

          // Draw vertical perspective lines
          const vLineCount = 18;
          for (let i = 0; i <= vLineCount; i++) {
            const xStart = (i / vLineCount) * width;
            const xEnd = width / 2 + (xStart - width / 2) * 4.5;
            ctx2d.beginPath();
            ctx2d.moveTo(xStart, horizon);
            ctx2d.lineTo(xEnd, height);
            ctx2d.stroke();
          }
          ctx2d.restore();
        }

        rafRef.current = requestAnimationFrame(renderFallback);
      };

      rafRef.current = requestAnimationFrame(renderFallback);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(rafRef.current);
        clearTimeout(rafRef.current);
        observer.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyser]);

  // ── Sync isPlaying / mouse / isDepth / mode changes to OffscreenCanvas worker ─
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
      mode,
    });
  }, [isPlaying, isDepth, mouseX, mouseY, mode]);

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
