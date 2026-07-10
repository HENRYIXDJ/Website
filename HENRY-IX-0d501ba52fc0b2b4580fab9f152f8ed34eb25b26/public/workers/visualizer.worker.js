/**
 * visualizer.worker.js
 *
 * Runs the audio visualizer canvas render loop entirely off the main thread
 * using OffscreenCanvas.
 *
 * Protocol:
 *   Main thread → Worker: { type: 'init', canvas: OffscreenCanvas, width, height, isDepth }
 *   Main thread → Worker: { type: 'frame', frequencyData: Uint8Array, isPlaying, mouseX, mouseY, isDepth }
 *   Main thread → Worker: { type: 'resize', width, height }
 *   Main thread → Worker: { type: 'stop' }
 *
 * Design: The worker renders ONLY when it receives a 'frame' message from the
 * main thread (which is paced by the main thread's rAF). This eliminates the
 * double-rAF drift that occurred when the worker had its own independent loop
 * and could draw stale frames before new data arrived.
 */

/* eslint-disable no-restricted-globals */
let canvas = null;
let ctx = null;
let running = false;
let currentState = {
  frequencyData: null,
  isPlaying: false,
  mouseX: 0,
  mouseY: 0,
  isDepth: true,
  width: 1280,
  height: 720,
};

// Smoothing accumulators (persist across frames — must live in worker scope)
let bassSmooth = 0;
let midSmooth = 0;
let highSmooth = 0;

