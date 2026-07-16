/**
 * visualizer.worker.js
 *
 * Runs the audio visualizer canvas render loop entirely off the main thread
 * using OffscreenCanvas.
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

// Smoothing accumulators
let bassSmooth = 0;
let midSmooth = 0;
let highSmooth = 0;

// Particles array for Circular mode (persists in worker)
let particles = [];

function render() {
  if (!ctx || !running) return;

  const { frequencyData, isPlaying, mouseX, mouseY, isDepth, width, height, mode } = currentState;

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
    const t = performance.now() * 0.003;
    bass = 40 + Math.sin(t) * 15;
    mid = 30 + Math.cos(t * 1.3) * 10;
    high = 20 + Math.sin(t * 2.1) * 8;
  }

  // Exponential smoothing
  bassSmooth += (bass - bassSmooth) * 0.15;
  midSmooth  += (mid  - midSmooth)  * 0.15;
  highSmooth += (high - highSmooth) * 0.15;

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

    // ── SPECTRUM BARS (AMBIENT MODE) ───────────────────────────────────────
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

  } else if (mode === 'circular') {
    // ── CIRCULAR NEBULA MODE ───────────────────────────────────────────────
    const centerPointX = width / 2;
    const centerPointY = height / 2;
    const baseRadius = Math.min(width, height) * 0.18 + bassSmooth * 0.4;
    const numPoints = 120;

    // Draw central pulsing ring
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + (isPlaying ? performance.now() * 0.0003 : 0);
      const freqIndex = Math.floor((i / numPoints) * (bufferLength / 2));
      const val = isPlaying && frequencyData ? (frequencyData[freqIndex] || 0) : 0;
      const r = baseRadius + (val / 255) * 60;
      const x = centerPointX + Math.cos(angle) * r;
      const y = centerPointY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = isDepth ? 'rgba(216, 22, 63, 0.25)' : 'rgba(24, 24, 27, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Pulse ambient center glow
    if (isPlaying) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const nebGlow = ctx.createRadialGradient(centerPointX, centerPointY, 0, centerPointX, centerPointY, baseRadius * 1.5);
      nebGlow.addColorStop(0, isDepth ? 'rgba(211, 15, 49, 0.12)' : 'rgba(211, 15, 49, 0.06)');
      nebGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.03)');
      nebGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebGlow;
      ctx.beginPath();
      ctx.arc(centerPointX, centerPointY, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particle emission
    if (isPlaying && bassSmooth > 35 && particles.length < 50 && Math.random() < 0.25) {
      particles.push({
        x: centerPointX,
        y: centerPointY,
        vx: (Math.random() - 0.5) * (2 + bassSmooth * 0.04),
        vy: (Math.random() - 0.5) * (2 + bassSmooth * 0.04),
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
      ctx.fillStyle = `${p.color} ${p.life * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 + p.life * 3, 0, Math.PI * 2);
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
    const speed = isPlaying ? 1.0 + bassSmooth * 0.012 : 0.15;
    const offset = (time * speed * 25) % (gridDepth / lineCount);

    ctx.save();
    ctx.strokeStyle = isDepth ? 'rgba(216, 22, 63, 0.12)' : 'rgba(24, 24, 27, 0.1)';
    ctx.lineWidth = 1.5;

    // Draw horizontal grid lines
    for (let i = 0; i < lineCount; i++) {
      const py = horizon + Math.pow(i / lineCount, 1.8) * gridDepth + offset;
      if (py > height) continue;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const xNormalized = x / width;
        // Ripple using mid frequencies and sine wave
        const wave = Math.sin(xNormalized * Math.PI * 6 + time * 5) * (midSmooth * 0.06) * Math.pow(i / lineCount, 2);
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
}

self.onmessage = function (e) {
  const { type } = e.data;

  switch (type) {
    case 'init': {
      canvas = e.data.canvas;
      ctx = canvas.getContext('2d');
      canvas.width  = e.data.width  || 1280;
      canvas.height = e.data.height || 720;
      currentState.width   = canvas.width;
      currentState.height  = canvas.height;
      currentState.isDepth = e.data.isDepth ?? true;
      currentState.mode    = e.data.mode || 'ambient';
      currentState.mouseX  = canvas.width  / 2;
      currentState.mouseY  = canvas.height / 2;
      running = true;
      render();
      break;
    }

    case 'frame': {
      if (!running) break;
      if (e.data.frequencyData) currentState.frequencyData = e.data.frequencyData;
      currentState.isPlaying = e.data.isPlaying ?? false;
      if (isFinite(e.data.mouseX)) currentState.mouseX = e.data.mouseX;
      if (isFinite(e.data.mouseY)) currentState.mouseY = e.data.mouseY;
      if (e.data.isDepth !== undefined) currentState.isDepth = e.data.isDepth;
      if (e.data.mode) currentState.mode = e.data.mode;
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
      render();
      break;
    }

    case 'stop': {
      running = false;
      break;
    }
  }
};
