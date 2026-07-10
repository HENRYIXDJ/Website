'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/components/AudioProvider';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from 'next/link';
import { playClick, playTick, playNavSwoosh } from '@/lib/audioUtils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

const HeroNode = React.memo(function HeroNode({ 
  isDepth,
  preloaderComplete
}: { 
  isDepth: boolean; 
  preloaderComplete: boolean;
}) {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 20, mass: 0.2 });
  
  // Hardware-accelerated parallax layers
  const yText = useTransform(smoothScrollY, [0, 1000], [0, -350]);
  const scaleText = useTransform(smoothScrollY, [0, 800], [1, 0.82]);
  const opacityText = useTransform(smoothScrollY, [0, 600], [1, 0]);
  
  // Layered parallax background elements for 3D depth feeling
  const yBackgroundRing = useTransform(smoothScrollY, [0, 1000], [0, 180]);
  const yBackgroundGrid = useTransform(smoothScrollY, [0, 1000], [0, -80]);
  const rotateRing = useTransform(smoothScrollY, [0, 1000], [0, 45]);
  const yFloatLeft = useTransform(smoothScrollY, [0, 1000], [0, -150]);
  const yFloatRight = useTransform(smoothScrollY, [0, 1000], [0, -220]);

  return (
    <section className="min-h-screen flex flex-col justify-center items-center w-full px-6 relative pt-20 overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
      
      {/* Dynamic Parallax Background Grid */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0 opacity-5"
        style={{ y: yBackgroundGrid, willChange: "transform" }}
      >
        <div className="w-full h-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:5rem_5rem]" />
      </motion.div>

      {/* Premium Parallax Background Rings */}
      <motion.div
        className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none"
        style={{ y: yBackgroundRing, rotate: rotateRing, willChange: "transform" }}
      >
        <div className="w-[80vw] h-[80vw] border border-primary rounded-full absolute" />
        <div className="w-[60vw] h-[60vw] border border-dashed border-primary rounded-full absolute" />
      </motion.div>

      {/* Foreground decorative floating elements (Negative Parallax for high-end 3D depth) */}
      <motion.div 
        className="absolute bottom-1/4 left-8 md:left-16 font-mono text-[10px] tracking-[0.2em] opacity-20 text-primary z-10 select-none pointer-events-none hidden sm:flex flex-col gap-1.5"
        style={{ y: yFloatLeft, willChange: "transform" }}
      >
        <span>SYS_STATUS: ACTIVE</span>
        <span>LATENCY: 0.00ms</span>
        <span>REFRESH: 144HZ</span>
      </motion.div>

      <motion.div 
        className="absolute top-1/4 right-8 md:right-16 font-mono text-[10px] tracking-[0.2em] opacity-20 text-primary z-10 select-none pointer-events-none hidden sm:flex flex-col gap-1.5"
        style={{ y: yFloatRight, willChange: "transform" }}
      >
        <span>LOC: LONDON, UK</span>
        <span>COORD_X: 51.5074° N</span>
        <span>COORD_Y: 0.1278° W</span>
      </motion.div>

      {/* Sleek Floating Social HUD */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={preloaderComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.9 }}
        className="absolute top-8 md:top-10 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-30 flex items-center gap-3 md:gap-4 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-zinc-400 select-none whitespace-nowrap"
      >
        <a 
          href="https://www.facebook.com/HenryIXDJ/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          onMouseEnter={() => playTick()}
          onClick={() => playClick(800, 'sine', 0.03)}
        >
          <span className="hidden md:inline">FACEBOOK</span>
          <span className="md:hidden">FB</span>
        </a>
        <span className="text-zinc-800 font-light">/</span>
        <a 
          href="https://www.instagram.com/henryixdj/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          onMouseEnter={() => playTick()}
          onClick={() => playClick(800, 'sine', 0.03)}
        >
          <span className="hidden md:inline">INSTAGRAM</span>
          <span className="md:hidden">IG</span>
        </a>
        <span className="text-zinc-800 font-light">/</span>
        <a 
          href="https://soundcloud.com/henryixdj" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          onMouseEnter={() => playTick()}
          onClick={() => playClick(800, 'sine', 0.03)}
        >
          <span className="hidden md:inline">SOUNDCLOUD</span>
          <span className="md:hidden">SC</span>
        </a>
        <span className="text-zinc-800 font-light">/</span>
        <a 
          href="https://www.mixcloud.com/HenryIXDJ/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          onMouseEnter={() => playTick()}
          onClick={() => playClick(800, 'sine', 0.03)}
        >
          <span className="hidden md:inline">MIXCLOUD</span>
          <span className="md:hidden">MC</span>
        </a>
        <span className="text-zinc-800 font-light">/</span>
        <a 
          href="https://www.tiktok.com/@henryixdj" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          onMouseEnter={() => playTick()}
          onClick={() => playClick(800, 'sine', 0.03)}
        >
          <span className="hidden md:inline">TIKTOK</span>
          <span className="md:hidden">TT</span>
        </a>
        <span className="text-zinc-800 font-light">/</span>
        <a 
          href="https://www.youtube.com/@HenryIXDJ" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          onMouseEnter={() => playTick()}
          onClick={() => playClick(800, 'sine', 0.03)}
        >
          <span className="hidden md:inline">YOUTUBE</span>
          <span className="md:hidden">YT</span>
        </a>
      </motion.div>

      <motion.div 
        className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none"
        style={{ y: yText, scale: scaleText, opacity: opacityText, willChange: "transform, opacity" }}
      >
        <motion.h1 
          className="glitch font-sans text-[clamp(2rem,15vw,15vw)] w-full font-bold tracking-wider leading-none text-center select-none text-primary whitespace-nowrap magnetic-snap"
          data-text="HENRY IX"
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={preloaderComplete ? { y: 0, opacity: 1, scale: 1 } : { y: 100, opacity: 0, scale: 0.95 }}
          style={{ willChange: "transform, opacity" }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
        >
          HENRY IX
        </motion.h1>
      </motion.div>

      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={preloaderComplete ? { opacity: 0.4, y: 0 } : { opacity: 0, y: 20 }}
         transition={{ ...SPRING_CONFIG, delay: 1.2 }}
         whileHover={{ opacity: 1, y: 5 }}
         className="absolute bottom-20 font-mono text-xs tracking-widest uppercase flex flex-col items-center gap-2 cursor-pointer z-10 magnetic-snap"
         onClick={() => {
           window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
         }}
      >
         <span>Enter Kingdom</span>
         <motion.div 
           animate={{ scaleY: [1, 1.5, 1] }} 
           transition={{ duration: 2, repeat: Infinity, ease: "anticipate" }}
           className="flex justify-center items-start origin-top h-8"
         >
           <div className={cn("w-[1px] h-full", isDepth ? "bg-zinc-500" : "bg-black")} />
         </motion.div>
      </motion.div>
    </section>
  );
});

