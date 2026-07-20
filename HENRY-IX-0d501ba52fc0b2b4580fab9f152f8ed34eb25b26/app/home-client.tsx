'use client';
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent, animate } from 'framer-motion';
import { useAudioStore } from '@/store/audioStore';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from 'next/link';
import { playTick, playNavSwoosh } from '@/lib/audioUtils';

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
  const smoothScrollY = useSpring(scrollY, { stiffness: 250, damping: 30, mass: 0.1 });

  // Dynamically calculate the target scale and Y offset to match the SiteHeader
  const [targetDims, setTargetDims] = useState({ scale: 0.15, y: -300, range: 800 });

  useEffect(() => {
    const calculateDims = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Match the mobile and desktop font-size clamps
      const initialSize = width < 768 
        ? Math.max(51.2, Math.min(height * 0.15, width * 0.18)) 
        : Math.max(80, Math.min(height * 0.22, width * 0.24));
      
      // The header text uses text-2xl (24px) on mobile, text-3xl (30px) on desktop
      const targetSize = width < 768 ? 24 : 30;
      
      // Mobile header is 48px tall (h-12) -> center is 24px. Desktop header is 96px tall (h-24) -> center is 48px.
      const targetY = width < 768 
        ? -(height / 2) + 24 
        : -(height / 2) + 48;

      setTargetDims({ scale: targetSize / initialSize, y: targetY, range: height });
    };

    calculateDims();
    window.addEventListener('resize', calculateDims);
    return () => window.removeEventListener('resize', calculateDims);
  }, []);

  const [isBigText, setIsBigText] = useState(true);
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsBigText(latest < 100);
  });

  // Hardware-accelerated parallax layers
  const opacityEnterKingdom = useTransform(scrollY, [0, 200], [1, 0]);
  const yText = useTransform(smoothScrollY, [0, targetDims.range], [0, targetDims.y]);
  const scaleText = useTransform(smoothScrollY, [0, targetDims.range], [1, targetDims.scale]);
  // Keep opacity at 1 so it doesn't fade out and acts as the sticky header
  const opacityText = useTransform(scrollY, [0, targetDims.range], [1, 1]);
  
  // Layered parallax background elements for 3D depth feeling
  const yFloatLeft = useTransform(smoothScrollY, [0, targetDims.range + 200], [0, -150]);
  const yFloatRight = useTransform(smoothScrollY, [0, targetDims.range + 200], [0, -220]);

  const styleText = { y: yText, scale: scaleText, opacity: opacityText, willChange: "transform, opacity" };
  const styleFloatLeft = { y: yFloatLeft, willChange: "transform" };
  const styleFloatRight = { y: yFloatRight, willChange: "transform" };

  return (
    <section className="min-h-[100dvh] flex flex-col justify-center items-center w-full px-6 relative pt-20 overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
      
      {/* Foreground decorative floating elements (Negative Parallax for high-end 3D depth) */}
      <motion.div 
        className="absolute bottom-1/4 left-8 md:left-16 font-mono text-[10px] tracking-[0.2em] opacity-20 text-primary z-10 select-none pointer-events-none hidden sm:flex flex-col gap-1.5"
        style={styleFloatLeft}
      >
        <span>SYS_STATUS: ACTIVE</span>
        <span>REFRESH: 144HZ</span>
      </motion.div>

      <motion.div 
        className="absolute top-1/4 right-8 md:right-16 font-mono text-[10px] tracking-[0.2em] opacity-20 text-primary z-10 select-none pointer-events-none hidden sm:flex flex-col gap-1.5"
        style={styleFloatRight}
      >
        <span>LOC: LONDON, UK</span>
        <span>COORD_X: 51.5074° N</span>
        <span>COORD_Y: 0.1278° W</span>
      </motion.div>

      {/* Social links have been extracted to SiteHeader */}

      <motion.div 
        className="fixed inset-0 flex justify-center items-center z-40 pointer-events-none"
        style={styleText}
      >
        <motion.h1 
          className="glitch font-sans text-[clamp(3.2rem,15vh,18vw)] md:text-[clamp(5rem,22vh,24vw)] w-full font-bold tracking-wider leading-none text-center select-none text-primary whitespace-nowrap magnetic-snap cursor-pointer pointer-events-auto"
          onClick={() => {
            if (isBigText) {
              window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          data-text="HENRY IX"
          initial={{ y: 100, opacity: 0, scale: 0.95, x: 0 }}
          animate={preloaderComplete ? { y: 0, opacity: 1, scale: 1, x: 0 } : { y: 100, opacity: 0, scale: 0.95, x: 0 }}
          style={{ willChange: "transform, opacity" }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
        >
          HENRY IX
        </motion.h1>
      </motion.div>

      <motion.div 
        style={{ opacity: opacityEnterKingdom, willChange: 'opacity' }} 
        className="absolute bottom-20 z-10 w-full flex justify-center pointer-events-none"
      >
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={preloaderComplete ? { opacity: 0.4, y: 0 } : { opacity: 0, y: 20 }}
           transition={{ ...SPRING_CONFIG, delay: 1.2 }}
           whileHover={{ opacity: 1, y: 5 }}
           className="font-mono text-xs tracking-widest uppercase flex flex-col items-center gap-2 cursor-pointer magnetic-snap pointer-events-auto"
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
    <section className="min-h-[100dvh] flex flex-col items-center justify-center pt-24 pb-8 relative w-full overflow-hidden z-20" style={{ scrollSnapAlign: 'start' }}>
      <motion.nav 
        variants={navContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, margin: "-100px" }}
        className="flex flex-col items-center gap-[4vh] w-full px-6 max-w-4xl mx-auto z-10 relative"
      >
        {[
          { label: 'MIXES', href: '/mixes', desc: 'Enter the CDJ Portfolio' },
          { label: 'GALLERY', href: '/gallery', desc: 'Visual Archives' },
          { label: 'LIVE', href: '/live', desc: 'Watch Broadcast Transmissions' },
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
                className="glitch font-sans font-bold text-primary text-[clamp(2.5rem,8.5vh,10.5vw)] leading-none tracking-wider uppercase select-none inline-block"
                data-text={label}
              >
                {label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.nav>
    </section>
  );
});

export default function HomeClient() {
  const isDepth = true;
  const preloaderComplete = useAudioStore(s => s.preloaderComplete);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let isAnimating = false;
    let currentSection = 0; // 0 = Hero, 1 = Tabs
    let activeAnimation: any = null;

    // Keep track of scroll position to sync if the user scrolls using scrollbar or keyboard
    const syncSection = () => {
      if (isAnimating) return;
      const threshold = window.innerHeight / 2;
      currentSection = window.scrollY > threshold ? 1 : 0;
    };
    window.addEventListener('scroll', syncSection, { passive: true });

    const scrollToSection = (sectionIndex: number) => {
      if (sectionIndex < 0 || sectionIndex > 1) return;
      
      if (activeAnimation) {
        activeAnimation.stop();
      }
      
      isAnimating = true;
      currentSection = sectionIndex;
      
      const targetY = sectionIndex * window.innerHeight;
      
      // Animate scroll position using Framer Motion's optimized spring solver
      activeAnimation = animate(window.scrollY, targetY, {
        type: "spring",
        stiffness: 90,
        damping: 17,
        mass: 0.95,
        onUpdate: (value) => {
          window.scrollTo(0, value);
        },
        onComplete: () => {
          isAnimating = false;
          activeAnimation = null;
        }
      });

      return activeAnimation;
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 10) return;
      
      e.preventDefault();
      
      if (isAnimating) return;
      
      if (e.deltaY > 0 && currentSection === 0) {
        scrollToSection(1);
      } else if (e.deltaY < 0 && currentSection === 1) {
        scrollToSection(0);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating) {
        e.preventDefault();
        return;
      }
      
      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      
      if (Math.abs(deltaY) < 30) return; // Threshold for swipe
      
      if (deltaY > 0 && currentSection === 0) {
        e.preventDefault();
        scrollToSection(1);
      } else if (deltaY < 0 && currentSection === 1) {
        e.preventDefault();
        scrollToSection(0);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        if (currentSection === 0) {
          e.preventDefault();
          scrollToSection(1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        if (currentSection === 1) {
          e.preventDefault();
          scrollToSection(0);
        }
      }
    };

    const handleResize = () => {
      if (activeAnimation) {
        activeAnimation.stop();
        activeAnimation = null;
      }
      isAnimating = false;
      
      const currentScroll = window.scrollY;
      const height = window.innerHeight;
      const target = currentScroll > height / 2 ? height : 0;
      currentSection = target > 0 ? 1 : 0;
      window.scrollTo(0, target);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      if (activeAnimation) {
        activeAnimation.stop();
      }
      window.removeEventListener('scroll', syncSection);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="home-snap-container relative w-full text-zinc-100 min-h-[200vh] overflow-x-hidden selection:bg-primary/30 selection:text-primary font-sans"
    >
      <HeroNode isDepth={isDepth} preloaderComplete={preloaderComplete} />
      <NavigationNode />
    </motion.main>
  );
}
