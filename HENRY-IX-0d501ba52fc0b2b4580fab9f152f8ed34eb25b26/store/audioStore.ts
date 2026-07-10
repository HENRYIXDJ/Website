import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { trackWaveforms } from '@/app/trackWaveforms';
// useShallow is re-exported here so consumers can import from one place:
//   import { useAudioStore, useShallow } from '@/store/audioStore';
export { useShallow } from 'zustand/react/shallow';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeckState {
  id: string;
  title: string;
  url: string;
  link: string;
  bpm: number;
  isPlaying: boolean;
  isReady: boolean;
  scMode: boolean;
  pitch: number;
  progress: number;
  duration: number;
  volume: number;
  eqHi: number;
  eqMid: number;
  eqLow: number;
  filter: number;
  trim: number;
  syncEnabled: boolean;
  syncMode?: 'BEAT' | 'BPM';
  quantizeEnabled?: boolean;
  crossfaderAssign: 'L' | 'R' | 'THRU';
  waveformPeaks: number[];
  cuePoints?: number[];
  loopIn?: number | null;
  loopOut?: number | null;
  isLoopActive?: boolean;
  firstBeatOffset?: number;
}

export interface AudioStoreState {
  // Deck state (1–4)
  decks: Record<number, DeckState>;

  // Mixer
  crossfader: number;
  leftActiveDeck: 1 | 2;
  rightActiveDeck: 3 | 4;

  // UI / App state
  isMuted: boolean;
  preloaderComplete: boolean;
  audioDSPInitialized: boolean;

  // ---------- Actions ----------
  setDeck: (id: number, patch: Partial<DeckState>) => void;
  setCrossfader: (val: number) => void;
  setLeftActiveDeck: (val: 1 | 2) => void;
  setRightActiveDeck: (val: 3 | 4) => void;
  setIsMuted: (val: boolean) => void;
  setPreloaderComplete: (val: boolean) => void;
  setAudioDSPInitialized: (val: boolean) => void;

  // Legacy-compat: full decks setter (accepts updater fn or object)
  setDecks: (updater: Record<number, DeckState> | ((prev: Record<number, DeckState>) => Record<number, DeckState>)) => void;
}

// ---------------------------------------------------------------------------
// Static peak generator (fallback when no real waveform data exists)
// ---------------------------------------------------------------------------
const generateStaticPeaks = (num = 500): number[] => {
  const rawPeaks: number[] = [];
  const seed = 123;
  for (let i = 0; i < num; i++) {
    const progress = i / num;
    let envelope: number;
    let transientFrequency = 8;
    let transientStrength: number;
    let compressIntensity: number;

    const introLen = 0.15;
    const breakdownStart = 0.48;
    const breakdownLen = 0.16;
    const secondDropStart = breakdownStart + breakdownLen;
    const outroStart = 0.90;

    if (progress < introLen) {
      envelope = 0.25; transientFrequency = 16; transientStrength = 0.65; compressIntensity = 0.4;
    } else if (progress < breakdownStart - 0.08) {
      envelope = 0.7; transientFrequency = 8; transientStrength = 0.35; compressIntensity = 1.0;
    } else if (progress < breakdownStart) {
      const bp = (progress - (breakdownStart - 0.08)) / 0.08;
      envelope = 0.3 + 0.5 * bp;
      transientFrequency = bp > 0.75 ? 2 : bp > 0.4 ? 4 : 8;
      transientStrength = 0.3 + 0.35 * bp;
      compressIntensity = 0.6 + 0.4 * bp;
    } else if (progress < secondDropStart - 0.08) {
      const bkp = (progress - breakdownStart) / (breakdownLen - 0.08);
      envelope = 0.18 + 0.12 * Math.sin(bkp * Math.PI);
      transientFrequency = 32; transientStrength = 0.15; compressIntensity = 0.3;
    } else if (progress < secondDropStart) {
      const bp = (progress - (secondDropStart - 0.08)) / 0.08;
      envelope = 0.25 + 0.65 * bp;
      transientFrequency = bp > 0.8 ? 1 : bp > 0.5 ? 2 : 4;
      transientStrength = 0.2 + 0.5 * bp;
      compressIntensity = 0.5 + 0.5 * bp;
    } else if (progress < outroStart) {
      envelope = 0.85; transientFrequency = 8; transientStrength = 0.25; compressIntensity = 1.2;
    } else {
      const op = (progress - outroStart) / (1 - outroStart);
      envelope = 0.4 * (1 - op) + 0.05;
      transientFrequency = 16;
      transientStrength = 0.5 * (1 - op);
      compressIntensity = 0.4 * (1 - op);
    }

    const t1 = Math.sin(i * 0.47 + seed) * 0.15;
    const t2 = Math.cos(i * 0.93 - seed) * 0.10;
    const t3 = Math.sin(i * 3.17) * 0.06;
    const t4 = Math.sin(i * 9.71) * 0.04;
    const spectralNoise = t1 + t2 + t3 + t4;

    const isKick = (i % transientFrequency === 0);
    const kickTransient = isKick ? (transientStrength + 0.08 * Math.sin(i * 1.3)) : 0.0;
    let value = (envelope + spectralNoise) * compressIntensity + kickTransient;
    value += Math.sin(i * 0.015) * 0.05 + (Math.sin(i * 12.5) * 0.02);
    const compressed = value > 0.75 ? 0.75 + (value - 0.75) * 0.25 : value;
    rawPeaks.push(Math.max(0.02, Math.min(0.98, compressed)));
  }

  const smoothed: number[] = [];
  for (let i = 0; i < num; i++) {
    let sum = 0, count = 0;
    for (let w = -1; w <= 1; w++) {
      const idx = i + w;
      if (idx >= 0 && idx < num) { sum += rawPeaks[idx]; count++; }
    }
    smoothed.push(sum / count);
  }
  const maxVal = Math.max(...smoothed) || 1.0;
  return smoothed.map(p => p / maxVal);
};