function render() {
  if (!ctx || !running) return;

  const { frequencyData, isPlaying, mouseX, mouseY, isDepth, width, height } = currentState;

  ctx.clearRect(0, 0, width, height);

  let bass = 0, mid = 0, high = 0;
  const bufferLength = frequencyData ? frequencyData.length : 64;

  if (frequencyData && isPlaying) {
    const bassEnd = Math.min(15, bufferLength);
    let bassCount = 0;
    for (let i = 0; i < bassEnd; i++) { bass += frequencyData[i] || 0; bassCount++; }
    if (bassCount > 0) bass /= bassCount;

    const midStart = Math.min(16, bufferLength);
    const midEnd = Math.min(80, bufferLength);
    let midCount = 0;
    for (let i = midStart; i < midEnd; i++) { mid += frequencyData[i] || 0; midCount++; }
    if (midCount > 0) mid /= midCount;

    const highStart = Math.min(81, bufferLength);
    const highEnd = Math.min(150, bufferLength);
    let highCount = 0;
    for (let i = highStart; i < highEnd; i++) { high += frequencyData[i] || 0; highCount++; }
    if (highCount > 0) high /= highCount;
  } else if (isPlaying) {
    // Fallback pulsing when analyser not yet available
    const t = performance.now() * 0.003;
    bass = 40 + Math.sin(t) * 15;
    mid = 30 + Math.cos(t * 1.3) * 10;
    high = 20 + Math.sin(t * 2.1) * 8;
  }

  // Exponential smoothing — accumulators persist in worker scope
  bassSmooth += (bass - bassSmooth) * 0.15;
  midSmooth  += (mid  - midSmooth)  * 0.15;
  highSmooth += (high - highSmooth) * 0.15;

  if (!isFinite(bassSmooth)) bassSmooth = 0;
  if (!isFinite(midSmooth))  midSmooth  = 0;
  if (!isFinite(highSmooth)) highSmooth = 0;

  const mX = isFinite(mouseX) ? mouseX : width / 2;
  const mY = isFinite(mouseY) ? mouseY : height / 2;

  // ── REACTIVE GLOWS ──────────────────────────────────────────────────────
  if (isPlaying) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    let outerRadius = 80 + highSmooth * 1.5;
    if (!isFinite(outerRadius) || outerRadius <= 0) outerRadius = 80;
    const outerGlow = ctx.createRadialGradient(mX, mY, 0, mX, mY, outerRadius);
    outerGlow.addColorStop(0, isDepth ? 'rgba(216, 22, 63, 0.06)' : 'rgba(216, 22, 63, 0.03)');
    outerGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.02)');
    outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(mX, mY, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    let innerRadius = 30 + bassSmooth * 2.2;
    if (!isFinite(innerRadius) || innerRadius <= 0) innerRadius = 30;
    const innerGlow = ctx.createRadialGradient(mX, mY, 0, mX, mY, innerRadius);
    innerGlow.addColorStop(0, isDepth ? 'rgba(216, 22, 63, 0.22)' : 'rgba(216, 22, 63, 0.12)');
    innerGlow.addColorStop(0.4, 'rgba(216, 22, 63, 0.04)');
    innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(mX, mY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── SPECTRUM BARS ───────────────────────────────────────────────────────
  const barCount = 48;
  const barWidth = width / barCount;
  const themeColor = isDepth ? 'rgba(216, 22, 63,' : 'rgba(24, 24, 27,';

  ctx.save();
  ctx.globalAlpha = 0.07;

  for (let i = 0; i < barCount; i++) {
    const sampleIdx = Math.max(
      0,
      Math.min(bufferLength - 1, Math.floor(Math.pow(i / barCount, 1.8) * Math.max(1, bufferLength - 10)))
    );
    const rawVal = isPlaying && frequencyData ? (frequencyData[sampleIdx] || 0) : 0;
    let barHeight = (rawVal / 255) * (height * 0.22);
    barHeight = isPlaying
      ? Math.max(4, barHeight + Math.sin(i * 0.15 + performance.now() * 0.005) * 2)
      : 4;

    const grad = ctx.createLinearGradient(i * barWidth, height, i * barWidth, height - barHeight);
    grad.addColorStop(0, `${themeColor} 0.8)`);
    grad.addColorStop(0.5, `${themeColor} 0.3)`);
    grad.addColorStop(1, `${themeColor} 0.0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(i * barWidth + 2, height - barHeight, barWidth - 4, barHeight);
  }

  ctx.restore();
  // NOTE: No requestAnimationFrame here. The main thread's rAF drives the
  // cadence by sending 'frame' messages. This prevents double-rAF drift where
  // the worker could draw a stale frame before new data arrived.
}

self.onmessage = function (e) {
  const { type } = e.data;

  switch (type) {
    case 'init': {
      canvas = e.data.canvas; // OffscreenCanvas transferred from main thread
      ctx = canvas.getContext('2d');
      canvas.width  = e.data.width  || 1280;
      canvas.height = e.data.height || 720;
      currentState.width   = canvas.width;
      currentState.height  = canvas.height;
      currentState.isDepth = e.data.isDepth ?? true;
      currentState.mouseX  = canvas.width  / 2;
      currentState.mouseY  = canvas.height / 2;
      running = true;
      // Draw one initial idle frame so the canvas isn't blank
      render();
      break;
    }

    case 'frame': {
      // Receive frequency snapshot from main thread and render immediately.
      // Using the message cadence as the render trigger avoids a second rAF
      // running independently inside the worker.
      if (!running) break;
      if (e.data.frequencyData) currentState.frequencyData = e.data.frequencyData;
      currentState.isPlaying = e.data.isPlaying ?? false;
      if (isFinite(e.data.mouseX)) currentState.mouseX = e.data.mouseX;
      if (isFinite(e.data.mouseY)) currentState.mouseY = e.data.mouseY;
      if (e.data.isDepth !== undefined) currentState.isDepth = e.data.isDepth;
      render();
      break;
    }

    case 'resize': {
      if (canvas) {
        canvas.width  = e.data.width;
        canvas.height = e.data.height;
      }
      currentState.width  = e.data.width;
      currentState.height = e.data.height;
      render(); // Redraw immediately at new size
      break;
    }

    case 'stop': {
      running = false;
      break;
    }
  }
};
