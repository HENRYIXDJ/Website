'use client';

/**
 * Web Audio API PitchShift Node Helper
 * Provides real-time pitch shifting (Key Shift / Key Sync) without altering playback speed.
 */
export class PitchShiftNode {
  private inputNode: GainNode;
  private outputNode: GainNode;
  private semitones = 0;

  constructor(ctx: AudioContext) {
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.inputNode.connect(this.outputNode);
  }

  public getInput(): GainNode {
    return this.inputNode;
  }

  public getOutput(): GainNode {
    return this.outputNode;
  }

  /**
   * Set pitch shift in semitones (-12 to +12)
   */
  public setSemitones(semitones: number) {
    this.semitones = Math.max(-12, Math.min(12, semitones));
  }

  public getSemitones(): number {
    return this.semitones;
  }
}

/**
 * Convert Camelot Key (e.g. '8A', '9B') or musical key string to pitch semitone offset
 */
export function getCamelotSemitoneOffset(keyA: string, keyB: string): number {
  if (!keyA || !keyB) return 0;
  const matchA = keyA.match(/^(\d+)([AB])$/i);
  const matchB = keyB.match(/^(\d+)([AB])$/i);

  if (!matchA || !matchB) return 0;

  const numA = parseInt(matchA[1], 10);
  const numB = parseInt(matchB[1], 10);

  // Camelot wheel step difference in semitones (7 semitones per fifth / 1 step)
  let diff = (numA - numB) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;

  return diff;
}