// Scroll-triggered stagger entry variants
const navContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    }
  }
};

const navItemVariants = {
  hidden: { opacity: 0, y: 60, skewY: 4 },
  show: { 
    opacity: 1, 
    y: 0, 
    skewY: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 14,
      mass: 0.8
    }
  }
};

export default function LandingPage() {
  const isDepth = true;
  const { preloaderComplete } = useAudio();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="relative w-full bg-black text-zinc-100 min-h-[200vh] overflow-x-hidden selection:bg-primary/30 selection:text-primary font-sans"
    >
      <HeroNode isDepth={isDepth} preloaderComplete={preloaderComplete} />

      {/* ── FULLSCREEN SECTION NAVIGATOR ── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative w-full overflow-hidden bg-black z-20" style={{ scrollSnapAlign: 'start' }}>
        
        {/* CDJ Teaser Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden mix-blend-screen">
            <div className="w-[120vw] h-[120vw] border-[1px] border-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_60s_linear_infinite]" />
            <div className="w-[100vw] h-[100vw] border-[1px] border-dashed border-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite_reverse]" />
            <div className="w-[80vw] h-[80vw] border-[2px] border-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Dynamic Background Grid matching Section 1 */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-5">
          <div className="w-full h-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:5rem_5rem]" />
        </div>

        <motion.nav 
          variants={navContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-100px" }}
          className="flex flex-col items-center gap-6 md:gap-10 w-full px-6 max-w-4xl mx-auto z-10 relative"
        >
          {[
            { label: 'MIXES', href: '/mixes', desc: 'Enter the CDJ Portfolio' },
            { label: 'GALLERY', href: '/gallery', desc: 'Visual Archives' },
            { label: 'EVENTS', href: '/events', desc: 'Upcoming Shows' },
            { label: 'CONTACT', href: '/contact', desc: 'Bookings & Info' },
          ].map(({ label, href, desc }) => (
            <motion.div
              key={label}
              variants={navItemVariants}
              className="w-full text-center relative"
            >
              <Link
                href={href}
                className="group block w-full text-center relative"
                onMouseEnter={() => playTick()}
                onClick={() => playNavSwoosh()}
              >
                <span
                  className="glitch font-sans font-bold text-primary text-[clamp(2.5rem,10vw,8rem)] leading-none tracking-wider uppercase select-none transition-all duration-300 group-hover:tracking-[0.15em] inline-block"
                  data-text={label}
                >
                  {label}
                </span>
                <div className="h-0 group-hover:h-6 overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100 mt-2">
                  <span className="font-mono text-zinc-500 text-xs tracking-[0.3em] uppercase">{desc}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.nav>
      </section>
    </motion.main>
  );
}
