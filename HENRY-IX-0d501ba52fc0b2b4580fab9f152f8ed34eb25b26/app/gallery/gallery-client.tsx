'use client';

import React, { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { getStorageUrl } from '@/lib/storage';
import { client } from '@/sanity/lib/client';
import { playClick, playTick, playLockoutBlip } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

interface GalleryItem {
  src: string;
  title: string;
  gridClass: string;
}

interface Broadcast {
  id: string;
  title: string;
  url: string;
  date: string;
  duration: string;
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

const proxyUrl = (url: string) => `/api/assets?url=${encodeURIComponent(url)}`;

const ARTWORK_IMAGES: GalleryItem[] = [
  {
    src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg')),
    title: 'KNIGHT CLUB: SESSION 1',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%202.jpg')),
    title: 'KNIGHT CLUB: SESSION 2',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%203.jpg')),
    title: 'KNIGHT CLUB: SESSION 3',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%204.jpg')),
    title: 'KNIGHT CLUB: SESSION 4',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%205.jpg')),
    title: 'KNIGHT CLUB: SESSION 5',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.jpg')),
    title: 'ROYAL COURT S1',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.jpg')),
    title: 'ROYAL COURT S2',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N1%20Artwork.png')),
    title: 'CORNER NEW CROSS N1',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N2%20Artwork.png')),
    title: 'CORNER NEW CROSS N2',
    gridClass: 'col-span-1 aspect-square',
  }
];

const BROADCAST_DATA: Broadcast[] = [
  { id: '1', title: 'KNIGHT CLUB SESSION 1 - LIVE PERFORMANCE', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: 'JULY 2026', duration: '58:12' },
  { id: '2', title: 'ROYAL COURT SESSION 2 - STUDIO RECORDING', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: 'MAY 2026', duration: '45:30' },
  { id: '3', title: 'CORNER NEW CROSS NIGHT 1 - CLUB DJ GIG', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: 'APRIL 2026', duration: '1:12:05' }
];

function CRTBroadcastDeck() {
  const [activeChannel, setActiveChannel] = useState(0);
  const [crtPower, setCrtPower] = useState(true);
  const [flickerEffect, setFlickerEffect] = useState(false);

  const currentBroadcast = BROADCAST_DATA[activeChannel];

  const handleChannelChange = (idx: number) => {
    if (!crtPower) return;
    playClick(600, 'sine', 0.025);
    setFlickerEffect(true);
    setTimeout(() => setFlickerEffect(false), 250);
    setActiveChannel(idx);
  };

  const togglePower = () => {
    playClick(400, 'triangle', 0.08);
    setCrtPower(!crtPower);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 items-stretch select-none font-mono mt-8">
      {/* Left Column: The TV Bezel Screen */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[32px] p-5 shadow-2xl relative flex flex-col items-center min-h-[300px]">
        {/* Carbon texture backdrop */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0" style={{
          backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px'
        }} />

        {/* Screen inner enclosure */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-black bg-black flex items-center justify-center flex-grow">
          {/* CRT Screen Tube Power collapse/expansion */}
          <AnimatePresence mode="wait">
            {crtPower ? (
              <motion.div 
                key="screen-on"
                initial={{ scaleY: 0.005, scaleX: 0.1, opacity: 0 }}
                animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
                exit={{ scaleY: 0.005, scaleX: 0.1, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={cn(
                  "relative w-full h-full bg-zinc-950 flex items-center justify-center",
                  flickerEffect && "animate-[pulse_0.1s_infinite_alternate]"
                )}
              >
                {/* Scanline pattern mask */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-70" />
                <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none z-10" />

                {/* Simulated Glass curvature reflection */}
                <div className="absolute inset-0 pointer-events-none z-15 opacity-10" style={{
                  backgroundImage: 'radial-gradient(circle at 50% 15%, #ffffff 0%, transparent 60%)'
                }} />

                {/* Actual Video Iframe */}
                <iframe
                  src={currentBroadcast.url}
                  title={currentBroadcast.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 relative z-0 opacity-90 filter brightness-110 contrast-125"
                />
              </motion.div>
            ) : (
              <div key="screen-off" className="w-full h-full bg-black flex items-center justify-center">
                {/* Tiny glowing dot when shut off */}
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-ping" />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand logo at bottom of bezel */}
        <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-3 leading-none select-none">
          BROADCAST DECK // CRT-1985
        </span>
      </div>

      {/* Right Column: Skewomorphic Control Module Panel */}
      <div className="w-full md:w-[240px] bg-zinc-950 border border-zinc-900 rounded-[24px] p-5 shadow-xl flex flex-col justify-between shrink-0 select-none">
        {/* Panel Head */}
        <div className="w-full border-b border-zinc-900 pb-2 flex justify-between items-center text-[7px] text-zinc-500 uppercase tracking-widest font-bold">
          <span>MONITOR SYSTEM</span>
          <span className="text-zinc-600">UK_PATENT_PEND</span>
        </div>

        {/* Channel Selection dial block */}
        <div className="flex flex-col gap-4 my-6">
          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider text-left">CHANNELS</span>
          <div className="grid grid-cols-3 gap-2">
            {BROADCAST_DATA.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleChannelChange(idx)}
                className={cn(
                  "h-10 rounded-lg border font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer select-none active:scale-95",
                  activeChannel === idx && crtPower
                    ? "bg-primary border-primary/25 text-black font-black shadow-[0_0_8px_rgba(216,22,63,0.3)]"
                    : "bg-black border-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
              >
                0{idx + 1}
              </button>
            ))}
          </div>

          {/* Active Set Title Display */}
          <div className="bg-black border border-zinc-900 p-2.5 rounded-lg flex flex-col gap-1.5 mt-2 select-none text-left">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">ACTIVE BROADCAST</span>
            <div className="text-[9px] font-bold text-primary truncate leading-tight">
              {crtPower ? currentBroadcast.title : "OFFLINE"}
            </div>
            <div className="flex justify-between items-center text-[7.5px] text-zinc-500 font-bold">
              <span>DATE: {crtPower ? currentBroadcast.date : "--"}</span>
              <span>DUR: {crtPower ? currentBroadcast.duration : "--"}</span>
            </div>
          </div>
        </div>

        {/* Power Toggle Switch */}
        <div className="flex flex-col items-center gap-1.5 border-t border-zinc-900 pt-4 mt-auto">
          <span className="text-[7.5px] text-zinc-600 uppercase tracking-widest font-bold">POWER SWITCH</span>
          <button
            onClick={togglePower}
            className={cn(
              "w-12 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer",
              crtPower ? "bg-primary/20 border border-primary/30 justify-end" : "bg-zinc-900 border border-zinc-800 justify-start"
            )}
          >
            <motion.div 
              layout 
              className={cn(
                "w-5 h-5 rounded-full shadow-md",
                crtPower ? "bg-primary shadow-[0_0_8px_#d8163f]" : "bg-zinc-700"
              )} 
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryClient() {
  const [activeItem, setActiveItem] = useState<{ type: 'me' | 'artwork', idx: number } | null>(null);
  const [artworkImages, setArtworkImages] = useState<GalleryItem[]>(ARTWORK_IMAGES);
  const [activeTab, setActiveTab] = useState<'photos' | 'artwork' | 'videos'>('photos');

  useEffect(() => {
    async function loadDynamicArtwork() {
      try {
        const mixes = await client.fetch<any[]>(
          `*[_type == "mix" && defined(audioFile) && defined(artworkFile)]`
        );
        if (mixes && mixes.length > 0) {
          const formatted = mixes.map(mix => ({
            src: proxyUrl(getStorageUrl(mix.artworkFile)),
            title: mix.title.toUpperCase(),
            gridClass: 'col-span-1 aspect-square'
          }));
          setArtworkImages(formatted);
        }
      } catch (err) {
        console.error('Error loading dynamic artwork for gallery:', err);
      }
    }
    loadDynamicArtwork();
  }, []);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeItem === null) return;
      
      const currentArray = activeItem.type === 'me' ? ME_IMAGES : artworkImages;
      
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
  }, [activeItem, artworkImages]);

  const activeImage = activeItem ? (activeItem.type === 'me' ? ME_IMAGES[activeItem.idx] : artworkImages[activeItem.idx]) : null;

  return (
    <PageShell>
      <main className="min-h-screen text-zinc-100 selection:bg-primary/30 selection:text-primary pt-24 pb-20 px-4 md:px-8 w-full relative overflow-y-auto custom-scrollbar">
        {/* Section Header */}
        <div className="relative z-10 mb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1
              className="glitch font-sans font-black text-primary text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-wider uppercase select-none"
              data-text="GALLERY"
            >
              GALLERY
            </h1>
          </motion.div>
        </div>

        {/* Skeuomorphic Category Tab Switcher */}
        <div className="relative z-10 flex justify-center items-center select-none font-mono mb-12">
          <div className="relative flex p-1 bg-zinc-950 border border-zinc-900 rounded-xl backdrop-blur-md">
            {[
              { id: 'photos', label: 'STILL PHOTOS' },
              { id: 'artwork', label: 'MIX ARTWORKS' },
              { id: 'videos', label: 'VIDEO BROADCASTS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playClick(800, 'sine', 0.025);
                }}
                onMouseEnter={() => playTick()}
                className={cn(
                  "relative px-4 py-1.5 rounded-lg font-mono text-[9px] md:text-[10px] tracking-widest font-black uppercase transition-colors cursor-pointer flex items-center justify-center w-28 md:w-36 h-8",
                  activeTab === tab.id ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="gallery-tab-highlight"
                    className="absolute inset-0 bg-primary rounded-lg shadow-[0_0_10px_rgba(216,22,63,0.4)]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab contents */}
        <div className="relative z-10 w-full">
          {activeTab === 'photos' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
              {ME_IMAGES.map((item, idx) => (
                <motion.div
                  key={item.src}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                  className={cn(
                    "group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900/80 flex flex-col justify-between cursor-pointer hover:border-primary/30 transition-colors duration-500",
                    item.gridClass
                  )}
                  onClick={() => startTransition(() => setActiveItem({ type: 'me', idx }))}
                >
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
          )}

          {activeTab === 'artwork' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-16">
              {artworkImages.map((item, idx) => (
                <motion.div
                  key={item.src}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                  className={cn(
                    "group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900/80 flex flex-col justify-between cursor-pointer hover:border-primary/30 transition-colors duration-500",
                    item.gridClass
                  )}
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
                      unoptimized={true}
                      className="object-cover filter grayscale group-hover:grayscale-0 contrast-125 group-hover:scale-[1.03] transition-all duration-700 ease-out"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-100 group-hover:opacity-0 transition-opacity duration-500 z-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="w-full flex justify-center pb-12">
              <CRTBroadcastDeck />
            </div>
          )}
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
                      const currentArray = activeItem.type === 'me' ? ME_IMAGES : artworkImages;
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
                    unoptimized={activeImage.src.includes('/api/assets')}
                    className="object-contain block pointer-events-none"
                  />
                </motion.div>

                {/* Arrow Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startTransition(() => {
                      const currentArray = activeItem.type === 'me' ? ME_IMAGES : artworkImages;
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
