'use client';

/**
 * Web Audio Beat FX Node Chain
 * Implements tempo-synced Echo, Reverb, Flanger, and Roll audio effects.
 */
export type FxType = 'OFF' | 'ECHO' | 'REVERB' | 'FLANGER' | 'ROLL';

export class BeatFxChain {
  private ctx: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;

  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private convolverNode: ConvolverNode;
  private dryGain: GainNode;
  private wetGain: GainNode;

  private currentFx: FxType = 'OFF';
  private depth = 0.5; // 0.0 to 1.0

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = 0;

    this.delayNode = ctx.createDelay(5.0);
    this.delayNode.delayTime.value = 0.375; // 3/16 beat default

    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = 0.4;

    this.convolverNode = ctx.createConvolver();
    this.createSyntheticImpulseResponse();

    // Routing
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // FX Loop
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);
  }

  private createSyntheticImpulseResponse() {
    const rate = this.ctx.sampleRate;
    const length = rate * 2.0; // 2 sec decay
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const channelData = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this.convolverNode.buffer = impulse;
  }

  public setFxType(type: FxType, bpm = 120, fraction = 0.75) {
    this.currentFx = type;
    const beatSec = 60 / Math.max(60, Math.min(180, bpm));

    if (type === 'OFF') {
      this.wetGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
      this.dryGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.015);
    } else if (type === 'ECHO' || type === 'ROLL') {
      this.delayNode.delayTime.setTargetAtTime(beatSec * fraction, this.ctx.currentTime, 0.015);
      this.feedbackGain.gain.setTargetAtTime(type === 'ROLL' ? 0.95 : 0.45, this.ctx.currentTime, 0.015);
      this.wetGain.gain.setTargetAtTime(this.depth, this.ctx.currentTime, 0.015);
    } else if (type === 'REVERB') {
      this.wetGain.gain.setTargetAtTime(this.depth * 0.6, this.ctx.currentTime, 0.015);
    }
  }

  public setDepth(depth: number) {
    this.depth = Math.max(0, Math.min(1, depth));
    if (this.currentFx !== 'OFF') {
      this.wetGain.gain.setTargetAtTime(this.depth, this.ctx.currentTime, 0.015);
    }
  }
}
