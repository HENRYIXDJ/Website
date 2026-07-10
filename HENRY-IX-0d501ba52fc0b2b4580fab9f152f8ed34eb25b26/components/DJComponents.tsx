'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick, playTick, playDegauss } from '@/lib/audioUtils';
import { useAudio } from '@/components/AudioProvider';

// --- RETAIL RETRO CUSTOM COMPONENTS ---

export function SynthesizerKnob({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  unit = "" 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  min?: number; 
  max?: number; 
  unit?: string; 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(0);
  const valStart = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = e.clientY;
    valStart.current = value;
    document.body.style.cursor = 'ns-resize';
    playClick(900, 'sine', 0.02);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStart.current - e.clientY; // drag up to increase
      const range = max - min;
      const step = range / 200; // 200px drag for full scale
      const newValue = Math.min(max, Math.max(min, valStart.current + deltaY * step));
      onChange(Math.round(newValue));
      
      // Subtle pitch-blip when adjusting
      if (Math.round(newValue) !== value && Math.random() < 0.25) {
        playClick(400 + newValue * 4, 'sine', 0.01);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      playClick(700, 'sine', 0.02);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, value, onChange, min, max]);

  const rotation = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className="flex flex-col items-center gap-1 font-mono text-[9px] text-zinc-500">
      <span className="uppercase tracking-widest text-[8px]">{label}</span>
      <div 
        onMouseDown={handleMouseDown}
        className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center relative cursor-ns-resize shadow-inner select-none"
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.05)'
        }}
      >
        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow">
          <motion.div 
            style={{ rotate: rotation }}
            className="absolute top-1 bottom-1 w-1 flex justify-center origin-center pointer-events-none"
          >
            <div className="w-[1.5px] h-2 rounded-full bg-primary" />
          </motion.div>
        </div>
      </div>
      <span className="text-[8px] text-primary tracking-widest bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 font-mono">
        {value}{unit}
      </span>
    </div>
  );
}

interface RotaryKnobProps {
  label: string;
  value: number; // 0 to 100
  onChange: (val: number) => void;
  disabled?: boolean;
  colorClass?: string;
  size?: "sm" | "md" | "lg";
}

export function RotaryKnob({ label, value, onChange, disabled = false, colorClass = "border-primary", size = "md" }: RotaryKnobProps) {
  const rotationAngle = (value - 50) * 2.7; // 270 degree sweep from 7 to 5 o'clock
  const isSm = size === "sm";
  const isLg = size === "lg";
  
  return (
    <div className="flex flex-col items-center select-none cursor-pointer relative group">
      <span className={cn(
        "text-zinc-500 font-mono tracking-widest uppercase font-bold", 
        isSm ? "text-[5.5px] mb-0.5" : isLg ? "text-[8px] mb-1.5" : "text-[6.5px] mb-1"
      )}>
        {label}
      </span>
      
      <div className={cn(
        "relative flex items-center justify-center", 
        isSm ? "w-6 h-6" : isLg ? "w-11 h-11" : "w-8 h-8"
      )}>
        {/* Invisible range input overlaid exactly on the knob cap for 1:1 drag responsiveness */}
        <input 
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => {
            if (!disabled) {
              onChange(Number(e.target.value));
              if (Math.abs(Number(e.target.value) - 50) < 3) {
                playClick(880, 'sine', 0.004); // Noon snap tactile blip
              }
            }
          }}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        
        {/* Outer casing */}
        <div className={cn(
          "absolute inset-0 rounded-full border border-zinc-800 transition-all duration-300 pointer-events-none z-0",
          !disabled && `group-hover:shadow-[0_0_8px_rgba(211,15,49,0.1)]`
        )} />
        
        {/* Rotating dial body */}
        <motion.div 
          style={{ transform: `rotate(${rotationAngle}deg)` }}
          className={cn(
            "rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 border flex items-center justify-center shadow relative pointer-events-none z-10 transition-colors duration-300",
            isSm ? "w-5.5 h-5.5" : isLg ? "w-10 h-10" : "w-7.5 h-7.5",
            disabled ? "border-zinc-900" : "border-zinc-700"
          )}
        >
          {/* Active pointer tick marker */}
          <div className={cn(
            "absolute top-0.5 rounded-full",
            isSm ? "h-1.5 w-[1px]" : isLg ? "h-3 w-[2px] top-1" : "h-2 w-[1.5px]",
            disabled ? "bg-zinc-800" : "bg-primary shadow-[0_0_3px_#d8163f]"
          )} />
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
        </motion.div>
      </div>

      <span className={cn(
        "text-zinc-600 font-mono select-none font-bold",
        isLg ? "text-[7.5px] mt-1" : "text-[6px] mt-0.5"
      )}>
        {value === 50 ? "0" : value < 50 ? `-${Math.round((50 - value) / 5 * 1.2)}` : `+${Math.round((value - 50) / 5 * 1.2)}`}
      </span>
    </div>
  );
}

