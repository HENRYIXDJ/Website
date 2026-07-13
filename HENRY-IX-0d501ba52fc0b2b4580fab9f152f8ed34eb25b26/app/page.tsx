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

  // Dynamically calculate the target scale and Y offset to match the SiteHeader
  const [targetDims, setTargetDims] = useState({ scale: 0.15, y: -300 });

  useEffect(() => {
    const calculateDims = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // The hero text uses text-[clamp(2rem,15vw,15vw)]
      // clamp(32px, 15vw, 15vw)
      const initialSize = Math.max(32, width * 0.15);
      
      // The header text uses text-2xl (24px) on mobile, text-3xl (30px) on desktop
      const targetSize = width < 768 ? 24 : 30;
      
      // Header is 96px tall (h-24) at the top of the screen. Its center is 48px from the top.
      const targetY = -(height / 2) + 48;

      setTargetDims({ scale: targetSize / initialSize, y: targetY });
    };

    calculateDims();
    window.addEventListener('resize', calculateDims);
    return () => window.removeEventListener('resize', calculateDims);
  }, []);

  // Hardware-accelerated parallax layers
  const yText = useTransform(smoothScrollY, [0, 800], [0, targetDims.y]);
  const scaleText = useTransform(smoothScrollY, [0, 800], [1, targetDims.scale]);
  // Keep opacity at 1 so it doesn't fade out and acts as the sticky header
  const opacityText = useTransform(smoothScrollY, [0, 800], [1, 1]);
  
  // Layered parallax background elements for 3D depth feeling
  const yFloatLeft = useTransform(smoothScrollY, [0, 1000], [0, -150]);
  const yFloatRight = useTransform(smoothScrollY, [0, 1000], [0, -220]);

  return (
    <section className="min-h-screen flex flex-col justify-center items-center w-full px-6 relative pt-20 overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
      
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

      {/* Social links have been extracted to SiteHeader */}

      <motion.div 
        className="fixed inset-0 flex justify-center items-center z-40 pointer-events-none"
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

const NavigationNode = React.memo(function NavigationNode() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative w-full overflow-hidden z-20" style={{ scrollSnapAlign: 'start' }}>
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
  );
});

export default function LandingPage() {
  const isDepth = true;
  const { preloaderComplete } = useAudio();

  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 20, mass: 0.2 });
  
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="relative w-full text-zinc-100 min-h-[200vh] overflow-x-hidden selection:bg-primary/30 selection:text-primary font-sans"
    >
      <HeroNode isDepth={isDepth} preloaderComplete={preloaderComplete} />
      <NavigationNode />
    </motion.main>
  );
}
