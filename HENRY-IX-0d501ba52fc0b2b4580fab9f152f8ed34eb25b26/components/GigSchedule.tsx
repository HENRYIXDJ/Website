'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/audioUtils';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

interface GigScheduleProps {
  isDepth?: boolean;
  initialEvents?: any[] | null;
}

export function GigSchedule({ isDepth = false }: GigScheduleProps) {
  return (
    <motion.section 
      id="schedule" 
      className="w-full relative py-16 md:py-32 px-6 max-w-7xl mx-auto scroll-mt-24"
      onViewportEnter={() => {
        playClick(700, 'sine', 0.05);
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">03 / Events & Performances</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      <div className="w-full flex flex-col items-center justify-center py-32 relative px-4">
        {/* Pulse dot */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-3 h-3 rounded-full bg-primary mb-10"
        />

        <motion.h3 
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          whileInView={{ y: 0, opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
          className="glitch font-avathe font-bold tracking-wider leading-none text-center select-none text-primary w-full flex flex-col items-center"
          data-text="COMING SOON"
        >
          <span className="text-[clamp(2.5rem,10vh,11vw)]">COMING</span>
          <span className="text-[clamp(2.5rem,10vh,11vw)]">SOON</span>
        </motion.h3>

        <p className="font-mono text-[9px] tracking-[0.25em] text-zinc-500 uppercase max-w-md text-center px-4 leading-relaxed mt-8">
          TRANSMISSION_STAGED // DATES_UNDER_CLASSIFICATION
        </p>
      </div>
    </motion.section>
  );
}

export default GigSchedule;