// ---------------------------------------------------------------------------
// Initial deck data
// ---------------------------------------------------------------------------
const INITIAL_DECKS: Record<number, DeckState> = {
  1: {
    id: 'kc-1', title: 'Knight Club: Session 1',
    url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%201%20MP3.mp3',
    link: 'https://soundcloud.com/henryixdj/knight-club-session-1',
    bpm: 145, isPlaying: false, isReady: false, scMode: false, pitch: 0,
    progress: 0, duration: 0, volume: 80, eqHi: 50, eqMid: 50, eqLow: 50,
    filter: 50, trim: 50, syncEnabled: false, syncMode: 'BEAT', quantizeEnabled: true, crossfaderAssign: 'L',
    loopIn: null, loopOut: null, isLoopActive: false,
    waveformPeaks: trackWaveforms['kc-1'] ?? generateStaticPeaks(500),
    cuePoints: [0, 1127, 2112, 2772],
    firstBeatOffset: 0.0,
  },
  2: {
    id: 'kc-2', title: 'Knight Club: Session 2',
    url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%202%20MP3.mp3',
    link: 'https://soundcloud.com/henryixdj/knight-club-session-2',
    bpm: 152, isPlaying: false, isReady: false, scMode: false, pitch: 0,
    progress: 0, duration: 0, volume: 80, eqHi: 50, eqMid: 50, eqLow: 50,
    filter: 50, trim: 50, syncEnabled: false, syncMode: 'BEAT', quantizeEnabled: true, crossfaderAssign: 'L',
    loopIn: null, loopOut: null, isLoopActive: false,
    waveformPeaks: trackWaveforms['kc-2'] ?? generateStaticPeaks(500),
    firstBeatOffset: 0.0,
    cuePoints: [0, 2468, 4084, 6270],
  },
  3: {
    id: 'kc-3', title: 'Knight Club: Session 3',
    url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%203%20MP3.mp3',
    link: 'https://soundcloud.com/henryixdj/knight-club-session-3',
    bpm: 150, isPlaying: false, isReady: false, scMode: false, pitch: 0,
    progress: 0, duration: 0, volume: 80, eqHi: 50, eqMid: 50, eqLow: 50,
    filter: 50, trim: 50, syncEnabled: false, syncMode: 'BEAT', quantizeEnabled: true, crossfaderAssign: 'R',
    loopIn: null, loopOut: null, isLoopActive: false,
    waveformPeaks: trackWaveforms['kc-3'] ?? generateStaticPeaks(500),
    firstBeatOffset: 0.0,
    cuePoints: [0, 1940, 3685, 5509],
  },
  4: {
    id: 'kc-4', title: 'Knight Club: Session 4',
    url: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Knight%20Club%20Audio/Knight%20Club%20Session%204%20MP3.mp3',
    link: 'https://soundcloud.com/henryixdj/33baa30a-4980-40da-94c2-41085314ec43',
    bpm: 155, isPlaying: false, isReady: false, scMode: false, pitch: 0,
    progress: 0, duration: 0, volume: 80, eqHi: 50, eqMid: 50, eqLow: 50,
    filter: 50, trim: 50, syncEnabled: false, syncMode: 'BEAT', quantizeEnabled: true, crossfaderAssign: 'R',
    loopIn: null, loopOut: null, isLoopActive: false,
    waveformPeaks: trackWaveforms['kc-4'] ?? generateStaticPeaks(500),
    firstBeatOffset: 0.0,
    cuePoints: [0, 1834, 3582, 5552],
  },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useAudioStore = create<AudioStoreState>()(
  subscribeWithSelector((set, get) => ({
    decks: INITIAL_DECKS,
    crossfader: 50,
    leftActiveDeck: 1,
    rightActiveDeck: 3,
    isMuted: false,
    preloaderComplete: false,
    audioDSPInitialized: false,

    // Atomic deck patch — only touches the specified deck
    setDeck: (id, patch) =>
      set(s => ({
        decks: {
          ...s.decks,
          [id]: { ...s.decks[id], ...patch },
        },
      })),

    setCrossfader: val => set({ crossfader: val }),
    setLeftActiveDeck: val => set({ leftActiveDeck: val }),
    setRightActiveDeck: val => set({ rightActiveDeck: val }),
    setIsMuted: val => set({ isMuted: val }),
    setPreloaderComplete: val => set({ preloaderComplete: val }),
    setAudioDSPInitialized: val => set({ audioDSPInitialized: val }),

    // Legacy-compat: accepts an updater function or a plain object
    setDecks: updater => {
      if (typeof updater === 'function') {
        set(s => ({ decks: updater(s.decks) }));
      } else {
        set({ decks: updater });
      }
    },
  }))
);

// ---------------------------------------------------------------------------
// Convenience selector helpers
// ---------------------------------------------------------------------------

/** Returns the DeckState for a given deck id (stable — same object ref unless that deck changed). */
export const selectDeck = (id: number) => (s: AudioStoreState) => s.decks[id];

/** Primitive selectors — always pass strict equality without useShallow. */
export const selectCrossfader     = (s: AudioStoreState) => s.crossfader;
export const selectIsMuted        = (s: AudioStoreState) => s.isMuted;
export const selectLeftActiveDeck = (s: AudioStoreState) => s.leftActiveDeck;

/**
 * Returns the deck id (number | undefined) of the currently playing deck.
 * Returns a primitive so useAudioStore(selectActiveDeckId) never false-fires.
 */
export const selectActiveDeckId = (s: AudioStoreState): number =>
  [1, 2, 3, 4].find(id => s.decks[id]?.isPlaying) ?? s.leftActiveDeck ?? 1;

/**
 * Returns an object with active deck info.
 *
 * ⚠️  ALWAYS wrap with useShallow when using in a React component:
 *
 *   import { useAudioStore, selectActiveDeckInfo, useShallow } from '@/store/audioStore';
 *   const info = useAudioStore(useShallow(selectActiveDeckInfo));
 *
 * Without useShallow, Zustand's strict equality (old === new) will always
 * fail because a new object is allocated on every selector invocation,
 * causing unnecessary re-renders even when no values changed.
 */
export const selectActiveDeckInfo = (s: AudioStoreState) => {
  const playingId = [1, 2, 3, 4].find(id => s.decks[id]?.isPlaying);
  const deck = playingId ? s.decks[playingId] : s.decks[s.leftActiveDeck] ?? s.decks[1];
  return {
    id:        deck.id,
    title:     deck.title,
    isPlaying: deck.isPlaying,
    isReady:   deck.isReady,
    bpm:       deck.bpm,
    progress:  deck.progress,
    duration:  deck.duration,
  };
};

// Exported for use in AudioProvider (non-hook contexts)
export { generateStaticPeaks };
