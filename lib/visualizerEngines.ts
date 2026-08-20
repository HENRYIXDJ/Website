/**
 * lib/visualizerEngines.ts
 *
 * Handcrafted Procedural Audio Visualizer Engines & Post-Processing Suite
 * 100% Deterministic Real-Time Mathematical DSP & Graphics — ZERO AI Generation
 *
 * Highly Responsive to Drums & Bass (Sub-Bass Transients, Kick Punch, Snare Snaps, Dynamic Expansion)
 *
 * Engines:
 * 1. VECTOR_OSCILLOSCOPE   - CRT Vector Beam, Velocity Luminance & Lissajous Goniometer
 * 2. CYBER_GEOMETRY        - 3D Audio-Displaced Wireframe Icosahedron & Radial Nodes
 * 3. WARP_TUNNEL           - Polygonal Z-Extruded Hyperspace Tunnel with Kick Surges
 * 4. SPECTROGRAM_TERRAIN   - 3D Rolling Waterfall Frequency Topography
 * 5. PARTICLE_VORTEX       - Gravitational Attractor Particle Physics System
 * 6. ASCII_MATRIX          - Bayer Dithered Holographic ASCII Glyph Rasterizer
 */

export type VisualizerEngineMode =
  | 'VECTOR_OSCILLOSCOPE'
  | 'CYBER_GEOMETRY'
  | 'WARP_TUNNEL'
  | 'SPECTROGRAM_TERRAIN'
  | 'PARTICLE_VORTEX'
  | 'ASCII_MATRIX';

export type VisualizerColorTheme = 'SYMMETRIC' | 'RED' | 'CYAN' | 'AMBER' | 'ACID';
export type VisualizerSymmetry = 'NONE' | '4_AXIS' | '8_AXIS';
export type VisualizerAudioSource = 'MASTER' | 'DECK_1' | 'DECK_2' | 'DECK_3' | 'DECK_4' | 'MIC';

export interface VisualizerRenderState {
  w: number;
  h: number;
  time: number;
  dt: number;
  bpm: number;
  colorTheme: VisualizerColorTheme;
  mainColor: string;
  glowColor: string;
  symmetry: VisualizerSymmetry;
  showScanlines: boolean;
  showBloom: boolean;
  isBeat: boolean;
  isKick: boolean;
  isSnare: boolean;
  flux: number;
  kickFlux: number;
  snareFlux: number;
  logBands: {
    subBass: number;
    bass: number;
    lowMid: number;
    mid: number;
    highMid: number;
    presence: number;
    brilliance: number;
    kickPunch: number;
    snareSnap: number;
    rawBands: number[];
    energy: number;
  };
  timeData: Uint8Array;
  freqData: Uint8Array;
}

// ── Shared Persistent State Across Frames ───────────────────────────
interface IcosahedronVertex {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
}

class VisualizerStateStore {
  // Engine 2: 3D Icosahedron
  public icosaVertices: IcosahedronVertex[] = [];
  public icosaEdges: [number, number][] = [];
  public icosaRotX = 0;
  public icosaRotY = 0;
  public icosaRotZ = 0;

  // Engine 3: Warp Tunnel
  public tunnelZ = 0;

  // Engine 4: 3D Spectrogram History Terrain (48 rows x 32 cols)
  public terrainHistory: number[][] = [];
  public terrainCols = 32;
  public terrainRows = 40;

  // Engine 5: Particle Vortex (650 particles)
  public particles: Particle[] = [];
  public maxParticles = 650;

  // Engine 6: ASCII Matrix
  public asciiAngle = 0;
  public asciiGlitchTimer = 0;

  // Camera Orbit Inertia
  public cameraAngle = 0;

  constructor() {
    this.initIcosahedron();
    this.initTerrain();
    this.initParticles();
  }

  private initIcosahedron() {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ~1.618
    const rawVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ];