export function SplitFlapText({ text, active }: { text: string, active: boolean }) {
  const characters = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/:,.";
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (!active) {
      // Defer the clear so we're not calling setState synchronously in an effect body
      const t = setTimeout(() => setDisplayText(text.replace(/./g, " ")), 0);
      return () => clearTimeout(t);
    }

    let iterations = 0;
    const targetArray = text.split("");
    const currentArray = Array(targetArray.length).fill(" ");
    
    const interval = setInterval(() => {
      let completed = true;
      for (let i = 0; i < targetArray.length; i++) {
        if (currentArray[i] !== targetArray[i]) {
          completed = false;
          if (Math.random() < 0.15 || iterations > 8 + i * 2) {
            currentArray[i] = targetArray[i];
          } else {
            const randIndex = Math.floor(Math.random() * characters.length);
            currentArray[i] = characters[randIndex];
            if (Math.random() < 0.18) playTick();
          }
        }
      }

      setDisplayText(currentArray.join(""));
      iterations++;

      if (completed) {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [text, active]);

  return (
    <span className="font-mono inline-flex gap-[2px] select-none">
      {displayText.split("").map((char, idx) => (
        <span 
          key={idx}
          className="relative inline-flex items-center justify-center bg-zinc-950 border border-zinc-905 text-primary w-3.5 h-5.5 text-[10px] font-bold font-mono rounded"
          style={{
            boxShadow: 'inset 0 -1px 3px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.5)',
            textShadow: '0 0 2px rgba(216, 22, 63, 0.4)'
          }}
        >
          <span className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-900 border-b border-black/40" />
          <span className="z-10">{char}</span>
        </span>
      ))}
    </span>
  );
}

export function MuteSwitch({ isMuted, setIsMuted }: { isMuted: boolean; setIsMuted: (muted: boolean) => void }) {
  return (
    <motion.button
      onClick={() => {
        setIsMuted(!isMuted);
        if (isMuted) {
          playClick(800, 'sine', 0.05);
        } else {
          setTimeout(() => playClick(950, 'sine', 0.04), 50);
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "fixed top-4 md:top-8 right-4 md:right-8 z-50 p-2.5 rounded-lg border font-mono text-[9px] uppercase tracking-widest font-bold flex items-center gap-2 cursor-pointer transition-colors backdrop-blur-md bg-zinc-950/80 border-zinc-800 text-zinc-100 magnetic-snap shadow-[0_0_10px_rgba(0,0,0,0.5)]"
      )}
    >
      {isMuted ? (
        <>
          <VolumeX className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-primary tracking-widest text-[8px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">MUTED</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-500 tracking-widest text-[8px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/20">AUDIO_ON</span>
        </>
      )}
    </motion.button>
  );
}

export function CRTOverlay() {
  return (
    <>
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      <div className="crt-roll" aria-hidden="true" />
      <div className="vhs-glitch-bar" aria-hidden="true" />
    </>
  );
}

export function MagneticIcon({ Icon, href, isDepth, name }: { Icon: any, href: string, isDepth: boolean, name?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouse = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.4, y: y * 0.4 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onHoverStart={() => {
        setHovered(true);
        playClick(1000, 'sine', 0.01);
      }}
      onHoverEnd={() => setHovered(false)}
      animate={{ x: position.x, y: position.y }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: "spring", stiffness: 350, damping: 15, mass: 0.5 }}
      className={cn(
        "p-3 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-300 relative group magnetic-snap shadow-lg bg-zinc-950",
        isDepth ? "border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/50 shadow-[0_0_15px_rgba(0,0,0,0.8)]" : "border-zinc-200 text-zinc-700 hover:text-black hover:border-black"
      )}
    >
      <Icon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-[6deg]" />
      
      {/* Dynamic neon scanline indicator */}
      <AnimatePresence>
        {hovered && (
          <motion.div 
            layoutId="activeIndicator"
            className="absolute inset-0 rounded-xl bg-primary/5 border border-primary/20 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
      
      {/* Tooltip name */}
      {name && (
        <span className="absolute bottom-full mb-2 bg-zinc-950 border border-zinc-850 px-2 py-1 rounded text-[7.5px] font-mono tracking-widest text-primary uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none z-30 font-bold whitespace-nowrap shadow-xl">
          {name}
        </span>
      )}
    </motion.a>
  );
}

const logLines = [
  "SYSTEM: HENRYIX v9.42",
  "AUDIOCORE: SOUNDCLOUD_LINKED... OK",
  "DSP: MIXING_SYNC_ACTIVE... OK",
  "DEGAUSSING SCREEN..."
];

export function Preloader({ onComplete, onEnter }: { onComplete: () => void; onEnter?: () => void }) {
  const [stage, setStage] = useState(-1);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);

  useEffect(() => {
    if (stage !== 0) return;
    const t = setTimeout(() => {
      setStage(1);
      playClick(800, 'sine', 0.05);
    }, 2000);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 1) return;
    const t = setTimeout(() => {
      setStage(2);
      playClick(600, 'triangle', 0.08);
    }, 200);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 2) return;
    const t = setTimeout(() => {
      setStage(3);
    }, 150);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 3) return;

    let currentLineIdx = 0;
    let currentCharIdx = 0;
    let currentLogs: string[] = [""];

    const interval = setInterval(() => {
      if (currentLineIdx >= logLines.length) {
        clearInterval(interval);
        setStage(4);
        return;
      }

      const targetLine = logLines[currentLineIdx];
      
      if (currentCharIdx < targetLine.length) {
        currentLogs[currentLineIdx] = targetLine.substring(0, currentCharIdx + 1);
        setDisplayedLogs([...currentLogs]);
        currentCharIdx++;
        if (Math.random() < 0.75) playTick();
      } else {
        currentLineIdx++;
        currentCharIdx = 0;
        if (currentLineIdx < logLines.length) {
          currentLogs.push("");
        }
      }
    }, 10);

    return () => clearInterval(interval);
  }, [stage]); // logLines is a module-level constant — safe to omit

  useEffect(() => {
    if (stage !== 4) return;
    
    playDegauss();

    const t = setTimeout(() => {
      setStage(5);
      onComplete();
    }, 450);
    return () => clearTimeout(t);
  }, [stage, onComplete]);

  if (stage === 5) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-auto overflow-hidden font-mono"
      >
        {stage === -1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-[85vw] max-w-md p-8 bg-zinc-950 border border-primary/20 rounded-lg text-center flex flex-col items-center gap-6 relative shadow-[0_0_30px_rgba(216,22,63,0.15)] z-50"
          >
            <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center text-primary text-xl font-bold shadow-[0_0_10px_rgba(216,22,63,0.3)] select-none">
              !
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-primary font-bold tracking-widest text-sm uppercase">
                SENSORY WARNING
              </h3>
              <p className="text-zinc-400 text-[10px] md:text-xs leading-relaxed tracking-wider uppercase">
                THIS SITE UTILIZES HIGH-FREQUENCY CRT SCANLINE SWEEPS, RETRO GLITCH SCAN DEVIATIONS, AND FLASHING ANIMATIONS.
              </p>
            </div>

            <button
              onClick={() => {
                playClick(400, 'sawtooth', 0.08);
                if (onEnter) onEnter();
                setStage(0);
              }}
              className="px-6 py-2 border border-primary text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/10 transition-colors cursor-pointer select-none rounded bg-transparent active:scale-95"
            >
              ENTER KINGDOM
            </button>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div 
            animate={{ 
              scaleX: [0.1, 1, 0.95, 1],
              opacity: [0.3, 0.9, 0.7, 1] 
            }}
            transition={{ duration: 0.4 }}
            className="h-[2px] w-[80%] bg-cyan-100 shadow-[0_0_8px_#22d3ee] rounded"
          />
        )}

        {(stage === 2 || stage === 3) && (
          <motion.div
            initial={{ scaleY: 0.005, width: "80%" }}
            animate={{ 
              scaleY: 1, 
              width: "100%", 
              height: "100%" 
            }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="w-full h-full bg-zinc-950 p-6 flex flex-col justify-center items-center relative border border-zinc-900"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />
            <div className="w-[85vw] max-w-lg text-left text-primary text-xs md:text-sm font-semibold tracking-wider flex flex-col gap-2.5">
              {displayedLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-primary/50 font-bold">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              <span className="animate-pulse bg-primary w-2 h-4 inline-block mt-0.5" />
            </div>
          </motion.div>
        )}

        {stage === 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [1, 0.8, 1, 0.4, 0.8, 0],
              scaleY: [1, 0.05, 1, 0.01, 0],
              skewX: [0, 15, -15, 5, 0]
            }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="w-full h-full bg-cyan-100 shadow-[inset_0_0_100px_#22d3ee] z-50 flex items-center justify-center"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface LEDEqualizerProps {
  isPlaying: boolean;
  bpm: number;
  eqHi?: number;
  eqMid?: number;
  eqLow?: number;
}

export function LEDEqualizer({ 
  isPlaying, 
  bpm, 
  eqHi = 50, 
  eqMid = 50, 
  eqLow = 50 
}: LEDEqualizerProps) {
  const [leftVU, setLeftVU] = useState<number>(0);
  const [rightVU, setRightVU] = useState<number>(0);
  const [waveform, setWaveform] = useState<number[]>(Array(24).fill(2));

  const { analyserNode } = useAudio() ?? {};
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    if (!analyserNode) return;
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }

    let frame: number;

    const animate = (timestamp: number) => {
      const dataArray = dataArrayRef.current;
      if (isPlaying && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);

        let bassSum = 0;
        for (let i = 0; i < Math.min(10, dataArray.length); i++) bassSum += dataArray[i];
        const averageBass = bassSum / Math.min(10, dataArray.length);
        const vuLevel = Math.min(8, Math.max(1, Math.floor((averageBass / 255) * 8.5)));
        setLeftVU(vuLevel);
        setRightVU(vuLevel);

        if (timestamp - lastScrollTimeRef.current > 33) {
          lastScrollTimeRef.current = timestamp;
          setWaveform((prev) => {
            const next = [...prev.slice(1)];
            let midSum = 0;
            for (let i = 10; i < Math.min(30, dataArray.length); i++) midSum += dataArray[i];
            const energy = ((averageBass * 0.7) + ((midSum / Math.max(1, Math.min(20, dataArray.length - 10))) * 0.3)) / 255;
            next.push(Math.max(1.5, energy * 12));
            return next;
          });
        }
      } else {
        setLeftVU(1);
        setRightVU(1);
        if (timestamp - lastScrollTimeRef.current > 33) {
          lastScrollTimeRef.current = timestamp;
          setWaveform((prev) => [...prev.slice(1), 1.5]);
        }
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [analyserNode, isPlaying]);

  return (
    <div className="flex gap-2 items-center h-16 bg-zinc-950 p-1 rounded border border-zinc-900 shadow-inner w-full justify-between relative overflow-hidden select-none">
      {/* Grid Scanlines Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(216,22,63,0.06)_95%)] bg-[size:100%_4px] pointer-events-none z-20" />
      
      {/* Subtle screen glow */}
      <div className="absolute inset-0 bg-primary/2 pointer-events-none z-10" />

      {/* LEFT CH VU LEVEL METER */}
      <div className="flex flex-col gap-[0.5px] h-full w-1.5 justify-end relative z-10 select-none shrink-0">
        {Array.from({ length: 8 }).map((_, segmentIdx) => {
          const indexFromBottom = 7 - segmentIdx;
          const isActive = indexFromBottom < leftVU;
          
          let colorClass = "bg-zinc-900 border-zinc-950";
          if (isActive) {
            if (indexFromBottom >= 7) colorClass = "bg-primary border-primary shadow-[0_0_3px_#d8163f]";
            else if (indexFromBottom >= 5) colorClass = "bg-yellow-500 border-yellow-500 shadow-[0_0_3px_#eab308]";
            else colorClass = "bg-emerald-500 border-emerald-500 shadow-[0_0_3px_#10b981]";
          }

          return (
            <div 
              key={segmentIdx} 
              className={cn("w-full h-1 rounded-sm border-[0.5px] transition-all duration-75", colorClass)}
            />
          );
        })}
        <span className="text-[5px] text-zinc-600 font-mono text-center mt-0.5 leading-none font-bold">L</span>
      </div>

      {/* CENTRAL WAVEFORM MONITOR */}
      <div className="flex-grow flex flex-col justify-between h-full bg-zinc-950/65 px-2 py-1 relative border-l border-r border-zinc-900/60 overflow-hidden mx-1 rounded-sm">
        {/* Neon screen grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:12px_12px]" />
        
        {/* Dynamic horizontal waveform track bars */}
        <div className="flex items-center gap-[3px] w-full h-[75%] justify-center relative mt-0.5">
          {/* Timeline Center Guideline */}
          <div className="absolute left-0 right-0 h-[1px] bg-zinc-900/80 z-0" />
          
          {waveform.map((height, idx) => (
            <div key={idx} className="flex-grow flex items-center justify-center h-full relative z-10">
              <div 
                className={cn(
                  "w-full rounded-sm transition-all duration-75",
                  isPlaying 
                    ? "bg-primary shadow-[0_0_4px_#d8163f]" 
                    : "bg-zinc-800 border border-zinc-900"
                )}
                style={{
                  height: `${Math.min(100, Math.max(8, height * 8.5))}%`
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Dynamic status readouts */}
        <div className="flex justify-between items-center text-[5.5px] font-mono tracking-widest text-zinc-500 uppercase pb-0.5 relative z-10">
          <span>BPM {isPlaying ? Math.round(bpm) : "OFF"}</span>
          <span className="text-primary animate-pulse">{isPlaying ? "GRID_SYNC" : "STANDBY"}</span>
          <span>{isPlaying ? `HI_${eqHi} MID_${eqMid} LOW_${eqLow}` : "SYS_READY"}</span>
        </div>
      </div>

      {/* RIGHT CH VU LEVEL METER */}
      <div className="flex flex-col gap-[0.5px] h-full w-1.5 justify-end relative z-10 select-none shrink-0">
        {Array.from({ length: 8 }).map((_, segmentIdx) => {
          const indexFromBottom = 7 - segmentIdx;
          const isActive = indexFromBottom < rightVU;
          
          let colorClass = "bg-zinc-900 border-zinc-950";
          if (isActive) {
            if (indexFromBottom >= 7) colorClass = "bg-primary border-primary shadow-[0_0_3px_#d8163f]";
            else if (indexFromBottom >= 5) colorClass = "bg-yellow-500 border-yellow-500 shadow-[0_0_3px_#eab308]";
            else colorClass = "bg-emerald-500 border-emerald-500 shadow-[0_0_3px_#10b981]";
          }

          return (
            <div 
              key={segmentIdx} 
              className={cn("w-full h-1 rounded-sm border-[0.5px] transition-all duration-75", colorClass)}
            />
          );
        })}
        <span className="text-[5px] text-zinc-600 font-mono text-center mt-0.5 leading-none font-bold">R</span>
      </div>
    </div>
  );
}
