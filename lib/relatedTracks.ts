'use client';

export interface TrackMeta {
  id: string;
  title: string;
  bpm: number;
  key?: string;
  url?: string;
  artworkUrl?: string;
}

/**
 * Intelligent Pro Audio Related Tracks Matching Engine
 * Ranks tracks based on BPM proximity (±5%) and Camelot key compatibility.
 */
export function getRelatedTracks(currentTrack: TrackMeta, catalog: TrackMeta[]): TrackMeta[] {
  if (!currentTrack || !catalog || catalog.length === 0) return [];

  const currentBpm = currentTrack.bpm || 120;
  const currentKey = currentTrack.key || '8A';

  return catalog
    .filter(t => t.id !== currentTrack.id)
    .map(track => {
      const bpmDiff = Math.abs((track.bpm || 120) - currentBpm) / currentBpm; // percentage difference
      const isCompatibleBpm = bpmDiff <= 0.08; // within ±8% BPM range

      const isExactKey = track.key === currentKey;
      const isHarmonicKey = checkHarmonicKeyMatch(currentKey, track.key || '');

      let score = 0;
      if (isExactKey) score += 50;
      else if (isHarmonicKey) score += 35;
      if (isCompatibleBpm) score += 50 - bpmDiff * 100;

      return { track, score };
    })
    .filter(item => item.score > 30)
    .sort((a, b) => b.score - a.score)
    .map(item => item.track);
}

function checkHarmonicKeyMatch(keyA: string, keyB: string): boolean {
  if (!keyA || !keyB) return false;
  const matchA = keyA.match(/^(\d+)([AB])$/i);
  const matchB = keyB.match(/^(\d+)([AB])$/i);
  if (!matchA || !matchB) return false;

  const numA = parseInt(matchA[1], 10);
  const letterA = matchA[2].toUpperCase();
  const numB = parseInt(matchB[1], 10);
  const letterB = matchB[2].toUpperCase();

  // Same key number, opposite mode (e.g. 8A <-> 8B)
  if (numA === numB) return true;

  // Adjacent key number, same mode (e.g. 8A <-> 7A or 9A)
  if (letterA === letterB && (Math.abs(numA - numB) === 1 || Math.abs(numA - numB) === 11)) return true;

  return false;
}
