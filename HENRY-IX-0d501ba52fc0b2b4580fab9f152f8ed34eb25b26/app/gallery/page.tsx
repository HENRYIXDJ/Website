'use client';

import React, { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';

interface GalleryItem {
  src: string;
  title: string;
  gridClass: string;
}

const ME_IMAGES: GalleryItem[] = [
  {
    src: '/gallery/img_2255.jpg',
    title: 'DECK CONTROLS',
    gridClass: 'col-span-1 md:col-span-1 aspect-square md:aspect-auto md:row-span-2',
  },
  {
    src: '/gallery/img_0495.jpg',
    title: 'ROYAL COURT S1',
    gridClass: 'col-span-1 aspect-square md:aspect-[4/3]',
  },
  {
    src: '/gallery/img_3540.jpg',
    title: 'BOOTH MONITOR',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: '/gallery/img_4564.jpg',
    title: 'CROWD WAVE',
    gridClass: 'col-span-1 md:col-span-2 aspect-square md:aspect-[2/1]',
  },
];

const ARTWORK_IMAGES: GalleryItem[] = [
  {
    src: '/Knight Club Artwork/Session 1.jpg',
    title: 'KNIGHT CLUB: SESSION 1',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: '/Knight Club Artwork/Session 2.jpg',
    title: 'KNIGHT CLUB: SESSION 2',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: '/Knight Club Artwork/Session 3.jpg',
    title: 'KNIGHT CLUB: SESSION 3',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: '/Knight Club Artwork/Session 4.jpg',
    title: 'KNIGHT CLUB: SESSION 4',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.png',
    title: 'ROYAL COURT S1',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Royal%20Court%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.png',
    title: 'ROYAL COURT S2',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Artwork/CNC%20N1%20Artwork.png',
    title: 'CORNER NEW CROSS N1',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: 'https://6pnumwdmtebaxkbr.public.blob.vercel-storage.com/Corner%20New%20Cross%20Artwork/CNC%20N2%20Artwork.png',
    title: 'CORNER NEW CROSS N2',
    gridClass: 'col-span-1 aspect-square',
  }
];

export default function GalleryPage() {
  const [activeItem, setActiveItem] = useState<{ type: 'me' | 'artwork', idx: number } | null>(null);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeItem === null) return;
      
      const currentArray = activeItem.type === 'me' ? ME_IMAGES : ARTWORK_IMAGES;
      
      if (e.key === 'Escape') {
        startTransition(() => setActiveItem(null));
      } else if (e.key === 'ArrowRight') {
        startTransition(() => {
          setActiveItem({
            type: activeItem.type,
            idx: (activeItem.idx + 1) % currentArray.length
          });
        });
      } else if (e.key === 'ArrowLeft') {
        startTransition(() => {
          setActiveItem({
            type: activeItem.type,
            idx: (activeItem.idx - 1 + currentArray.length) % currentArray.length
          });
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem]);

  const activeImage = activeItem ? (activeItem.type === 'me' ? ME_IMAGES[activeItem.idx] : ARTWORK_IMAGES[activeItem.idx]) : null;

  return (
    <PageShell>
      <main className="min-h-screen bg-black text-zinc-100 selection:bg-primary/30 selection:text-primary pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative overflow-hidden">
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-5">
          <div className="w-full h-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        {/* Section Header */}
        <div className="relative z-10 mb-12 md:mb-16 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1
              className="glitch font-sans font-black text-primary text-[clamp(3rem,8vw,6.5rem)] leading-none tracking-wider uppercase select-none"
              data-text="GALLERY"
            >
              GALLERY
            </h1>
          </motion.div>
        </div>

        {/* Me Section */}
        <div className="relative z-10 mb-8 mt-12">
           <h2 className="font-sans font-bold text-2xl tracking-widest text-zinc-300 uppercase border-b border-zinc-900 pb-4">Me</h2>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {ME_IMAGES.map((item, idx) => (
            <motion.div
              key={item.src}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              className={`group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900/80 flex flex-col justify-between cursor-pointer hover:border-primary/30 transition-colors duration-500 ${item.gridClass}`}
              onClick={() => startTransition(() => setActiveItem({ type: 'me', idx }))}
            >
              {/* Image Box */}
              <div className="relative flex-grow overflow-hidden aspect-video md:aspect-auto h-full min-h-[220px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                  className="object-cover filter grayscale group-hover:grayscale-0 contrast-125 group-hover:scale-[1.03] transition-all duration-700 ease-out"
                />

                <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-primary/0 group-hover:border-primary/60 transition-all duration-500 z-10" />
                <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-primary/0 group-hover:border-primary/60 transition-all duration-500 z-10" />
                <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-primary/0 group-hover:border-primary/60 transition-all duration-500 z-10" />
                <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-primary/0 group-hover:border-primary/60 transition-all duration-500 z-10" />
                <div className="absolute inset-0 bg-black/40 opacity-100 group-hover:opacity-0 transition-opacity duration-500 z-0" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mix Artwork Section */}
        <div className="relative z-10 mb-8 mt-16">
           <h2 className="font-sans font-bold text-2xl tracking-widest text-zinc-300 uppercase border-b border-zinc-900 pb-4">Mix Artwork</h2>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {ARTWORK_IMAGES.map((item, idx) => (
            <motion.div
              key={item.src}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              className={`group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900/80 flex flex-col justify-between cursor-pointer hover:border-primary/30 transition-colors duration-500 ${item.gridClass}`}
              onClick={() => startTransition(() => setActiveItem({ type: 'artwork', idx }))}
            >
              <div className="relative flex-grow overflow-hidden aspect-square h-full min-h-[220px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  loading="lazy"
                  className="object-cover filter grayscale group-hover:grayscale-0 contrast-125 group-hover:scale-[1.03] transition-all duration-700 ease-out"
                />

                <div className="absolute inset-0 bg-black/40 opacity-100 group-hover:opacity-0 transition-opacity duration-500 z-0" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox Overlay */}
        <AnimatePresence>
          {activeItem !== null && activeImage !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] flex flex-col justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8 select-none"
              onClick={() => startTransition(() => setActiveItem(null))}
            >
              {/* Lightbox Close */}
              <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
                <button
                  onClick={() => startTransition(() => setActiveItem(null))}
                  className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 hover:border-primary/50 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Lightbox Image Stage */}
              <div 
                className="relative flex items-center justify-center w-full max-w-6xl mx-auto flex-grow"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Arrow Left */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startTransition(() => {
                      const currentArray = activeItem.type === 'me' ? ME_IMAGES : ARTWORK_IMAGES;
                      setActiveItem({
                        type: activeItem.type,
                        idx: (activeItem.idx - 1 + currentArray.length) % currentArray.length
                      });
                    });
                  }}
                  className="absolute left-2 md:-left-12 z-50 w-12 h-12 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-primary/50 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Active Image Wrapper */}
                <motion.div
                  key={activeImage.src}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
                  className="relative w-full max-w-4xl h-[70vh] flex items-center justify-center rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-transparent"
                >
                  <Image
                    src={activeImage.src}
                    alt={activeImage.title}
                    fill
                    sizes="100vw"
                    loading="lazy"
                    className="object-contain block pointer-events-none"
                  />
                </motion.div>

                {/* Arrow Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startTransition(() => {
                      const currentArray = activeItem.type === 'me' ? ME_IMAGES : ARTWORK_IMAGES;
                      setActiveItem({
                        type: activeItem.type,
                        idx: (activeItem.idx + 1) % currentArray.length
                      });
                    });
                  }}
                  className="absolute right-2 md:-right-12 z-50 w-12 h-12 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-primary/50 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </PageShell>
  );
}
