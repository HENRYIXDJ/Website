import { getStorageUrl } from '@/lib/storage';

export const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const formatPlayheadTime = (secs: number) => {
  if (isNaN(secs) || secs === undefined) return "00:00.00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const f = Math.floor((secs % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${f.toString().padStart(2, '0')}`;
};

export const proxyUrl = (url: string) => `/api/assets?url=${encodeURIComponent(url)}`;

export const getSessionImage = (title: string, artworkUrl?: string) => {
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

export const getTrackDescription = (title: string, isLocalFile: boolean) => {
  const lower = title.toLowerCase();
  if (lower.includes('knight club')) return "Born to jest, forced to Joust.";
  if (lower.includes('royal court')) return "Lose your mind in The Great Hall.";
  if (lower.includes('corner new cross')) return "Recorded live. A past residency.";
  return `Recorded live. Features high quality uncompressed audio ${isLocalFile ? "directly from the studio." : "via SoundCloud Integration."}`;
};

export function parseTracklist(text: string) {
  if (!text) return [];
  const lines = text.split('\n');
  return lines
    .map(line => {
      const timestampMatch = line.match(/(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?/);
      if (timestampMatch) {
        const fullMatch = timestampMatch[0];
        const m = parseInt(timestampMatch[1], 10);
        const s = parseInt(timestampMatch[2], 10);
        const h = timestampMatch[3] ? parseInt(timestampMatch[3], 10) : 0;
        const seconds = h * 3600 + m * 60 + s;
        return {
          isTimestamp: true,
          text: line.replace(fullMatch, '').trim().replace(/^[:-]\s*/, ''),
          timestampText: fullMatch,
          seconds,
        };
      }
      return {
        isTimestamp: false,
        text: line.trim(),
        timestampText: '',
        seconds: 0,
      };
    })
    .filter(item => item.text.length > 0 || item.isTimestamp);
}

export const STATIC_MIX_GROUPS = [
  {
    title: "Knight Club",
    mixes: [
      { id: 'kc-1', title: 'Knight Club: Session 1', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%201%20-%20Mastered%20High%20Quality.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-1', bpm: 145, isLocalFile: true, cuePoints: [0, 1127, 2112, 2772], firstBeatOffset: 0.413793 },
      { id: 'kc-2', title: 'Knight Club: Session 2', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%202%20-%20Mastered.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-2', bpm: 152, isLocalFile: true, cuePoints: [0, 2468, 4084, 6270], firstBeatOffset: 0.394737 },
      { id: 'kc-3', title: 'Knight Club: Session 3', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%203%20-%20Mastered.mp3')), link: 'https://soundcloud.com/henryixdj/knight-club-session-3', bpm: 150, isLocalFile: true, cuePoints: [0, 1940, 3685, 5509] },
      { id: 'kc-4', title: 'Knight Club: Session 4', url: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Audio/Knight%20Club%20Session%204%20MP3.mp3')), link: 'https://soundcloud.com/henryixdj/33baa30a-4980-40da-94c2-41085314ec43', bpm: 155, isLocalFile: true, cuePoints: [0, 1834, 3582, 5552] },
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

export const getWaveformHeight = (trackId: string, idx: number, duration = 300) => {
  if (!trackId) return 0.02;
  
  const barTime = idx / 14;
  const progress = Math.max(0, Math.min(1, barTime / duration));
  
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash << 5) - hash + trackId.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  
  const introLen = 0.1 + (seed % 5) * 0.02;
  const breakdownStart = 0.45 + ((seed >> 2) % 5) * 0.03;
  const breakdownLen = 0.12 + ((seed >> 4) % 4) * 0.03;
  const secondDropStart = breakdownStart + breakdownLen;
  const outroStart = 0.85 + ((seed >> 6) % 3) * 0.03;
  
  let envelope = 0.15;
  let transientFrequency = 8;
  let transientStrength = 0.4;
  let compressIntensity = 1.0;
  
  if (progress < introLen) {
    envelope = 0.25;
    transientFrequency = 14;
    transientStrength = 0.65;
    compressIntensity = 0.4;
  } else if (progress < breakdownStart - 0.08) {
    envelope = 0.7;
    transientFrequency = 7;
    transientStrength = 0.35;
    compressIntensity = 1.0;
  } else if (progress < breakdownStart) {
    const buildProgress = (progress - (breakdownStart - 0.08)) / 0.08;
    envelope = 0.3 + 0.5 * buildProgress;
    transientFrequency = buildProgress > 0.75 ? 2 : buildProgress > 0.4 ? 4 : 7;
    transientStrength = 0.3 + 0.35 * buildProgress;
    compressIntensity = 0.6 + 0.4 * buildProgress;
  } else if (progress < secondDropStart - 0.08) {
    const breakProgress = (progress - breakdownStart) / (breakdownLen - 0.08);
    envelope = 0.18 + 0.12 * Math.sin(breakProgress * Math.PI);
    transientFrequency = 28;
    transientStrength = 0.15;
    compressIntensity = 0.3;
  } else if (progress < secondDropStart) {
    const buildProgress = (progress - (secondDropStart - 0.08)) / 0.08;
    envelope = 0.25 + 0.65 * buildProgress;
    transientFrequency = buildProgress > 0.8 ? 1 : buildProgress > 0.5 ? 2 : 4;
    transientStrength = 0.2 + 0.5 * buildProgress;
    compressIntensity = 0.5 + 0.5 * buildProgress;
  } else if (progress < outroStart) {
    envelope = 0.85;
    transientFrequency = 7;
    transientStrength = 0.25;
    compressIntensity = 1.2;
  } else {
    const outroProgress = (progress - outroStart) / (1 - outroStart);
    envelope = 0.4 * (1 - outroProgress) + 0.05;
    transientFrequency = 14;
    transientStrength = 0.5 * (1 - outroProgress);
    compressIntensity = 0.4 * (1 - outroProgress);
  }
  
  const t1 = Math.sin(idx * 0.47 + seed) * 0.15;
  const t2 = Math.cos(idx * 0.93 - seed) * 0.10;
  const t3 = Math.sin(idx * 3.17 + (seed % 10)) * 0.06;
  const t4 = Math.sin(idx * 9.71) * 0.04;
  const spectralNoise = t1 + t2 + t3 + t4;
  
  const isKick = (idx % transientFrequency === 0);
  const kickTransient = isKick ? (transientStrength + 0.08 * Math.sin(idx * 1.3)) : 0.0;
  
  let value = (envelope + spectralNoise) * compressIntensity + kickTransient;
  
  const organicJitter = Math.sin(idx * 0.015) * 0.05 + (Math.sin(idx * 12.5) * 0.02);
  value += organicJitter;
  
  const compressed = value > 0.75 
    ? 0.75 + (value - 0.75) * 0.25
    : value;
    
  return Math.max(0.02, Math.min(0.98, compressed));
};
