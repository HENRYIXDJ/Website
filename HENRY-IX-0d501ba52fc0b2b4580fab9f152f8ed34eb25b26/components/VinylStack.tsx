'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getSessionImage } from '@/lib/mixes';

interface VinylStackProps {
  group: any;
  onClick: () => void;
  playTick: () => void;
}

export function VinylStack({ group, onClick, playTick }: VinylStackProps) {
  return (
    <motion.div 
      className="relative w-full max-w-[400px] aspect-square cursor-pointer group mx-auto"
      onClick={onClick}
      onMouseEnter={() => playTick()}
      initial="initial"
      whileHover="hover"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <h3 className="absolute -bottom-10 text-center text-white font-sans font-bold text-lg md:text-xl tracking-widest uppercase opacity-80 group-hover:opacity-100 group-hover:text-primary transition-all">
          {group.title}
        </h3>
      </div>
      
      {/* Reverse loop so index 0 is on top */}
      {[...group.mixes].reverse().slice(-4).map((track: any, revIdx: number, arr: any[]) => {
        // We sliced up to 4 tracks. The true index (where 0 is the top of the pile) is:
        const i = arr.length - 1 - revIdx;
        
        return (
          <motion.div
            key={track.id}
            className="absolute inset-0 w-full h-full rounded-lg overflow-hidden border border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            style={{ 
              zIndex: 10 - i,
            }}
            variants={{
              initial: { 
                y: i * -8, 
                x: i * 4, 
                rotate: 0,
                scale: 1 - (i * 0.05),
                opacity: 1 - (i * 0.15)
              },
              hover: { 
                y: i * -16, 
                x: (i % 2 === 0 ? 1 : -1) * i * 16, 
                rotate: (i % 2 === 0 ? 1 : -1) * i * 6,
                scale: 1 - (i * 0.05),
                opacity: 1 - (i * 0.05)
              }
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getSessionImage(track.title, track.artworkUrl)} 
              alt={track.title}
              className="w-full h-full object-cover"
            />
            {i === 0 && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            )}
            {i !== 0 && (
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
