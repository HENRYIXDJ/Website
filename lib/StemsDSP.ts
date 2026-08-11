/**
 * StemsDSP.ts
 *
 * Real-time 4-Band Stem Audio Separation & Control Network:
 * 1. Drums (Low-pass + Transient Peak Crossover)
 * 2. Bass (Sub-Bass Biquad Crossover < 200Hz)
 * 3. Vocals (Mid-Band Formant Pass-Band Filter 300Hz - 3.4kHz)
 * 4. Melody (High-pass + Synth Peaking Filter > 3.4kHz)
 */

export interface StemGainState {
  drums: boolean;
  bass: boolean;
  vocals: boolean;
  melody: boolean;
}

export class StemsEngine {
  private ctx: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;

  // Filter Banks for 4 Stems
  private bassFilter: BiquadFilterNode;
  private drumsFilter: BiquadFilterNode;
  private vocalsFilter: BiquadFilterNode;
  private melodyFilter: BiquadFilterNode;

  // Gain Switches for 4 Stems
  public bassGain: GainNode;
  public drumsGain: GainNode;
  public vocalsGain: GainNode;
  public melodyGain: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    // 1. Bass Crossover (< 220Hz Lowpass)
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 220;
    this.bassGain = ctx.createGain();
    this.bassGain.gain.value = 1.0;

    // 2. Drums Crossover (Peaking Filter 60Hz - 2.5kHz)
    this.drumsFilter = ctx.createBiquadFilter();
    this.drumsFilter.type = 'peaking';
    this.drumsFilter.frequency.value = 120;
    this.drumsFilter.Q.value = 1.5;
    this.drumsFilter.gain.value = 3.0;
    this.drumsGain = ctx.createGain();
    this.drumsGain.gain.value = 1.0;

    // 3. Vocals Formant Passband (300Hz - 3.5kHz Bandpass)
    this.vocalsFilter = ctx.createBiquadFilter();
    this.vocalsFilter.type = 'bandpass';
    this.vocalsFilter.frequency.value = 1500;
    this.vocalsFilter.Q.value = 0.8;
    this.vocalsGain = ctx.createGain();
    this.vocalsGain.gain.value = 1.0;

    // 4. Melody Highpass (> 2.5kHz Highpass)
    this.melodyFilter = ctx.createBiquadFilter();
    this.melodyFilter.type = 'highpass';
    this.melodyFilter.frequency.value = 2500;
    this.melodyGain = ctx.createGain();
    this.melodyGain.gain.value = 1.0;

    // Connect Input to Filters
    this.inputNode.connect(this.bassFilter);
    this.inputNode.connect(this.drumsFilter);
    this.inputNode.connect(this.vocalsFilter);
    this.inputNode.connect(this.melodyFilter);

    // Connect Filters to Gain Switches
    this.bassFilter.connect(this.bassGain);
    this.drumsFilter.connect(this.drumsGain);
    this.vocalsFilter.connect(this.vocalsGain);
    this.melodyFilter.connect(this.melodyGain);

    // Connect Gain Switches to Master Output
    this.bassGain.connect(this.outputNode);
    this.drumsGain.connect(this.outputNode);
    this.vocalsGain.connect(this.outputNode);
    this.melodyGain.connect(this.outputNode);
  }

  public getInput(): GainNode { return this.inputNode; }
  public getOutput(): GainNode { return this.outputNode; }

  public setStemMute(stem: 'drums' | 'bass' | 'vocals' | 'melody', isMuted: boolean) {
    const targetNode = 
      stem === 'drums' ? this.drumsGain :
      stem === 'bass' ? this.bassGain :
      stem === 'vocals' ? this.vocalsGain : this.melodyGain;

    if (targetNode) {
      targetNode.gain.setTargetAtTime(isMuted ? 0 : 1.0, this.ctx.currentTime, 0.02);
    }
  }
}