    this.icosaVertices = rawVerts.map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      return { x: nx, y: ny, z: nz, baseX: nx, baseY: ny, baseZ: nz };
    });

    this.icosaEdges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
      [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
      [4, 9], [9, 8], [8, 6], [6, 2], [2, 4],
      [1, 9], [5, 4], [11, 2], [10, 6], [7, 8],
      [0, 3], [1, 8], [5, 9], [11, 4], [10, 2]
    ];
  }

  private initTerrain() {
    this.terrainHistory = [];
    for (let r = 0; r < this.terrainRows; r++) {
      this.terrainHistory.push(new Array(this.terrainCols).fill(0));
    }
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  public createParticle(): Particle {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 320;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      z: (Math.random() - 0.5) * 200,
      vx: -Math.sin(angle) * (1.2 + Math.random() * 2.5),
      vy: Math.cos(angle) * (1.2 + Math.random() * 2.5),
      vz: (Math.random() - 0.5) * 2,
      life: 0,
      maxLife: 120 + Math.random() * 220,
      color: '#D8163F',
    };
  }
}

const stateStore = new VisualizerStateStore();

// ── 1. VECTOR PHOSPHOR OSCILLOSCOPE ENGINE ──────────────────────────
export function renderVectorOscilloscope(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState
) {
  const { w, h, mainColor, glowColor, logBands, isBeat, isKick, isSnare, timeData, time } = state;
  const bufferLength = timeData.length;
  const cx = w / 2;
  const cy = h / 2;

  // Background phosphor decay trails
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(0, 0, w, h);

  // Dynamic Bass & Kick Multiplier
  const bassScale = 1.0 + logBands.subBass * 1.25 + logBands.kickPunch * 0.85 + (isKick ? 0.45 : 0);

  // 1A. Central Lissajous Phase Goniometer (Left X vs Right Y simulation)
  const goniometerRadius = Math.min(w, h) * 0.28 * bassScale;
  ctx.save();
  ctx.strokeStyle = isKick ? '#FFFFFF' : mainColor;
  ctx.lineWidth = isKick ? 4.5 : (isBeat ? 3.0 : 1.8);
  ctx.shadowColor = isKick ? '#FFFFFF' : glowColor;
  ctx.shadowBlur = isKick ? 35 : (isBeat ? 22 : 10);

  ctx.beginPath();
  const phaseStep = Math.floor(bufferLength / 4);
  for (let i = 0; i < bufferLength; i++) {
    const t1 = timeData[i] / 128.0 - 1.0;
    const t2 = timeData[(i + phaseStep) % bufferLength] / 128.0 - 1.0;

    // Smooth circular rotation over time
    const rot = time * 0.0012 * (state.bpm / 120);
    const rx = t1 * Math.cos(rot) - t2 * Math.sin(rot);
    const ry = t1 * Math.sin(rot) + t2 * Math.cos(rot);

    const px = cx + rx * goniometerRadius;
    const py = cy + ry * goniometerRadius;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 1B. Dual Stereo Horizontal Time Ribbons (Violently responsive to Bass)
  ctx.save();
  ctx.lineWidth = isSnare ? 3.0 : 2.0;
  ctx.strokeStyle = isSnare ? '#FFFFFF' : '#E4E4E7';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = isKick || isSnare ? 18 : 8;

  const sliceWidth = w / bufferLength;
  const waveHeight = h * 0.32 * bassScale;

  // Top Ribbon (Left Channel)
  ctx.beginPath();
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = timeData[i] / 128.0;
    const y = cy * 0.35 + (v - 1.0) * waveHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();

  // Bottom Ribbon (Right Channel)
  ctx.beginPath();
  ctx.strokeStyle = mainColor;
  x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = timeData[(i + phaseStep) % bufferLength] / 128.0;
    const y = cy * 1.65 + (v - 1.0) * waveHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();
  ctx.restore();

  // Center Reticle & Bass Shockwave Pulse
  ctx.save();
  ctx.strokeStyle = mainColor;
  ctx.globalAlpha = isKick ? 0.7 : 0.25;
  ctx.lineWidth = isKick ? 2.5 : 1;
  ctx.beginPath();
  ctx.arc(cx, cy, goniometerRadius * 0.5, 0, Math.PI * 2);
  ctx.arc(cx, cy, goniometerRadius, 0, Math.PI * 2);
  ctx.moveTo(cx - goniometerRadius * 1.3, cy);
  ctx.lineTo(cx + goniometerRadius * 1.3, cy);
  ctx.moveTo(cx, cy - goniometerRadius * 1.3);
  ctx.lineTo(cx, cy + goniometerRadius * 1.3);
  ctx.stroke();
  ctx.restore();
}

// ── 2. 3D WIREFRAME CYBER GEOMETRY ENGINE ──────────────────────────
export function renderCyberGeometry(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState
) {
  const { w, h, mainColor, glowColor, logBands, isBeat, isKick, isSnare, flux } = state;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(0, 0, w, h);

  // Rotation angles with kick drum recoil jerk
  stateStore.icosaRotX += 0.008 + logBands.bass * 0.035 + (isKick ? 0.05 : 0);
  stateStore.icosaRotY += 0.012 + logBands.mid * 0.03 + (isSnare ? 0.04 : 0);
  stateStore.icosaRotZ += 0.004 + flux * 0.04;

  const baseRadius = Math.min(w, h) * 0.23;
  const fov = 460;

  // Compute 3D rotation matrix & displaced vertex coordinates
  const projectedVerts: { x: number; y: number; z: number; scale: number }[] = [];

  const cosX = Math.cos(stateStore.icosaRotX), sinX = Math.sin(stateStore.icosaRotX);
  const cosY = Math.cos(stateStore.icosaRotY), sinY = Math.sin(stateStore.icosaRotY);
  const cosZ = Math.cos(stateStore.icosaRotZ), sinZ = Math.sin(stateStore.icosaRotZ);

  stateStore.icosaVertices.forEach((v, idx) => {
    const bandVal = logBands.rawBands[idx % 7] || 0;
    const radialPulse = 1.0 + bandVal * 1.4 + logBands.kickPunch * 1.0 + (isKick ? 0.65 : 0);

    const vx = v.baseX * baseRadius * radialPulse;
    const vy = v.baseY * baseRadius * radialPulse;
    const vz = v.baseZ * baseRadius * radialPulse;

    // Y rotation
    let x1 = vx * cosY + vz * sinY;
    let y1 = vy;
    let z1 = -vx * sinY + vz * cosY;

    // X rotation
    let x2 = x1;
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;

    // Z rotation
    let x3 = x2 * cosZ - y2 * sinZ;
    let y3 = x2 * sinZ + y2 * cosZ;
    let z3 = z2 + 500; // Camera distance

    // Perspective projection
    const scale = fov / z3;
    const px = cx + x3 * scale;
    const py = cy + y3 * scale;

    projectedVerts.push({ x: px, y: py, z: z3, scale });
  });

  // Render Wireframe Edges
  ctx.save();
  ctx.strokeStyle = isKick ? '#FFFFFF' : mainColor;
  ctx.lineWidth = isKick ? 4.0 : (isBeat ? 2.8 : 1.6);
  ctx.shadowColor = isKick ? '#FFFFFF' : glowColor;
  ctx.shadowBlur = isKick ? 30 : (isBeat ? 18 : 8);

  stateStore.icosaEdges.forEach(([i1, i2]) => {
    const p1 = projectedVerts[i1];
    const p2 = projectedVerts[i2];
    if (p1 && p2) {
      const avgZ = (p1.z + p2.z) / 2;
      const alpha = Math.max(0.15, Math.min(1.0, (800 - avgZ) / 500));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });

  // Render Vertex Glowing Nodes
  projectedVerts.forEach((p, idx) => {
    const bandVal = logBands.rawBands[idx % 7] || 0;
    const nodeRadius = Math.max(2, (3 + bandVal * 9 + (isKick ? 5 : 0)) * p.scale);
    ctx.globalAlpha = Math.min(1, (800 - p.z) / 400);

    ctx.fillStyle = isKick || bandVal > 0.55 ? '#FFFFFF' : mainColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ── 3. HYPERSPACE WARP TUNNEL ENGINE ─────────────────────────────────
export function renderWarpTunnel(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState
) {
  const { w, h, mainColor, glowColor, logBands, isKick, isSnare, freqData } = state;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, w, h);

  // Speed surges aggressively on Kick Drum hits
  const speed = 0.008 + Math.pow(logBands.subBass, 1.3) * 0.045 + (isKick ? 0.065 : 0);
  stateStore.tunnelZ = (stateStore.tunnelZ + speed) % 1;

  const rings = 22;
  const sides = 8;
  const maxRadius = Math.min(w, h) * 0.88;

  const ringPoints: { x: number; y: number }[][] = [];

  ctx.save();
  ctx.shadowColor = glowColor;

  for (let i = 0; i < rings; i++) {
    const progress = (i / rings + stateStore.tunnelZ) % 1;
    const zDepth = Math.pow(progress, 2.2);
    const r = zDepth * maxRadius;

    const freqIdx = Math.floor(progress * (freqData.length / 2));
    const bandEnergy = (freqData[freqIdx] || 0) / 255;

    const currentPoints: { x: number; y: number }[] = [];
    const rot = stateStore.tunnelZ * 2.5 + progress * Math.PI;

    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + rot;
      const vertexPerturbation = 1.0 + bandEnergy * 0.85 + logBands.kickPunch * 0.45;
      const px = cx + Math.cos(angle) * r * vertexPerturbation;
      const py = cy + Math.sin(angle) * r * vertexPerturbation;
      currentPoints.push({ x: px, y: py });
    }

    ringPoints.push(currentPoints);

    // Draw polygonal ring
    ctx.strokeStyle = isKick || isSnare || progress > 0.82 ? '#FFFFFF' : mainColor;
    ctx.lineWidth = Math.max(1, progress * 4.5 + bandEnergy * 4 + (isKick ? 3 : 0));
    ctx.globalAlpha = Math.min(1, Math.pow(progress, 1.3));
    ctx.shadowBlur = isKick ? 25 : (12 * bandEnergy);

    ctx.beginPath();
    currentPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // Draw longitudinal tunnel grid lines connecting rings
  ctx.globalAlpha = isKick ? 0.7 : 0.35;
  ctx.lineWidth = isKick ? 2 : 1;
  ctx.strokeStyle = isKick ? '#FFFFFF' : mainColor;

  for (let s = 0; s < sides; s++) {
    ctx.beginPath();
    for (let i = 0; i < rings; i++) {
      const p = ringPoints[i]?.[s];
      if (p) {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}

// ── 4. 3D RETRO SPECTROGRAM TERRAIN ENGINE ───────────────────────────
export function renderSpectrogramTerrain(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState
) {
  const { w, h, mainColor, glowColor, logBands, isKick, freqData } = state;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
  ctx.fillRect(0, 0, w, h);

  // Push new frequency slice to terrain history
  const cols = stateStore.terrainCols;
  const newRow: number[] = [];
  for (let c = 0; c < cols; c++) {
    const freqIdx = Math.floor(Math.pow(c / cols, 1.5) * (freqData.length / 2));
    const val = (freqData[freqIdx] || 0) / 255;
    newRow.push(val);
  }

  stateStore.terrainHistory.unshift(newRow);
  if (stateStore.terrainHistory.length > stateStore.terrainRows) {
    stateStore.terrainHistory.pop();
  }

  const rows = stateStore.terrainHistory.length;
  const cx = w / 2;
  const horizonY = h * 0.38;
  const terrainWidth = w * 1.3;
  const maxPeakHeight = h * 0.55 * (1 + logBands.subBass * 1.8 + (isKick ? 0.6 : 0));

  ctx.save();
  ctx.shadowColor = isKick ? '#FFFFFF' : glowColor;

  // Render rows from back (horizon) to front (foreground)
  for (let r = rows - 1; r >= 0; r--) {
    const rowProgress = r / rows; // 1 = back, 0 = front
    const z = 1 - rowProgress;    // 0 = back, 1 = front
    const py = horizonY + Math.pow(z, 1.4) * (h - horizonY);
    const rowWidth = terrainWidth * (0.2 + z * 0.8);
    const startX = cx - rowWidth / 2;
    const colStep = rowWidth / (cols - 1);

    const historyRow = stateStore.terrainHistory[r] || [];

    ctx.beginPath();
    ctx.strokeStyle = isKick || z > 0.85 ? '#FFFFFF' : mainColor;
    ctx.lineWidth = Math.max(1, z * 3.0);
    ctx.globalAlpha = Math.max(0.1, z);
    ctx.shadowBlur = isKick ? 20 : (z > 0.7 ? 12 : 0);

    for (let c = 0; c < cols; c++) {
      const amp = historyRow[c] || 0;
      const peakY = py - Math.pow(amp, 1.5) * maxPeakHeight * z;
      const px = startX + c * colStep;

      if (c === 0) ctx.moveTo(px, peakY);
      else ctx.lineTo(px, peakY);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// ── 5. GRAVITATIONAL ATTRACTOR PARTICLE VORTEX ENGINE ────────────────
export function renderParticleVortex(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState
) {
  const { w, h, mainColor, glowColor, logBands, isBeat, isKick, kickFlux } = state;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.fillRect(0, 0, w, h);

  const particles = stateStore.particles;
  // Explosive radial impulse pushing particles on kick drum hits
  const kickImpulse = isKick ? 24 + kickFlux * 35 : (isBeat ? 8 : 0);

  ctx.save();
  ctx.shadowColor = isKick ? '#FFFFFF' : glowColor;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.life++;

    if (p.life > p.maxLife) {
      particles[i] = stateStore.createParticle();
      continue;
    }

    const dist = Math.hypot(p.x, p.y);

    // Gravitational pull toward center
    const gravity = 0.9 / (Math.max(30, dist) * 0.05);
    p.vx -= (p.x / dist) * gravity;
    p.vy -= (p.y / dist) * gravity;

    // Vortex torque driven by high-mids
    const torque = 0.08 + logBands.highMid * 0.15;
    p.vx += -p.y * 0.001 * torque;
    p.vy += p.x * 0.001 * torque;

    // Kick explosive impulse outward
    if (kickImpulse > 0 && dist > 10) {
      p.vx += (p.x / dist) * kickImpulse * (0.6 + Math.random() * 0.6);
      p.vy += (p.y / dist) * kickImpulse * (0.6 + Math.random() * 0.6);
    }

    p.x += p.vx;
    p.y += p.vy;

    const screenX = cx + p.x;
    const screenY = cy + p.y;

    if (screenX < 0 || screenX > w || screenY < 0 || screenY > h) {
      particles[i] = stateStore.createParticle();
      continue;
    }

    const alpha = Math.min(1, Math.sin((p.life / p.maxLife) * Math.PI));
    const speed = Math.hypot(p.vx, p.vy);

    // Render particle light streak
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = isKick || speed > 5 ? '#FFFFFF' : mainColor;
    ctx.lineWidth = Math.max(1, Math.min(4, speed * 0.5));
    ctx.shadowBlur = isKick ? 20 : 6;

    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX - p.vx * 3.0, screenY - p.vy * 3.0);
    ctx.stroke();
  }

  // Central Black Hole / Event Horizon Ring (Massive bass expansion)
  const coreRadius = 25 + logBands.subBass * 75 + (isKick ? 30 : 0);
  ctx.beginPath();
  ctx.strokeStyle = isKick ? '#FFFFFF' : mainColor;
  ctx.lineWidth = isKick ? 5 : 2;
  ctx.globalAlpha = 0.9;
  ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// ── 6. ASCII DITHER HOLOGRAPHIC MATRIX ENGINE ───────────────────────
const ASCII_CHARS = [' ', '░', '▒', '▓', '█', '┼', '─', '│', '▲', '■', '✦', '◆'];

export function renderAsciiMatrix(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState
) {
  const { w, h, mainColor, glowColor, logBands, isKick, isSnare, freqData } = state;
  const bufferLength = freqData.length;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = mainColor;
  ctx.font = '12px var(--font-ocra), monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cell = 18;
  const cols = Math.floor(w / cell);
  const rows = Math.floor(h / cell);

  stateStore.asciiAngle += 0.01 + logBands.bass * 0.05 + (isKick ? 0.03 : 0);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const freqIdx = Math.floor(((c + r) / (cols + rows)) * (bufferLength / 2)) % bufferLength;
      const val = (freqData[freqIdx] || 0) / 255;
      const distFromCenter = Math.hypot(c - cols / 2, r - rows / 2);
      const ripple = Math.sin(distFromCenter * 0.3 - stateStore.asciiAngle * 4) * 0.5 + 0.5;

      const combinedIntensity = Math.min(1, (val * 0.7 + ripple * 0.3) * (1 + logBands.subBass * 1.5 + (isKick ? 0.4 : 0)));
      let charIdx = Math.floor(combinedIntensity * (ASCII_CHARS.length - 1));

      // Transient glitch inversion on snare/kick attacks
      if ((isSnare || isKick) && Math.random() < 0.25) {
        charIdx = ASCII_CHARS.length - 1 - charIdx;
      }

      const char = ASCII_CHARS[charIdx];
      if (char && char !== ' ') {
        ctx.globalAlpha = Math.max(0.15, combinedIntensity);
        ctx.fillStyle = isKick || combinedIntensity > 0.75 ? '#FFFFFF' : mainColor;
        ctx.fillText(char, c * cell + cell / 2, r * cell + cell / 2);
      }
    }
  }

  // Central Rotating Cyber Emblem (Huge bass pulse)
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(stateStore.asciiAngle);
  ctx.strokeStyle = isKick ? '#FFFFFF' : mainColor;
  ctx.lineWidth = 2 + logBands.subBass * 6 + (isKick ? 4 : 0);
  ctx.shadowColor = isKick ? '#FFFFFF' : glowColor;
  ctx.shadowBlur = 25 * (logBands.subBass + (isKick ? 1 : 0));

  const emblemSize = Math.min(w, h) * 0.25 * (1 + logBands.bass * 0.75 + (isKick ? 0.35 : 0));
  ctx.strokeRect(-emblemSize / 2, -emblemSize / 2, emblemSize, emblemSize);
  ctx.beginPath();
  ctx.arc(0, 0, emblemSize * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── 7. OPTICAL POST-PROCESSING & SHADERS ────────────────────────────
export function applyCRTScanlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  showScanlines: boolean
) {
  if (!showScanlines) return;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  const scanlineGap = 4;
  for (let y = 0; y < h; y += scanlineGap) {
    ctx.fillRect(0, y, w, 1.5);
  }

  // Vignette Corner Darkening
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

export function applyChromaticAberration(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  flux: number,
  isBeat: boolean
) {
  if (!isBeat && flux < 0.15) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = Math.min(0.4, flux * 0.9);

  const offset = Math.min(12, flux * 16);
  ctx.drawImage(ctx.canvas, -offset, 0, w, h);
  ctx.drawImage(ctx.canvas, offset, 0, w, h);

  ctx.restore();
}

export function applyKaleidoscope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  symmetry: VisualizerSymmetry
) {
  if (symmetry === 'NONE') return;

  const slices = symmetry === '4_AXIS' ? 4 : 8;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.drawImage(ctx.canvas, 0, 0);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  for (let i = 0; i < slices; i++) {
    ctx.rotate((Math.PI * 2) / slices);
    ctx.drawImage(tempCanvas, -w / 2, -h / 2);
  }
  ctx.restore();
}
