// --- ANALOG SYNTHESIZER UTILITIES (Web Audio API) ---

export const playClick = (freq = 800, type = 'sine', duration = 0.03) => {
  if (typeof window === 'undefined' || (window as any).isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Matrix Cyber Synth Voice: Detuned dual oscillator with pitch drop and resonant filter sweep
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Choose wave types based on requested tone
    if (type === 'sine' || type === 'triangle') {
      osc1.type = 'sine';
      osc2.type = 'triangle';
    } else {
      osc1.type = type as OscillatorType;
      osc2.type = 'square';
    }
    
    // Set frequency and glide down exponentially (alien laser blip)
    const endFreq = freq * 0.15;
    osc1.frequency.setValueAtTime(freq, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    
    osc2.frequency.setValueAtTime(freq * 1.018, ctx.currentTime); // detuned
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.018, ctx.currentTime + duration);
    
    // Cyber filter sweep (high Q resonance)
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(10, ctx.currentTime); // very sharp "matrixy" sweep
    filter.frequency.setValueAtTime(freq * 2.2, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 1.5, ctx.currentTime + duration);
    
    // Master volume envelope (louder and punchier)
    const initialVolume = (type === 'sine' || type === 'triangle') ? 0.075 : 0.055;
    gain.gain.setValueAtTime(initialVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    // Connect nodes
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {}
};

export const playTick = () => {
  if (typeof window === 'undefined' || (window as any).isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // High-pitched digital chime/tick with frequency modulation (FM) for alien matrixy chirp
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.022);
    
    mod.type = 'sawtooth';
    mod.frequency.setValueAtTime(950, ctx.currentTime);
    modGain.gain.setValueAtTime(500, ctx.currentTime); // massive frequency modulation!
    
    // Highpass filter for extra crispiness
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.022, ctx.currentTime); // Louder
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.022);
    
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    mod.start();
    osc.stop(ctx.currentTime + 0.022);
    mod.stop(ctx.currentTime + 0.022);
  } catch (e) {}
};

export const playDegauss = () => {
  if (typeof window === 'undefined' || (window as any).isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 0.95;
    
    // Sub-bass heavy drop
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + duration);
    subGain.gain.setValueAtTime(0.35, ctx.currentTime); // heavy bass
    subGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start();
    subOsc.stop(ctx.currentTime + duration);

    // Matrix glitch laser sweep
    const sweepOsc = ctx.createOscillator();
    const sweepOsc2 = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(1800, ctx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + duration);
    
    sweepOsc2.type = 'square';
    sweepOsc2.frequency.setValueAtTime(1820, ctx.currentTime); // Detuned
    sweepOsc2.frequency.exponentialRampToValueAtTime(45.5, ctx.currentTime + duration);
    
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(6, ctx.currentTime);
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);
    
    // Vibrating alien LFO (modulates volume to create a shivering texture)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(35, ctx.currentTime); // Fast shimmer
    lfoGain.gain.setValueAtTime(0.6, ctx.currentTime); // heavy modulation
    
    sweepGain.gain.setValueAtTime(0.08, ctx.currentTime); // Louder
    sweepGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    lfo.connect(lfoGain);
    lfoGain.connect(sweepGain.gain); // Modulate volume!
    
    sweepOsc.connect(filter);
    sweepOsc2.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    
    sweepOsc.start();
    sweepOsc2.start();
    lfo.start();
    sweepOsc.stop(ctx.currentTime + duration);
    sweepOsc2.stop(ctx.currentTime + duration);
    lfo.stop(ctx.currentTime + duration);
  } catch (e) {}
};

export const playLockoutBlip = () => {
  if (typeof window === 'undefined' || (window as any).isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 0.35;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(70, ctx.currentTime + duration);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(186, ctx.currentTime); // detuned
    osc2.frequency.linearRampToValueAtTime(71.5, ctx.currentTime + duration);
    
    filter.type = 'peaking';
    filter.Q.setValueAtTime(12, ctx.currentTime); // super resonant peak
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.09, ctx.currentTime); // Louder
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {}
};

export const playNavSwoosh = () => {
  if (typeof window === 'undefined' || (window as any).isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 0.55;
    
    // We create a noise buffer for a textured digital swoosh
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Sweeping bandpass filter to create swoosh movement
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, ctx.currentTime);
    filter.frequency.setValueAtTime(2500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch (e) {}
};

export const playTabClick = () => {
  if (typeof window === 'undefined' || (window as any).isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + duration); // Sweeps UP for a positive cyber click
    
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};
