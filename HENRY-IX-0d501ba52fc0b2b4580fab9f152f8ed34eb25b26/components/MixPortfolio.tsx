'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Play, Pause, CircleDot, Music2, Disc, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { LEDEqualizer, RotaryKnob, SplitFlapText } from '@/components/DJComponents';
import { getStorageUrl } from '@/lib/storage';
import { audioEngine } from '@/lib/AudioEngine';
import { playClick, playTabClick, playTick } from '@/lib/audioUtils';
import { useAudioStore } from '@/store/audioStore';
import { useAudio } from './AudioProvider';
import AudioVisualizerBackground from './AudioVisualizerBackground';
import { client } from '@/sanity/lib/client';
import CDJHardware from './CDJHardware';


const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatPlayheadTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return "00:00.00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const f = Math.floor((secs % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${f.toString().padStart(2, '0')}`;
};

const proxyUrl = (url: string) => `/api/assets?url=${encodeURIComponent(url)}`;

const getSessionImage = (title: string, artworkUrl?: string) => {
  if (artworkUrl) return artworkUrl;
  if (!title) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
  if (title.includes('Knight Club') && title.includes('Session 1')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
  if (title.includes('Knight Club') && title.includes('Session 2')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%202.jpg'));
  if (title.includes('Knight Club') && title.includes('Session 3')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%203.jpg'));
  if (title.includes('Knight Club') && title.includes('Session 4')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%204.jpg'));
  if (title.includes('Knight Club') && title.includes('Session 5')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%205.jpg'));
  
  if (title.includes('Royal Court') && title.includes('Session 1')) return proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.jpg'));
  if (title.includes('Royal Court') && title.includes('Session 2')) return proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.jpg'));
  
  if (title.includes('Corner New Cross') && title.includes('Night 1')) return proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N1%20Artwork.png'));
  if (title.includes('Corner New Cross') && title.includes('Night 2')) return proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N2%20Artwork.png'));

  // Fallbacks if just matching session
  if (title.includes('Session 1')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
  if (title.includes('Session 2')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%202.jpg'));
  if (title.includes('Session 3')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%203.jpg'));
  if (title.includes('Session 4')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%204.jpg'));
  if (title.includes('Session 5')) return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%205.jpg'));
  
  return proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg'));
};

const getTrackDescription = (title: string, isLocalFile: boolean) => {
  const lower = title.toLowerCase();
  if (lower.includes('knight club')) return "Born to jest, forced to Joust.";
  if (lower.includes('royal court')) return "Lose your mind in The Great Hall.";
  if (lower.includes('corner new cross')) return "Recorded live. A past residency.";
  return `Recorded live. Features high quality uncompressed audio ${isLocalFile ? "directly from the studio." : "via SoundCloud Integration."}`;
};

const STATIC_MIX_GROUPS = [
  {
    title: "Knight Club",
    mixes: [
      { id: 'kc-1', title: 'Knight Club: Session 1', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%201%20-%20Mastered%20High%20Quality.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-1', bpm: 145, isLocalFile: true, cuePoints: [0, 1127, 2112, 2772], firstBeatOffset: 0.413793 },
      { id: 'kc-2', title: 'Knight Club: Session 2', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%202%20-%20Mastered.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-2', bpm: 152, isLocalFile: true, cuePoints: [0, 2468, 4084, 6270], firstBeatOffset: 0.394737 },
      { id: 'kc-3', title: 'Knight Club: Session 3', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%203%20-%20Mastered.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-3', bpm: 150, isLocalFile: true, cuePoints: [0, 1940, 3685, 5509] },
      { id: 'kc-4', title: 'Knight Club: Session 4', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%204%20-%20Remastered.mp3')), link: 'https://soundcloud.com/henryixdj/33baa30a-4980-40da-94c2-41085314ec43', bpm: 155, isLocalFile: true, cuePoints: [0, 1834, 3582, 5552] },
      { id: 'kc-5', title: 'Knight Club: Session 5', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%205%20MP3.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-5', bpm: 150, isLocalFile: true }
    ]
  },
  {
    title: "Royal Court",
    mixes: [
      { id: 'rc-1', title: 'Royal Court: Session 1', url: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Audio/Royal%20Court%20Session%201%20MP3.mp3')), link: 'https://soundcloud.com/henryixdj/session-1', bpm: 124, isLocalFile: true },
      { id: 'rc-2', title: 'Royal Court: Session 2', url: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Audio/Royal%20Court%20Session%202%20MP3.mp3')), link: 'https://soundcloud.com/henryixdj/01-best-yet', bpm: 125, isLocalFile: true }
    ]
  },
  {
    title: "Corner New Cross",
    mixes: [
      { id: 'cnc-1', title: 'Corner New Cross: Night 1', url: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Audio/Corner%20New%20Cross%20Night%201%20MP3.mp3')), link: 'https://soundcloud.com/henryixdj/corner-new-cross-night-1', bpm: 128, isLocalFile: true },
      { id: 'cnc-2', title: 'Corner New Cross: Night 2', url: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Audio/Corner%20New%20Cross%20Night%202%20MP3.mp3')), link: 'https://soundcloud.com/henryixdj/corner-new-cross-night-2', bpm: 132, isLocalFile: true }
    ]
  }
];


const VinylStack = ({ group, onClick, playTick }: { group: any, onClick: () => void, playTick: () => void }) => {
  return (
    <motion.div 
      className="relative w-full max-w-[400px] aspect-square cursor-pointer group mx-auto"
      onClick={onClick}
      onMouseEnter={() => playTick()}
      initial="initial"
      whileHover="hover"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <h3 className="absolute -bottom-10 text-center text-white font-sans font-bold text-lg md:text-xl tracking-widest uppercase opacity-80 group-hover:opacity-100 group-hover:text-primary transition-all">
          {group.title}
        </h3>
      </div>
      
      {/* Reverse loop so index 0 is on top */}
      {[...group.mixes].reverse().slice(-4).map((track: any, revIdx: number, arr: any[]) => {
        // We sliced up to 4 tracks. The true index (where 0 is the top of the pile) is:
        const i = arr.length - 1 - revIdx;
        
        return (
          <motion.div
            key={track.id}
            className="absolute inset-0 w-full h-full rounded-lg overflow-hidden border border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            style={{ 
              zIndex: 10 - i,
            }}
            variants={{
              initial: { 
                y: i * -8, 
                x: i * 4, 
                rotate: 0,
                scale: 1 - (i * 0.05),
                opacity: 1 - (i * 0.15)
              },
              hover: { 
                y: i * -16, 
                x: (i % 2 === 0 ? 1 : -1) * i * 16, 
                rotate: (i % 2 === 0 ? 1 : -1) * i * 6,
                scale: 1 - (i * 0.05),
                opacity: 1 - (i * 0.05)
              }
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getSessionImage(track.title, track.artworkUrl)} 
              alt={track.title}
              className="w-full h-full object-cover"
            />
            {i === 0 && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            )}
            {i !== 0 && (
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// RotaryKnob is imported from @/components/DJComponents

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

function SingleDeckWaveform({
  deckId,
  deck,
  isDepth,
  audioElementsRef
}: {
  deckId: 1 | 2 | 3 | 4;
  deck: any;
  isDepth: boolean;
  audioElementsRef?: React.RefObject<Record<number, HTMLAudioElement | null>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef(deck);
  const smoothProgressRef = useRef<number>(deck?.progress || 0);
  const lastReportedProgressRef = useRef<number>(deck?.progress || 0);

  // References for ultra-smooth jitter-free interpolation
  const isPlayingRef = useRef<boolean>(false);
  const anchorAudioTimeRef = useRef<number>(0);
  const anchorSystemTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Subscribe to Zustand state for real-time phase sync calculations
  const allDecks = useAudioStore(s => s.decks);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);

  const allDecksRef = useRef(allDecks);
  const leftActiveDeckRef = useRef(leftActiveDeck);
  const rightActiveDeckRef = useRef(rightActiveDeck);

  useEffect(() => {
    allDecksRef.current = allDecks;
    leftActiveDeckRef.current = leftActiveDeck;
    rightActiveDeckRef.current = rightActiveDeck;
  }, [allDecks, leftActiveDeck, rightActiveDeck]);

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

      const width = canvas.parentElement?.clientWidth || 300;
      const height = 64;
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

      // Calculate smooth progress
      let targetProgress = currentDeck.progress || 0;
      let isCurrentlyPlaying = currentDeck.isPlaying;

      if (!currentDeck.scMode && audioElementsRef?.current) {
        const audio = audioElementsRef.current[deckId];
        if (audio && audio.src) {
          targetProgress = audio.currentTime;
          isCurrentlyPlaying = !audio.paused;
        }
      }

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

      const progress = smoothProgressRef.current;

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
        if (!otherDeck.scMode && audioElementsRef?.current) {
          const audioOther = audioElementsRef.current[otherActiveDeckId];
          if (audioOther && audioOther.src) {
            progressOther = audioOther.currentTime;
          }
        }

        const phaseCurrent = ((progress - (currentDeck.firstBeatOffset || 0)) % beatIntervalCurrent) / beatIntervalCurrent;
        const phaseOther = ((progressOther - (otherDeck.firstBeatOffset || 0)) % beatIntervalOther) / beatIntervalOther;

        const isBothPlaying = isCurrentlyPlaying && (otherDeck.isPlaying || (audioElementsRef?.current?.[otherActiveDeckId] && !audioElementsRef.current[otherActiveDeckId]?.paused));

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
        // Draw Beatgrid lines and BAR numbers
        const currentBpm = currentDeck.bpm * (1 + (currentDeck.pitch || 0) / 100);
        const beatInterval = 60 / currentBpm;
        const beatFreq = (2 * Math.PI) / beatInterval;
        const centerX = width / 2;
        const offset = currentDeck.firstBeatOffset || 0;
        const visibleRangeSec = centerX / pixelsPerSecond;
        const startBeat = Math.floor((progress - offset - visibleRangeSec) / beatInterval);
        const endBeat = Math.ceil((progress - offset + visibleRangeSec) / beatInterval);

        for (let b = startBeat; b <= endBeat; b++) {
          const beatTime = offset + b * beatInterval;
          const x = Math.round(centerX + (beatTime - progress) * pixelsPerSecond);
          if (x >= 0 && x <= width) {
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
              // Non-major ticks on top and bottom boundaries
              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.beginPath();
              // Top boundary tick
              ctx.moveTo(x - 2, 0);
              ctx.lineTo(x + 2, 0);
              ctx.lineTo(x, 2.5);
              ctx.fill();

              // Bottom boundary tick
              ctx.beginPath();
              ctx.moveTo(x - 2, height);
              ctx.lineTo(x + 2, height);
              ctx.lineTo(x, height - 2.5);
              ctx.fill();
            }
          }
        }

        // Draw Waveform peaks
        const halfH = height / 2;
        const PEAK_DENSITY = 4;

        const getPeakHeight = (time: number) => {
          if (time < 0 || time > (currentDeck.duration || 300)) return 0.02;
          if (currentDeck.waveformPeaks && currentDeck.waveformPeaks.length > 0) {
            const exactIdx = time * PEAK_DENSITY;
            const idxBase = Math.floor(exactIdx);
            const fract = exactIdx - idxBase;
            
            const p0 = currentDeck.waveformPeaks[idxBase] !== undefined 
              ? currentDeck.waveformPeaks[idxBase] 
              : 0.02;
            const p1 = currentDeck.waveformPeaks[idxBase + 1] !== undefined 
              ? currentDeck.waveformPeaks[idxBase + 1] 
              : p0;
            return p0 + (p1 - p0) * fract;
          } else {
            const idx = Math.floor(time * 14);
            const seedStr = currentDeck.link || currentDeck.id || '';
            return getWaveformHeight(seedStr, idx, currentDeck.duration || 300);
          }
        };

        const points: { drawX: number; lowH: number; midH: number; highH: number }[] = [];

        for (let drawX = 0; drawX < width; drawX += 1) {
          const barTime = progress + (drawX - centerX) / pixelsPerSecond;
          const hVal = getPeakHeight(barTime);

          const eqLow = currentDeck.eqLow ?? 50;
          const eqMid = currentDeck.eqMid ?? 50;
          const eqHi = currentDeck.eqHi ?? 50;
          const volume = currentDeck.volume ?? 80;
          
          const lowMod = eqLow / 50;
          const midMod = eqMid / 50;
          const hiMod = eqHi / 50;
          const volumeMod = volume / 80;
          
          const baseLow = hVal * 0.9;
          const baseMid = hVal * 0.65;
          const baseHigh = hVal * 0.45;

          const lowHeight = Math.max(1, baseLow * (height - 4) * lowMod * volumeMod);
          const midHeight = Math.max(1, baseMid * (height - 8) * midMod * volumeMod);
          const highHeight = Math.max(1, baseHigh * (height - 12) * hiMod * volumeMod);

          points.push({ drawX, lowH: lowHeight, midH: midHeight, highH: highHeight });
        }

        // Use Math.round/Math.floor in path plotting to avoid sub-pixel anti-aliasing blur
        // 1. Low Band (Vivid Cyan/Blue foundation: rgba(0, 162, 255, 1))
        ctx.fillStyle = 'rgba(0, 162, 255, 0.4)';
        ctx.strokeStyle = 'rgba(0, 190, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, halfH);
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(Math.round(points[i].drawX), Math.round(halfH - points[i].lowH / 2));
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(Math.round(points[i].drawX), Math.round(halfH + points[i].lowH / 2));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Mid Band (Vivid Neon Orange: rgba(255, 120, 0, 1))
        ctx.fillStyle = 'rgba(255, 120, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 150, 0, 0.95)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, halfH);
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(Math.round(points[i].drawX), Math.round(halfH - points[i].midH / 2));
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(Math.round(points[i].drawX), Math.round(halfH + points[i].midH / 2));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. High Band (Pure Bright White: rgba(255, 255, 255, 1))
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, halfH);
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(Math.round(points[i].drawX), Math.round(halfH - points[i].highH / 2));
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(Math.round(points[i].drawX), Math.round(halfH + points[i].highH / 2));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw Active Loop Highlight Overlay
      if (currentDeck.isLoopActive && currentDeck.loopIn !== null && currentDeck.loopIn !== undefined && currentDeck.loopOut !== null && currentDeck.loopOut !== undefined) {
        const loopCenterX = width / 2;
        const xIn = Math.round(loopCenterX + (currentDeck.loopIn - progress) * pixelsPerSecond);
        const xOut = Math.round(loopCenterX + (currentDeck.loopOut - progress) * pixelsPerSecond);
        
        const drawStart = Math.max(0, Math.min(width, xIn));
        const drawEnd = Math.max(0, Math.min(width, xOut));
        
        if (drawStart < drawEnd) {
          ctx.save();
          // Glow/Overlay fill between loop points
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.fillRect(drawStart, 0, drawEnd - drawStart, height);
          
          // Draw subtle solid amber border lines on boundaries
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
          ctx.lineWidth = 1;
          
          if (xIn >= 0 && xIn <= width) {
            ctx.beginPath();
            ctx.moveTo(xIn, 0);
            ctx.lineTo(xIn, height);
            ctx.stroke();
          }
          if (xOut >= 0 && xOut <= width) {
            ctx.beginPath();
            ctx.moveTo(xOut, 0);
            ctx.lineTo(xOut, height);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Draw Cue Line & Hot Cues
      const centerX = width / 2;

      // Draw Cue Line (linked to deck.mainCue)
      if (currentDeck.mainCue !== undefined && currentDeck.mainCue !== null) {
        const timeVal = currentDeck.mainCue;
        const x = Math.round(centerX + (timeVal - progress) * pixelsPerSecond);
        if (x >= 0 && x <= width) {
          const color = '#f97316'; // Orange cue line
          
          // Draw the orange cue line
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          ctx.restore();
          
          // Draw flag tag at the top
          ctx.save();
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
          ctx.restore();
        }
      }

      // Draw Hot Cues
      const hotCues = currentDeck.hotCues || {};
      const HOT_CUE_COLORS: Record<string, string> = {
        A: '#ef4444', // Red
        B: '#f97316', // Orange
        C: '#eab308', // Yellow
        D: '#22c55e', // Green
        E: '#06b6d4', // Cyan
        F: '#3b82f6', // Blue
        G: '#a855f7', // Purple
        H: '#ec4899'  // Pink
      };

      Object.entries(hotCues).forEach(([pad, time]) => {
        if (time !== null && time !== undefined) {
          const timeVal = time as number;
          const x = Math.round(centerX + (timeVal - progress) * pixelsPerSecond);
          if (x >= 0 && x <= width) {
            const color = HOT_CUE_COLORS[pad] || '#ffffff';
            
            // Draw the matching colored bar
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            
            ctx.shadowColor = color;
            ctx.shadowBlur = 3;
            
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.restore();
            
            // Draw flag tag at the top
            ctx.save();
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
            ctx.restore();
          }
        }
      });

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
      const drag = dragStateRef.current;
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

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [audioElementsRef, deckId]);

  const handleStart = (clientX: number, isShift: boolean) => {
    const currentDeck = deckRef.current;
    if (!currentDeck || currentDeck.id === 'locked') return;

    const audio = audioElementsRef?.current?.[deckId];
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
      const audio = audioElementsRef?.current?.[deckId];
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
    <div className="relative w-full h-[64px] bg-black rounded border border-zinc-900 overflow-hidden shadow-inner flex items-center justify-center mb-1 select-none shrink-0 z-10">
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

function MixArchive({ 
  isDepth, 
  activeView,
  setActiveView,
  decks,
  setDecks,
  mixGroups,
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
  mixGroups: any[];
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
  const [deckCount, setDeckCount] = useState<2 | 4>(4);
  const [isMobile, setIsMobile] = useState(false);
  const activeDeckIds = (deckCount === 2 ? [1, 2] : [3, 1, 2, 4]) as readonly (1 | 2 | 3 | 4)[];

  const isStacked = useAudioStore(s => s.isStacked);
  const setStacked = useAudioStore(s => s.setStacked);

  useEffect(() => {
    const handleResize = () => {
      const isWindowStacked = window.innerWidth < 1536;
      setStacked(isWindowStacked);
      
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setDeckCount(2);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setStacked]);

  const getBrowserArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'browserL' : 'browserR';
    }
    return `browser${id}`;
  };

  const getWaveArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'waveL' : 'waveR';
    }
    return `wave${id}`;
  };

  const getControlArea = (id: 1 | 2 | 3 | 4) => {
    if (isStacked) {
      const isLeft = (id === 1 || id === 3);
      const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
      if (!isActive) return 'none';
      return isLeft ? 'controlL' : 'controlR';
    }
    return `control${id}`;
  };

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

  // --- Fader Update Batching refs ---
  const pendingCrossfaderRef = useRef<number | null>(null);
  const crossfaderFrameScheduledRef = useRef(false);
  
  const pendingVolumesRef = useRef<Record<number, number>>({});
  const volumesFrameScheduledRef = useRef(false);

  const handleCrossfaderChange = (val: number) => {
    // 1. Instant audio DSP update (zero latency)
    const state = useAudioStore.getState();
    [1, 2, 3, 4].forEach(deckId => {
      const deck = state.decks[deckId];
      if (deck) {
        const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, val);
        audioEngine.setGain(deckId, deck.volume, cfMult, state.isMuted);
      }
    });

    // 2. Queue Zustand/React state update
    pendingCrossfaderRef.current = val;
    if (!crossfaderFrameScheduledRef.current) {
      crossfaderFrameScheduledRef.current = true;
      requestAnimationFrame(() => {
        crossfaderFrameScheduledRef.current = false;
        if (pendingCrossfaderRef.current !== null) {
          setCrossfader(pendingCrossfaderRef.current);
          pendingCrossfaderRef.current = null;
        }
      });
    }
  };

  const handleVolumeChange = (deckId: number, val: number) => {
    // 1. Instant audio DSP update (zero latency)
    const state = useAudioStore.getState();
    const deck = state.decks[deckId];
    if (deck) {
      const cfMult = audioEngine.computeCrossfaderGain(deck.crossfaderAssign, state.crossfader);
      audioEngine.setGain(deckId, val, cfMult, state.isMuted);
    }

    // 2. Queue Zustand/React state update
    pendingVolumesRef.current[deckId] = val;
    if (!volumesFrameScheduledRef.current) {
      volumesFrameScheduledRef.current = true;
      requestAnimationFrame(() => {
        volumesFrameScheduledRef.current = false;
        const updates = { ...pendingVolumesRef.current };
        pendingVolumesRef.current = {};
        
        setDecks((prev: any) => {
          const next = { ...prev };
          Object.entries(updates).forEach(([idStr, v]) => {
            const id = Number(idStr);
            if (next[id]) {
              next[id] = { ...next[id], volume: v };
            }
          });
          return next;
        });
      });
    }
  };

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
      if (audio && isFinite(audio.duration)) {
        if (slipMode[deckId]) {
          let targetTime = roll.virtualTime;
          if (targetTime > audio.duration) targetTime = audio.duration;
          if (isFinite(targetTime) && !isNaN(targetTime)) {
            audio.currentTime = targetTime;
          }
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
          
          if (!deck.scMode && audio && isFinite(audio.duration) && audio.duration > 0) {
            const timeDelta = (state.velocity / (2 * Math.PI)) * 2.5; // 2.5s per full rotation
            let nextTime = audio.currentTime + timeDelta;
            if (nextTime < 0) nextTime = 0;
            if (nextTime > audio.duration) nextTime = audio.duration;
            if (isFinite(nextTime) && !isNaN(nextTime)) {
              audio.currentTime = nextTime;
            }
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
        if (deck.isLoopActive && 
            typeof deck.loopIn === 'number' && isFinite(deck.loopIn) && !isNaN(deck.loopIn) &&
            typeof deck.loopOut === 'number' && isFinite(deck.loopOut) && !isNaN(deck.loopOut) && 
            audio && !audio.paused) {
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


  
  // mixGroups is passed from props

  // Helper to determine active playing deck for background visualizer
  const getActiveVisualizerState = () => {
    const active = Object.values(decks).find((d: any) => d.isPlaying);
    return active ? { isPlaying: true } : { isPlaying: false };
  };

  const activeVisualizer = getActiveVisualizerState();

  const [browserFolders, setBrowserFolders] = useState<Record<number, string>>({
    1: 'all', 2: 'all', 3: 'all', 4: 'all'
  });

  const renderDeckBrowser = (deckId: 1 | 2 | 3 | 4) => {
    const deck = decks[deckId];
    const isLocked = deck?.id === 'locked';
    const activeFolder = browserFolders[deckId] || 'all';
    
    const themeColor = 
      deckId === 1 ? 'rgba(211,15,49,1)' : // red
      deckId === 2 ? 'rgba(34,211,238,1)' : // cyan
      deckId === 3 ? 'rgba(16,185,129,1)' : // green
      'rgba(234,179,8,1)'; // yellow

    if (isLocked) {
      return (
        <div 
          className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 font-mono select-none flex flex-col justify-center items-center h-full min-h-[160px] text-center"
          style={{ borderTop: `2px solid ${themeColor}` }}
        >
          <span className="text-yellow-500 font-bold tracking-widest text-[11px] uppercase">
            DECK LOCKED // COMING SOON
          </span>
          <span className="text-zinc-600 text-[8px] mt-2 tracking-wider">
            ACCESS_DENIED // REQUIRE_RELEASE
          </span>
        </div>
      );
    }

    // Get list of tracks for the active folder
    const folderMixGroups = mixGroups || [];
    let tracks: any[] = [];
    if (activeFolder === 'all') {
      tracks = folderMixGroups.flatMap(g => g.mixes || []);
    } else {
      const matchedGroup = folderMixGroups.find(g => g.title.toLowerCase() === activeFolder.toLowerCase());
      tracks = matchedGroup ? (matchedGroup.mixes || []) : [];
    }

    return (
      <div 
        className="rounded-xl border border-zinc-900 bg-zinc-950/90 flex flex-col text-zinc-300 font-mono text-[9px] select-none h-full min-h-[180px] overflow-hidden shadow-2xl relative transition-all duration-300"
        style={{ borderTop: `2px solid ${themeColor}` }}
      >
        {/* Rekordbox Playlist Browser Header */}
        <div className="flex justify-between items-center bg-black/60 border-b border-zinc-900 px-3 py-1.5 shrink-0 text-[8px] text-zinc-500 tracking-wider uppercase font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <span>BROWSER // DECK {deckId}</span>
          </div>
          <span>USB1 // PLAYLISTS</span>
        </div>

        {/* Directory & Tracks Split Grid */}
        <div className="flex flex-1 min-h-0 w-full">
          {/* Left Column: Playlist Folders Tree */}
          <div className="w-[35%] border-r border-zinc-900 bg-black/25 flex flex-col p-1.5 gap-1 shrink-0 overflow-y-auto custom-scrollbar min-w-0">
            <span className="text-[6.5px] text-zinc-600 uppercase font-black tracking-widest px-1 mb-1">Source</span>
            <button
              onClick={() => {
                setBrowserFolders(prev => ({ ...prev, [deckId]: 'all' }));
                playClick(800, 'sine', 0.02);
              }}
              className={cn(
                "w-full text-left py-1 px-1.5 rounded transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer hover:bg-zinc-900/40 text-[8.5px] uppercase font-bold",
                activeFolder === 'all' ? "bg-zinc-900 text-white border-l-2" : "text-zinc-500 hover:text-zinc-300"
              )}
              style={{ borderLeftColor: activeFolder === 'all' ? themeColor : 'transparent' }}
            >
              📂 ALL MIXES
            </button>
            {folderMixGroups.map(group => (
              <button
                key={group.title}
                onClick={() => {
                  setBrowserFolders(prev => ({ ...prev, [deckId]: group.title }));
                  playClick(800, 'sine', 0.02);
                }}
                className={cn(
                  "w-full text-left py-1 px-1.5 rounded transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer hover:bg-zinc-900/40 text-[8.5px] uppercase font-bold",
                  activeFolder === group.title ? "bg-zinc-900 text-white border-l-2" : "text-zinc-500 hover:text-zinc-300"
                )}
                style={{ borderLeftColor: activeFolder === group.title ? themeColor : 'transparent' }}
              >
                📂 {group.title}
              </button>
            ))}
            
            {/* Custom upload helper in sidebar */}
            <div className="mt-auto border-t border-zinc-900/60 pt-1.5">
              <button
                onClick={() => {
                  const fileInput = fileInputRefs.current[deckId];
                  if (fileInput) fileInput.click();
                }}
                className="w-full text-center py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-[7px] tracking-widest font-black transition-colors uppercase cursor-pointer"
              >
                📁 CUSTOM LOAD
              </button>
              <input
                type="file"
                ref={el => { fileInputRefs.current[deckId] = el; }}
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
          </div>

          {/* Right Column: Track Table List */}
          <div className="flex-1 flex flex-col min-w-0 bg-black/10 overflow-hidden">
            {/* Table Headers */}
            <div className="grid grid-cols-[12%_63%_25%] border-b border-zinc-900/80 px-2 py-1 text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest bg-black/30 shrink-0">
              <span>#</span>
              <span>Track Title</span>
              <span className="text-right">BPM</span>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5 min-h-0">
              {tracks.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-zinc-600 text-[8px] italic py-4">
                  No tracks available
                </div>
              ) : (
                tracks.map((mix, index) => {
                  const isLoaded = deck.id === mix.id;
                  const idxStr = (index + 1).toString().padStart(3, '0');
                  
                  return (
                    <div 
                      key={mix.id}
                      onClick={() => {
                        playTrack(mix, deckId);
                      }}
                      className={cn(
                        "grid grid-cols-[12%_63%_25%] items-center px-1.5 py-1.5 rounded cursor-pointer transition-colors duration-200 hover:bg-zinc-900/30 select-none group border border-transparent",
                        isLoaded 
                          ? "bg-zinc-900 text-white font-black" 
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                      style={{ 
                        borderColor: isLoaded ? `${themeColor}20` : 'transparent',
                        color: isLoaded ? themeColor : undefined 
                      }}
                    >
                      <span className={cn("text-[7.5px]", isLoaded ? "text-white" : "text-zinc-600 font-bold")}>
                        {idxStr}
                      </span>
                      <span className="truncate pr-1 uppercase tracking-wide text-[8.5px]">
                        🎵 {mix.title}
                      </span>
                      <span className="text-right text-[8.5px] font-bold text-zinc-500 font-mono">
                        {mix.bpm || 120}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStackedWaveform = (deckId: 1 | 2 | 3 | 4) => {
    const deck = decks[deckId];
    const isPlaying = deck.isPlaying;
    const isLocked = deck.id === 'locked';
    const themeColor = 
      deckId === 1 ? 'rgba(211,15,49,1)' : // red
      deckId === 2 ? 'rgba(34,211,238,1)' : // cyan
      deckId === 3 ? 'rgba(16,185,129,1)' : // green
      'rgba(234,179,8,1)'; // yellow

    return (
      <div 
        className="w-full flex items-stretch bg-zinc-950 border border-zinc-900/60 rounded-xl overflow-hidden shadow-lg h-[64px]"
        style={{ borderLeft: `3px solid ${themeColor}` }}
      >
        {/* Left Info Panel */}
        <div className="w-[100px] border-r border-zinc-900 bg-black/40 flex flex-col justify-between p-1.5 shrink-0 select-none text-left">
          <div className="flex justify-between items-center">
            <span className="text-[7.5px] font-black uppercase font-mono tracking-wider" style={{ color: themeColor }}>
              DECK {deckId}
            </span>
            <span className="text-[6.5px] text-zinc-600 font-bold font-mono">USB1</span>
          </div>
          <div className="text-[8.5px] font-bold text-zinc-300 font-mono truncate leading-none uppercase">
            {isLocked ? "LOCKED" : deck.title || "EMPTY"}
          </div>
          <div className="flex justify-between items-center text-[7px] text-zinc-500 font-mono">
            <span>KEY: --</span>
            <span>{isLocked ? "--:--" : formatTime(deck.progress || 0)}</span>
          </div>
        </div>

        {/* Scrolling Waveform Canvas */}
        <div className="flex-1 min-w-0 flex items-center justify-center p-1 bg-black">
          <div className="w-full h-full relative flex items-center justify-center">
            <SingleDeckWaveform
              deckId={deckId}
              deck={deck}
              isDepth={isDepth}
              audioElementsRef={audioElementsRef}
            />
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-[60px] border-l border-zinc-900 bg-black/40 flex flex-col justify-center items-center p-1.5 shrink-0 select-none text-center">
          <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-black leading-none mb-0.5">BPM</span>
          <span className="font-black text-zinc-400 font-mono text-[9px] tracking-wide">
            {isLocked ? "130.00" : (deck.bpm * (1 + (deck.pitch || 0) / 100)).toFixed(1)}
          </span>
          <span className={cn(
            "text-[6.5px] font-bold mt-1 px-1 rounded",
            isPlaying ? "bg-primary/10 text-primary animate-pulse" : "text-zinc-600"
          )} style={{ color: isPlaying ? themeColor : undefined }}>
            {isPlaying ? "ACTIVE" : "STANDBY"}
          </span>
        </div>
      </div>
    );
  };

  const renderDeckControls = (deckId: 1 | 2 | 3 | 4) => {
    return <CDJHardware deckId={deckId} />;
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
        <div className={cn(
          "grid gap-1.5 md:gap-2.5 my-2 items-stretch justify-center z-10 flex-grow min-h-0 select-none",
          deckCount === 2 ? "grid-cols-2" : "grid-cols-4"
        )}>
          {(deckCount === 2 ? [1, 2] : [3, 1, 2, 4]).map(id => {
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
                style={{ containerType: 'inline-size' }}
                className={cn(
                  "w-full flex flex-col items-center justify-between gap-2 py-2 px-1 rounded-xl transition-all border h-full min-h-0",
                  isActive ? "bg-zinc-900/30 border-zinc-800/80" : "border-transparent opacity-60 hover:opacity-90"
                )}
              >
                <span 
                  className="font-mono text-[7.5px] font-black tracking-widest uppercase leading-none"
                  style={{ color: channelColor }}
                >
                  CH {id}
                </span>

                <div className="flex flex-col gap-2 w-full">
                  <RotaryKnob 
                    label="TRIM"
                    value={deck.trim ?? 50}
                    size="flex"
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
                    size="flex"
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
                    size="flex"
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
                    size="flex"
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
                    size="flex"
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
                <div className="flex flex-col items-center gap-1 mt-1 relative w-[50cqw] max-w-[40px] min-w-[20px] flex-grow min-h-0 h-full">
                  <span className="text-[min(8px,max(5.5px,7cqw))] text-zinc-500 font-mono uppercase tracking-widest leading-none font-bold shrink-0">
                    VOL
                  </span>
                  
                  <div className="relative flex-grow min-h-[50px] max-h-[140px] w-[32cqw] max-w-[28px] min-w-[14px] bg-zinc-950 border border-zinc-900 focus-within:border-zinc-500 focus-within:shadow-[0_0_8px_rgba(255,255,255,0.15)] rounded flex items-center justify-center overflow-hidden shadow-inner">
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
                          handleVolumeChange(id, val);
                        } else {
                          playLockoutBlip();
                        }
                      }}
                      disabled={isLocked}
                      aria-label={`Volume Fader Deck ${id}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={deck.volume}
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
                        <div key={idx} className={cn("h-[1px] bg-zinc-700 w-3 mx-auto", idx === 0 && "w-[80%] bg-zinc-500")} />
                      ))}
                    </div>

                    {/* Fader Cap */}
                    <div 
                      className="absolute w-[135%] h-[min(26px,max(18px,28cqw))] bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 rounded flex items-center justify-center shadow pointer-events-none"
                      style={{ 
                        bottom: `calc(${deck.volume}% - min(13px,max(9px,14cqw)))`,
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

          <div className="relative w-full h-5 bg-zinc-950 border border-zinc-900 focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(216,22,63,0.5)] rounded flex items-center justify-center px-4 overflow-hidden select-none shadow-inner">
            <input 
              type="range"
              min="0"
              max="100"
              value={crossfader}
              title="Crossfader"
              placeholder="Crossfader"
              onChange={(e) => {
                const val = Number(e.target.value);
                handleCrossfaderChange(val);
                if (Math.abs(val - 50) < 3) {
                  playClick(880, 'sine', 0.004);
                }
              }}
              aria-label="Crossfader"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={crossfader}
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
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  const renderTracklist = () => {
    if (expandedFamily) {
      const group = mixGroups.find(g => g.title === expandedFamily);
      if (!group) {
        setExpandedFamily(null);
        return null;
      }
      
      return (
        <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-zinc-900 pb-4">
            <button 
              onClick={() => { setExpandedFamily(null); playClick(900, 'sine', 0.02); }}
              onMouseEnter={() => playTick()}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] uppercase tracking-widest font-black rounded-md border border-zinc-800 transition-colors flex items-center gap-2 active:scale-95"
            >
              <span className="text-primary">&lt;</span> BACK TO ARCHIVE
            </button>
            <h2 className="text-2xl md:text-4xl font-sans font-bold text-primary tracking-widest uppercase glitch" data-text={group.title}>{group.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {group.mixes.map((track: any) => {
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
                      src={getSessionImage(track.title, track.artworkUrl)} 
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
                          playingOnDecks.forEach(id => togglePlayGlobal(id));
                        } else {
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
    }

    return (
      <div className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-12">
        <h2 className="text-2xl md:text-4xl font-sans font-bold text-primary tracking-widest uppercase glitch" data-text="01 / MIX ARCHIVE">01 / MIX ARCHIVE</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16 md:gap-24 px-4 pb-12 pt-8">
          {mixGroups.map((group: any) => (
            <VinylStack 
              key={group.title} 
              group={group} 
              onClick={() => { setExpandedFamily(group.title); playClick(900, 'sine', 0.02); }}
              playTick={playTick}
            />
          ))}
        </div>
      </div>
    );
  };
  return (
    <section id="vault" className={cn(
      "w-full flex-1 relative pt-2 pb-2 px-2 md:px-4 mx-auto flex flex-col justify-start md:justify-center @container",
      activeView === 'cdj' ? "overflow-hidden" : "overflow-y-auto"
    )}>

 
      <div 
        ref={archiveRef} 
        onMouseMove={handleMouseMove}
        className={cn(
          "relative w-full rounded-xl border border-dashed flex flex-col gap-2 p-2 md:p-2.5 h-full",
          activeView === 'cdj' ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
          isDepth ? "border-zinc-800 bg-zinc-950/40" : "border-black/20"
        )}
      >
        <AudioVisualizerBackground isDepth={isDepth} mouseX={mouseX} mouseY={mouseY} isPlaying={activeVisualizer.isPlaying} />

        {/* Persistent Retro-Futuristic Header with Toggle Button */}
        <div className="w-full relative flex justify-center items-center z-30 font-mono select-none px-3 py-2 shrink-0 border-b border-zinc-900 bg-black/60 backdrop-blur rounded-lg mb-1">
          <div className="absolute left-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#D8163F]" />
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
              HENRY IX // CDJ PORTFOLIO
            </span>
          </div>
          <div className="relative flex p-1 bg-zinc-950/80 border border-zinc-900/80 rounded-lg backdrop-blur-md">
            {(['cdj', 'tracklist'] as const).map((view) => (
              <button
                key={view}
                onClick={() => {
                  if (setActiveView && activeView !== view) {
                    setActiveView(view);
                    playClick(800, 'sine', 0.02);
                  }
                }}
                className={cn(
                  "relative px-4 py-1.5 rounded-md font-mono text-[9px] md:text-[10px] tracking-widest font-black uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 w-32 md:w-36",
                  activeView === view ? "text-black" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {activeView === view && (
                  <motion.div
                    layoutId="view-toggle-highlight"
                    className="absolute inset-0 bg-primary rounded-md shadow-[0_0_10px_rgba(216,22,63,0.4)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{view === 'cdj' ? 'DECK VIEW' : 'TRACKLIST VIEW'}</span>
              </button>
            ))}
          </div>

          {/* Sub Slider for 2 or 4 decks - only shown in Deck View and when not on mobile */}
          {activeView === 'cdj' && !isMobile && (
            <div className="absolute right-3 flex items-center gap-1.5 md:gap-2">
              <span className="text-[7.5px] md:text-[8px] text-zinc-500 font-bold uppercase tracking-wider select-none">
                DECKS:
              </span>
              <div className="relative flex p-0.5 bg-zinc-950/80 border border-zinc-900 rounded-md backdrop-blur-md">
                {([2, 4] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setDeckCount(count);
                      playClick(800, 'sine', 0.02);
                    }}
                    className={cn(
                      "relative px-2 py-0.5 rounded font-mono text-[8px] font-black uppercase transition-colors cursor-pointer flex items-center justify-center w-8 h-5",
                      deckCount === count ? "text-zinc-950 font-black" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {deckCount === count && (
                      <motion.div
                        layoutId="deck-count-highlight"
                        className="absolute inset-0 bg-primary rounded shadow-[0_0_8px_rgba(216,22,63,0.3)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeView === 'cdj' ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: `
              .dj-grid-container {
                display: grid;
                gap: 12px;
                width: 100%;
                height: 100%;
              }
              
              /* Performance Mode (Screens < 1536px) */
              @media (max-width: 1535px) {
                .dj-grid-container {
                  grid-template-columns: 1.2fr 2fr 1.2fr;
                  grid-template-rows: auto auto 1fr;
                  grid-template-areas:
                    "browserL waveL  browserR"
                    "browserL waveR  browserR"
                    "controlL mixer  controlR";
                }
              }
              
              /* Standard Mode (Screens >= 1536px) */
              @media (min-width: 1536px) {
                .dj-grid-container {
                  ${deckCount === 2 ? `
                    grid-template-columns: minmax(0, 1fr) minmax(280px, 1.2fr) minmax(0, 1fr);
                    grid-template-rows: 200px auto 1fr;
                    grid-template-areas:
                      "browser1 mixer browser2"
                      "wave1    mixer wave2"
                      "control1 mixer control2";
                  ` : `
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(280px, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
                    grid-template-rows: 200px auto 1fr;
                    grid-template-areas:
                      "browser3 browser1 mixer browser2 browser4"
                      "wave3    wave1    mixer wave2    wave4"
                      "control3 control1 mixer control2 control4";
                  `}
                }
              }
            `}} />

            <div className="dj-grid-container select-none flex-grow min-h-0 h-full overflow-y-auto 2xl:overflow-hidden p-1">
              
              {/* Browsers */}
              {activeDeckIds.map(id => {
                const isLeft = (id === 1 || id === 3);
                const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
                return (
                  <div 
                    key={`browser-container-${id}`}
                    style={{ gridArea: getBrowserArea(id) }} 
                    className={cn(
                      "browser-module min-h-0 h-full", 
                      (isActive || !isStacked) ? "block" : "hidden"
                    )}
                  >
                    {renderDeckBrowser(id)}
                  </div>
                );
              })}

              {/* Waveforms */}
              {activeDeckIds.map(id => {
                const isLeft = (id === 1 || id === 3);
                const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
                const deck = decks[id];
                const isLocked = deck?.id === 'locked';
                const themeColor = 
                  id === 1 ? 'rgba(211,15,49,1)' : // red
                  id === 2 ? 'rgba(34,211,238,1)' : // cyan
                  id === 3 ? 'rgba(16,185,129,1)' : // green
                  'rgba(234,179,8,1)'; // yellow
                  
                return (
                  <div 
                    key={`wave-container-${id}`}
                    style={{ gridArea: getWaveArea(id) }} 
                    className={cn(
                      "wave-module min-h-0 h-full flex flex-col justify-center", 
                      (isActive || !isStacked) ? "block" : "hidden"
                    )}
                  >
                    {isStacked ? renderStackedWaveform(id) : (
                      <div 
                        className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-2 md:p-2.5 flex flex-col gap-2 w-full shadow-md border-l-2 select-none" 
                        style={{ borderLeftColor: themeColor }}
                      >
                        {/* LCD State Log Info Header (combined) */}
                        <div className="w-full flex flex-col gap-1 font-mono text-[9px]">
                          {/* LCD Status Indicators */}
                          <div className="flex items-center justify-between text-zinc-500 text-[6.5px] tracking-widest border-b border-zinc-900 pb-1 uppercase font-black">
                            <span>DECK_{id} STATE LOG</span>
                            <span style={{ color: isLocked ? 'rgb(234,179,8)' : deck?.isPlaying ? themeColor : 'rgb(113,113,122)' }}>
                              {isLocked ? "ACCESS_LOCKED" : deck?.isPlaying ? "● PLAYING" : "■ PAUSED"}
                            </span>
                          </div>

                          {/* Track Name */}
                          <div className="flex flex-col mt-0.5">
                            <span className="text-[5.5px] text-zinc-600 uppercase tracking-widest font-black mb-0.5 leading-none">TRACK NAME</span>
                            <span className="font-black truncate tracking-wider text-zinc-300 font-mono uppercase text-[9.5px] leading-none">
                              {isLocked ? "LOCKED DECK (PREVIEW ONLY)" : deck?.title || "NO TRACK LOADED"}
                            </span>
                          </div>

                          {/* Tempo, Playhead and Sync values */}
                          <div className="grid grid-cols-3 gap-2 mt-1 border-t border-zinc-900/50 pt-1 select-none">
                            <div className="flex flex-col">
                              <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold leading-none mb-0.5">SPEED</span>
                              <span className="font-bold text-zinc-400 text-[8.5px] leading-none">
                                {isLocked ? "130.00 BPM" : `${(deck?.bpm * (1 + (deck?.pitch || 0) / 100)).toFixed(2)} BPM`}
                              </span>
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold leading-none mb-0.5">PLAYHEAD</span>
                              <span className="font-bold text-zinc-400 font-mono text-[8.5px] leading-none">
                                {isLocked ? "LOCKED" : formatPlayheadTime(deck?.progress || 0)}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[5px] text-zinc-600 uppercase tracking-widest font-bold leading-none mb-0.5">SYNC STATUS</span>
                              <span className={cn(
                                "font-black text-mono tracking-wide uppercase transition-colors duration-300 text-[8.5px] leading-none",
                                deck?.syncEnabled ? "text-emerald-400" : "text-zinc-600"
                              )}>
                                {deck?.syncEnabled ? "SYNCED" : "OFF"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Scrolling Waveform */}
                        <div className="w-full relative bg-black/40 rounded p-1 border border-zinc-900/50 flex flex-col justify-center items-center">
                          <div 
                            className="text-[6.5px] font-mono tracking-widest font-black uppercase self-start mb-0.5 px-0.5"
                            style={{ color: themeColor }}
                          >
                            WAVE DISPLAY
                          </div>
                          <SingleDeckWaveform 
                            deckId={id} 
                            deck={deck} 
                            isDepth={isDepth} 
                            audioElementsRef={audioElementsRef} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Controls / Jogwheels */}
              {activeDeckIds.map(id => {
                const isLeft = (id === 1 || id === 3);
                const isActive = isLeft ? (leftActiveDeck === id) : (rightActiveDeck === id);
                return (
                  <div 
                    key={`control-container-${id}`}
                    style={{ gridArea: getControlArea(id) }} 
                    className={cn(
                      "control-module min-h-0 h-full", 
                      (isActive || !isStacked) ? "block" : "hidden"
                    )}
                  >
                    {renderDeckControls(id)}
                  </div>
                );
              })}

              {/* Central Mixer Panel */}
              <div 
                style={{ gridArea: 'mixer' }} 
                className="mixer-module block h-full min-h-0"
              >
                {renderMixer()}
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

export default function MixPortfolio({ isDepth = true, activeView: initialActiveView = 'cdj' }: { isDepth?: boolean, activeView?: 'cdj' | 'tracklist' }) {
  const [activeView, setActiveView] = useState<'cdj' | 'tracklist'>(initialActiveView);
  const [mixGroups, setMixGroups] = useState<any[]>(STATIC_MIX_GROUPS);

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

  useEffect(() => {
    async function loadDynamicMixes() {
      try {
        const data = await client.fetch<any[]>(`*[_type == "mixGroup"]{
          title,
          slug,
          description,
          mixes[defined(audioFile)]->{
            _id,
            title,
            slug,
            bpm,
            soundcloudLink,
            audioFile,
            artworkFile,
            tracklist,
            cuePoints
          }
        }`);

        if (data && data.length > 0) {
          const formatted = data.map(group => ({
            title: group.title,
            mixes: (group.mixes || []).map((mix: any) => ({
              id: mix._id,
              title: mix.title,
              url: proxyUrl(getStorageUrl(mix.audioFile || '')),
              link: mix.soundcloudLink || '',
              bpm: mix.bpm || 120,
              cuePoints: mix.cuePoints || [],
              tracklist: mix.tracklist || '',
              artworkUrl: mix.artworkFile ? proxyUrl(getStorageUrl(mix.artworkFile)) : undefined
            }))
          }));

          setMixGroups(formatted);

          // Update decks dynamically from loaded mixes
          const allMixes = formatted.flatMap(g => g.mixes);
          
          setDecks((prevDecks: any) => {
            const updated = { ...prevDecks };
            const kc1 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 1'));
            if (kc1 && updated[1]) {
              updated[1] = {
                ...updated[1],
                id: kc1.id,
                title: kc1.title,
                url: kc1.url,
                link: kc1.link,
                bpm: kc1.bpm,
                cuePoints: kc1.cuePoints,
                artworkUrl: kc1.artworkUrl
              };
            }
            const kc2 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 2'));
            if (kc2 && updated[2]) {
              updated[2] = {
                ...updated[2],
                id: kc2.id,
                title: kc2.title,
                url: kc2.url,
                link: kc2.link,
                bpm: kc2.bpm,
                cuePoints: kc2.cuePoints,
                artworkUrl: kc2.artworkUrl
              };
            }
            const kc3 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 3'));
            if (kc3 && updated[3]) {
              updated[3] = {
                ...updated[3],
                id: kc3.id,
                title: kc3.title,
                url: kc3.url,
                link: kc3.link,
                bpm: kc3.bpm,
                cuePoints: kc3.cuePoints,
                artworkUrl: kc3.artworkUrl
              };
            }
            const kc4 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 4'));
            if (kc4 && updated[4]) {
              updated[4] = {
                ...updated[4],
                id: kc4.id,
                title: kc4.title,
                url: kc4.url,
                link: kc4.link,
                bpm: kc4.bpm,
                cuePoints: kc4.cuePoints,
                artworkUrl: kc4.artworkUrl
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic mixes from Sanity, falling back to static database:', String(err));
      }
    }
    loadDynamicMixes();
  }, [setDecks]);

  return (
    <MixArchive 
      isDepth={isDepth} 
      activeView={activeView} 
      setActiveView={setActiveView}
      decks={decks}
      setDecks={setDecks}
      mixGroups={mixGroups}
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
