/**
 * visualizer.worker.js
 *
 * Runs the audio visualizer canvas render loop entirely off the main thread
 * using OffscreenCanvas with phosphor persistence decay, logarithmic audio smoothing,
 * and high-energy drum & bass responsiveness.
 *
 * Protocol:
 *   Main thread → Worker: { type: 'init', canvas: OffscreenCanvas, width, height, isDepth, mode }
 *   Main thread → Worker: { type: 'frame', frequencyData: Uint8Array, isPlaying, mouseX, mouseY, isDepth, mode }
 *   Main thread → Worker: { type: 'resize', width, height }
 *   Main thread → Worker: { type: 'stop' }
 */

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
  mode: 'ambient',
};

// Smoothing accumulators (Fast attack for punchy drums)
let bassSmooth = 0;
let midSmooth = 0;
let highSmooth = 0;

// Particles array for Circular mode (persists in worker)
let particles = [];

function render() {
  if (!ctx || !running) return;

  const { frequencyData, isPlaying, mouseX, mouseY, isDepth, width, height, mode } = currentState;

  // Use phosphor persistence decay instead of full clearRect for analog warmth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fillRect(0, 0, width, height);

  let bass = 0, mid = 0, high = 0;
  const bufferLength = frequencyData ? frequencyData.length : 64;

  if (frequencyData && isPlaying) {
    const bassEnd = Math.min(12, bufferLength);
    let bassCount = 0;
    for (let i = 0; i < bassEnd; i++) { bass += frequencyData[i] || 0; bassCount++; }
    if (bassCount > 0) bass /= bassCount;

    const midStart = Math.min(13, bufferLength);
    const midEnd = Math.min(64, bufferLength);
    let midCount = 0;
    for (let i = midStart; i < midEnd; i++) { mid += frequencyData[i] || 0; midCount++; }
    if (midCount > 0) mid /= midCount;

    const highStart = Math.min(65, bufferLength);
    const highEnd = Math.min(128, bufferLength);
    let highCount = 0;
    for (let i = highStart; i < highEnd; i++) { high += frequencyData[i] || 0; highCount++; }
    if (highCount > 0) high /= highCount;
  } else if (isPlaying) {
    const t = performance.now() * 0.003;
    bass = 45 + Math.sin(t * 2) * 20;
    mid = 30 + Math.cos(t * 1.3) * 10;
    high = 20 + Math.sin(t * 2.1) * 8;
  }

  // Fast exponential smoothing (0.35 attack for immediate drum punch)
  bassSmooth += (bass - bassSmooth) * 0.35;
  midSmooth  += (mid  - midSmooth)  * 0.25;
  highSmooth += (high - highSmooth) * 0.25;

  if (!isFinite(bassSmooth)) bassSmooth = 0;
  if (!isFinite(midSmooth))  midSmooth  = 0;
  if (!isFinite(highSmooth)) highSmooth = 0;

  const mX = isFinite(mouseX) ? mouseX : width / 2;
  const mY = isFinite(mouseY) ? mouseY : height / 2;

  if (mode === 'ambient') {
    // ── REACTIVE GLOWS (AMBIENT MODE) ──────────────────────────────────────
    if (isPlaying) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      let outerRadius = 80 + highSmooth * 2.0;
      if (!isFinite(outerRadius) || outerRadius <= 0) outerRadius = 80;
      const outerGlow = ctx.createRadialGradient(mX, mY, 0, mX, mY, outerRadius);
      outerGlow.addColorStop(0, isDepth ? 'rgba(216, 22, 63, 0.08)' : 'rgba(216, 22, 63, 0.04)');
      outerGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(mX, mY, outerRadius, 0, Math.PI * 2);
      ctx.fill();

      let innerRadius = 35 + Math.pow(bassSmooth / 255, 1.1) * 220;
      if (!isFinite(innerRadius) || innerRadius <= 0) innerRadius = 35;
      const innerGlow = ctx.createRadialGradient(mX, mY, 0, mX, mY, innerRadius);
      innerGlow.addColorStop(0, isDepth ? 'rgba(216, 22, 63, 0.35)' : 'rgba(216, 22, 63, 0.18)');
      innerGlow.addColorStop(0.4, 'rgba(216, 22, 63, 0.08)');
      innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(mX, mY, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ── SPECTRUM BARS (AMBIENT MODE) ───────────────────────────────────────
    const barCount = 48;
    const barWidth = width / barCount;
    const themeColor = isDepth ? 'rgba(216, 22, 63,' : 'rgba(24, 24, 27,';
    const maxBarHeight = height * 0.28;

    ctx.save();
    ctx.globalAlpha = 0.12;

    const grad = ctx.createLinearGradient(0, height, 0, height - maxBarHeight);
    grad.addColorStop(0, `${themeColor} 0.95)`);
    grad.addColorStop(0.5, `${themeColor} 0.45)`);
    grad.addColorStop(1, `${themeColor} 0.0)`);
    ctx.fillStyle = grad;

    for (let i = 0; i < barCount; i++) {
      const sampleIdx = Math.max(
        0,
        Math.min(bufferLength - 1, Math.floor(Math.pow(i / barCount, 1.6) * Math.max(1, bufferLength - 8)))
      );
      const rawVal = isPlaying && frequencyData ? (frequencyData[sampleIdx] || 0) : 0;
      let barHeight = Math.pow(rawVal / 255, 1.15) * maxBarHeight;
      barHeight = isPlaying
        ? Math.max(4, barHeight + Math.sin(i * 0.15 + performance.now() * 0.005) * 2)
        : 4;

      ctx.fillRect(i * barWidth + 2, height - barHeight, barWidth - 4, barHeight);
    }
    ctx.restore();

  } else if (mode === 'circular') {
    // ── CIRCULAR NEBULA MODE ───────────────────────────────────────────────
    const centerPointX = width / 2;
    const centerPointY = height / 2;
    const baseRadius = Math.min(width, height) * 0.18 + Math.pow(bassSmooth / 255, 1.15) * 140;
    const numPoints = 120;

    // Draw central pulsing ring
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + (isPlaying ? performance.now() * 0.0003 : 0);
      const freqIndex = Math.floor((i / numPoints) * (bufferLength / 2));
      const val = isPlaying && frequencyData ? (frequencyData[freqIndex] || 0) : 0;
      const r = baseRadius + Math.pow(val / 255, 1.2) * 80;
      const x = centerPointX + Math.cos(angle) * r;
      const y = centerPointY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = isDepth ? 'rgba(216, 22, 63, 0.45)' : 'rgba(24, 24, 27, 0.25)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Pulse ambient center glow
    if (isPlaying) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const nebGlow = ctx.createRadialGradient(centerPointX, centerPointY, 0, centerPointX, centerPointY, baseRadius * 1.6);
      nebGlow.addColorStop(0, isDepth ? 'rgba(211, 15, 49, 0.22)' : 'rgba(211, 15, 49, 0.10)');
      nebGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.06)');
      nebGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebGlow;
      ctx.beginPath();
      ctx.arc(centerPointX, centerPointY, baseRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particle emission
    if (isPlaying && bassSmooth > 25 && particles.length < 75 && Math.random() < 0.45) {
      particles.push({
        x: centerPointX,
        y: centerPointY,
        vx: (Math.random() - 0.5) * (3 + bassSmooth * 0.08),
        vy: (Math.random() - 0.5) * (3 + bassSmooth * 0.08),
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        color: isDepth ? 'rgba(216, 22, 63,' : 'rgba(6, 182, 212,'
      });
    }

    // Render particles
    ctx.save();
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) return false;
      ctx.fillStyle = `${p.color} ${p.life * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 + p.life * 3.5, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.restore();

  } else if (mode === 'grid') {
    // ── RETRO 3D PERSPECTIVE GRID ──────────────────────────────────────────
    const horizon = height * 0.55;
    const gridDepth = height - horizon;
    const lineCount = 14;
    const time = performance.now() * 0.001;
    const speed = isPlaying ? 1.0 + Math.pow(bassSmooth / 255, 1.2) * 4.0 : 0.15;
    const offset = (time * speed * 25) % (gridDepth / lineCount);

    ctx.save();
    ctx.strokeStyle = isDepth ? 'rgba(216, 22, 63, 0.55)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.85;

    // Draw horizontal grid lines
    for (let i = 0; i < lineCount; i++) {
      const py = horizon + Math.pow(i / lineCount, 1.8) * gridDepth + offset;
      if (py > height) continue;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const xNormalized = x / width;
        // Ripple using mid and bass frequencies
        const wave = Math.sin(xNormalized * Math.PI * 6 + time * 5) * (midSmooth * 0.1 + bassSmooth * 0.08) * Math.pow(i / lineCount, 2);
        if (x === 0) ctx.moveTo(x, py + wave);
        else ctx.lineTo(x, py + wave);
      }
      ctx.stroke();
    }

    // Draw perspective vanishing lines
    const vLineCount = 18;
    for (let i = 0; i <= vLineCount; i++) {
      const xStart = (i / vLineCount) * width;
      const xEnd = width / 2 + (xStart - width / 2) * 4.5;
      ctx.beginPath();
      ctx.moveTo(xStart, horizon);
      ctx.lineTo(xEnd, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (running) {
    requestAnimationFrame(render);
  }
}

// Worker message handler
self.onmessage = function (e) {
  const { type } = e.data;

  if (type === 'init') {
    canvas = e.data.canvas;
    ctx = canvas.getContext('2d');
    currentState.width = e.data.width;
    currentState.height = e.data.height;
    currentState.isDepth = e.data.isDepth;
    currentState.mode = e.data.mode || 'ambient';
    running = true;
    requestAnimationFrame(render);
  } else if (type === 'frame') {
    currentState.frequencyData = e.data.frequencyData;
    currentState.isPlaying = e.data.isPlaying;
    currentState.mouseX = e.data.mouseX;
    currentState.mouseY = e.data.mouseY;
    currentState.isDepth = e.data.isDepth;
    currentState.mode = e.data.mode || 'ambient';
  } else if (type === 'resize') {
    currentState.width = e.data.width;
    currentState.height = e.data.height;
    if (canvas) {
      canvas.width = e.data.width;
      canvas.height = e.data.height;
    }
  } else if (type === 'stop') {
    running = false;
  }
};
