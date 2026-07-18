'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { getStorageUrl } from '@/lib/storage';
import { client } from '@/sanity/lib/client';
import { playClick, playTick } from '@/lib/audioUtils';
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

const proxyUrl = (url: string) => `/api/assets?url=${encodeURIComponent(url)}`;

/*
const ME_IMAGES: GalleryItem[] = [
  {
    src: proxyUrl(getStorageUrl('/gallery/img_2255.jpg')),
    title: 'DECK CONTROLS',
    gridClass: 'col-span-1 md:col-span-1 aspect-square md:aspect-auto md:row-span-2',
  },
  {
    src: proxyUrl(getStorageUrl('/gallery/img_0495.jpg')),
    title: 'ROYAL COURT S1',
    gridClass: 'col-span-1 aspect-square md:aspect-[4/3]',
  },
  {
    src: proxyUrl(getStorageUrl('/gallery/img_3540.jpg')),
    title: 'BOOTH MONITOR',
    gridClass: 'col-span-1 aspect-square',
  },
  {
    src: proxyUrl(getStorageUrl('/gallery/img_4564.jpg')),
    title: 'CROWD WAVE',
    gridClass: 'col-span-1 md:col-span-2 aspect-square md:aspect-[2/1]',
  },
];
*/

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

interface AlbumImage {
  src: string;
  title: string;
}

interface Album {
  id: string;
  title: string;
  description: string;
  images: AlbumImage[];
}

function StorybookAlbum({
  album,
  onClick
}: {
  album: Album;
  onClick: () => void;
}) {
  // Get 4 preview images for the inner page grid
  const previewImages = album.images.slice(0, 4);

  return (
    <motion.div
      onClick={onClick}
      className="relative aspect-[3/4] w-full max-w-[320px] cursor-pointer group [perspective:2000px] mb-12 select-none"
      whileHover="hover"
      initial="initial"
    >
      {/* 3D Book Wrapper */}
      <div className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-700 ease-out group-hover:[transform:rotateY(-15deg)] shadow-2xl">
        
        {/* Book Spine (Left edge) */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-zinc-950 border-r border-zinc-900 rounded-l shadow-2xl z-40 [transform:translateZ(1px)]" />

        {/* Inner Page (revealed on open) */}
        <div className="absolute inset-0 bg-[#0e0e11] border border-zinc-900 rounded-r-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.85)] p-5 flex flex-col justify-between ml-2.5 z-10">
          <div className="flex flex-col gap-2.5">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-mono">INSIDE CONTENTS</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {previewImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-md border border-zinc-900 overflow-hidden bg-black">
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="120px"
                    unoptimized={img.src.includes('/api/assets')}
                    className="object-cover filter grayscale contrast-125 brightness-90"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-900/60 pt-2.5 font-mono text-[7px] text-zinc-600 uppercase flex justify-between">
            <span>FILES: {album.images.length}</span>
            <span>SECURE_READ</span>
          </div>
        </div>

        {/* Front Cover Page (swings open) */}
        <motion.div
          variants={{
            initial: { rotateY: 0 },
            hover: { rotateY: -105 }
          }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-r-xl shadow-2xl z-30 [transform-origin:left_center] [transform-style:preserve-3d] [backface-visibility:hidden] flex flex-col justify-between p-6 overflow-hidden"
        >
          {/* Cover background tech grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30" />
          <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none z-10" />

          {/* Album Title plate */}
          <div className="flex flex-col gap-1 text-left relative z-20">
            <div className="w-8 h-1 bg-primary rounded-full mb-3 shadow-[0_0_8px_rgba(216,22,63,0.6)]" />
            <h3 className="font-mono text-xs md:text-sm font-black text-zinc-100 uppercase tracking-[0.2em] leading-tight group-hover:text-primary transition-colors duration-300">
              {album.title}
            </h3>
            <span className="font-mono text-[7.5px] text-zinc-500 uppercase tracking-widest font-bold block mt-1">
              VOL // 01
            </span>
          </div>

          {/* Lower cover branding info */}
          <div className="border-t border-zinc-800/80 pt-4 flex flex-col gap-2 relative z-20 text-left">
            <span className="font-mono text-[6.5px] text-zinc-600 uppercase tracking-[0.3em] font-black">
              HENRY IX // TECH BINDER
            </span>
            <div className="flex justify-between items-center text-[7px] text-zinc-500 font-mono font-bold">
              <span>SYSTEM: OK</span>
              <span>READ_PORT_3</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ExpandedBookView({
  album,
  prevAlbum,
  nextAlbum,
  onClose,
  onNavigate,
  onPhotoClick
}: {
  album: Album;
  prevAlbum: Album | null;
  nextAlbum: Album | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onPhotoClick: (idx: number) => void;
}) {
  const hasChapters = album.id === 'track_artworks';
  
  const getChapters = (): { name: string; images: AlbumImage[] }[] => {
    if (!hasChapters) {
      return [{ name: 'PHOTOS', images: album.images }];
    }
    
    const knightClub = album.images.filter(img => img.title.includes('KNIGHT CLUB') || img.src.includes('Knight%20Club') || (!img.title.includes('ROYAL COURT') && !img.title.includes('CORNER') && !img.title.includes('CNC')));
    const royalCourt = album.images.filter(img => img.title.includes('ROYAL COURT') || img.src.includes('Royal%20Court'));
    const cnc = album.images.filter(img => img.title.includes('CORNER') || img.title.includes('CNC') || img.src.includes('Corner') || img.src.includes('CNC'));
    
    return [
      { name: 'KNIGHT CLUB', images: knightClub },
      { name: 'ROYAL COURT', images: royalCourt },
      { name: 'CORNER NEW CROSS', images: cnc }
    ];
  };

  const chapters = getChapters();
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const activeChapter = chapters[activeChapterIndex] || chapters[0];

  const handleChapterChange = (idx: number) => {
    playTick();
    setActiveChapterIndex(idx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-5xl mx-auto flex flex-col font-mono"
    >
      {/* Top Album HUD Header Navigation */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between border-b border-zinc-900/80 pb-4 mb-8 gap-4 select-none">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="text-[9px] text-zinc-400 hover:text-primary transition-colors uppercase tracking-[0.2em] font-bold border border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          [ CLOSE ALBUM ]
        </button>

        {/* Prev / Next Album Toggles */}
        <div className="flex items-center gap-4 text-[8px] sm:text-[9.5px]">
          {prevAlbum && (
            <button
              onClick={() => onNavigate(prevAlbum.id)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors uppercase tracking-widest font-black flex items-center gap-1 cursor-pointer"
            >
              [ ← TO {prevAlbum.title} ]
            </button>
          )}
          <span className="text-zinc-700">|</span>
          {nextAlbum && (
            <button
              onClick={() => onNavigate(nextAlbum.id)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors uppercase tracking-widest font-black flex items-center gap-1 cursor-pointer"
            >
              [ TO {nextAlbum.title} → ]
            </button>
          )}
        </div>
      </div>

      {/* Main Dual-Page Flat Spread Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-stretch">
        
        {/* Left Page: Index Ledger & Chapters */}
        <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-between min-h-[300px] shadow-xl relative select-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_95%,rgba(0,0,0,0.15)_95%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30" />
          
          <div className="relative z-20 flex flex-col gap-6 text-left">
            <div>
              <span className="text-[7.5px] text-zinc-500 uppercase tracking-[0.3em] font-black block mb-1">
                ALBUM ARCHIVE
              </span>
              <h2 className="text-md font-black text-primary uppercase tracking-[0.2em]">
                {album.title}
              </h2>
              <div className="w-12 h-0.5 bg-primary/40 mt-2" />
            </div>
            
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              {album.description}
            </p>

            {/* Chapters / Sub-folders Selector list */}
            {hasChapters && (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">CHAPTERS</span>
                <div className="flex flex-col gap-1.5">
                  {chapters.map((chap, idx) => (
                    <button
                      key={chap.name}
                      onClick={() => handleChapterChange(idx)}
                      className={cn(
                        "text-left text-[9px] uppercase tracking-widest py-2 px-3.5 rounded border transition-all cursor-pointer select-none active:scale-[0.98] flex justify-between items-center",
                        activeChapterIndex === idx
                          ? "bg-primary border-primary/20 text-black font-black shadow-[0_0_10px_rgba(216,22,63,0.25)]"
                          : "bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <span className="glitch" data-text={`0${idx + 1} // ${chap.name}`}>0{idx + 1} // {chap.name}</span>
                      <span className="text-[7.5px] opacity-80">({chap.images.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-900/60 pt-4 mt-8 flex justify-between items-center text-[7px] text-zinc-600 uppercase font-black tracking-widest relative z-20">
            <span>SYS_LOC: PORT_03</span>
            <span>SECURE_ENCRYPTED</span>
          </div>
        </div>

        {/* Right Page: Expanded Images Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center select-none border-b border-zinc-900 pb-2">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">
              CONTENTS // {activeChapter.name}
            </span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-[0.2em]">
              {activeChapter.images.length} RECORDS FOUND
            </span>
          </div>

          {activeChapter.images.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-2xl py-20 text-zinc-600 uppercase text-[9px] tracking-widest select-none">
              [ NO IMAGES LOADED IN THIS CHAPTER ]
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeChapter.images.map((img, idx) => {
                const absoluteIdx = album.images.findIndex(i => i.src === img.src);
                return (
                  <motion.div
                    key={img.src}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.04 }}
                    onClick={() => onPhotoClick(absoluteIdx)}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 cursor-pointer hover:border-primary/45 transition-colors"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30" />
                    
                    <Image
                      src={img.src}
                      alt={img.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      unoptimized={img.src.includes('/api/assets')}
                      className="object-cover filter grayscale group-hover:grayscale-0 contrast-125 group-hover:scale-[1.03] transition-all duration-500"
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10 text-left">
                      <span className="text-[9px] text-primary font-black uppercase tracking-widest mb-0.5">
                        {img.title}
                      </span>
                      <span className="text-[7px] text-zinc-500 uppercase tracking-wider font-bold">
                        FILE_ID // {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/15 z-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function GalleryClient() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'albums' | 'videos'>('albums');

  const [albums, setAlbums] = useState<Album[]>([
    {
      id: 'track_artworks',
      title: 'TRACK ARTWORKS',
      description: 'Official promotional mix artwork covers, digital banners, and album graphics organized by series.',
      images: ARTWORK_IMAGES.map(img => ({ src: img.src, title: img.title }))
    },
    {
      id: 'me',
      title: 'ME',
      description: 'Candid deck captures, crowd wave highlights, studio sessions, and headshots of HENRY IX.',
      images: [
        { src: '/gallery/Me/img_2255.jpg', title: 'DECK CONTROLS' },
        { src: '/gallery/Me/img_3540.jpg', title: 'BOOTH MONITOR' },
        { src: '/gallery/Me/img_0495.jpg', title: 'ROYAL COURT S1' },
        { src: '/gallery/Me/img_4564.jpg', title: 'CROWD WAVE' },
        { src: '/gallery/Me/img_0899.jpg', title: 'RED PORTRAIT' }
      ]
    }
  ]);

  useEffect(() => {
    async function loadDynamicGallery() {
      try {
        const [galleryDocs, mixesDocs] = await Promise.all([
          client.fetch<any[]>(`*[_type == "galleryImage" && defined(imageFile)]`),
          client.fetch<any[]>(`*[_type == "mix" && defined(artworkFile)]`)
        ]);

        let dynamicMe: AlbumImage[] = [];
        let dynamicArtwork: AlbumImage[] = [];

        if (galleryDocs && galleryDocs.length > 0) {
          galleryDocs.forEach(d => {
            const url = proxyUrl(getStorageUrl(d.imageFile));
            const title = d.title.toUpperCase();
            if (d.category === 'me') {
              dynamicMe.push({ src: url, title });
            } else if (d.category === 'artwork') {
              dynamicArtwork.push({ src: url, title });
            }
          });
        }

        if (mixesDocs && mixesDocs.length > 0) {
          mixesDocs.forEach(mix => {
            const url = proxyUrl(getStorageUrl(mix.artworkFile));
            dynamicArtwork.push({ src: url, title: mix.title.toUpperCase() });
          });
        }

        setAlbums(prev => {
          return prev.map(album => {
            if (album.id === 'track_artworks') {
              const merged = [...album.images, ...dynamicArtwork];
              const unique = merged.filter((v, i, a) => a.findIndex(t => t.src === v.src) === i);
              return { ...album, images: unique };
            }
            if (album.id === 'me') {
              const merged = [...album.images, ...dynamicMe];
              const unique = merged.filter((v, i, a) => a.findIndex(t => t.src === v.src) === i);
              return { ...album, images: unique };
            }
            return album;
          });
        });
      } catch (err) {
        console.error('Error loading dynamic gallery:', err);
      }
    }
    loadDynamicGallery();
  }, []);

  const expandedAlbum = albums.find(a => a.id === expandedAlbumId) || null;
  const currentAlbumIndex = albums.findIndex(a => a.id === expandedAlbumId);
  const prevAlbum = currentAlbumIndex > -1 ? albums[(currentAlbumIndex - 1 + albums.length) % albums.length] : null;
  const nextAlbum = currentAlbumIndex > -1 ? albums[(currentAlbumIndex + 1) % albums.length] : null;

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || !expandedAlbum) return;
      
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((lightboxIndex + 1) % expandedAlbum.images.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((lightboxIndex - 1 + expandedAlbum.images.length) % expandedAlbum.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, expandedAlbum]);

  const activeImage = expandedAlbum && lightboxIndex !== null ? expandedAlbum.images[lightboxIndex] : null;

  const navigateToAlbum = (id: string) => {
    playClick(1000, 'sine', 0.04);
    setExpandedAlbumId(id);
    setLightboxIndex(null);
  };

  return (
    <PageShell>
      <main className="min-h-[100dvh] text-zinc-100 selection:bg-primary/30 selection:text-primary pt-24 pb-20 px-4 md:px-8 w-full relative overflow-y-auto custom-scrollbar">
        {/* Section Header */}
        <div className="relative z-10 mb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1
              className="glitch font-sans font-black text-primary text-[clamp(2rem,6vh,5.5rem)] leading-none tracking-wider uppercase select-none"
              data-text="GALLERY"
            >
              GALLERY
            </h1>
          </motion.div>
        </div>

        {/* Skeuomorphic Category Tab Switcher */}
        <div className="relative z-10 flex justify-center items-center select-none font-mono mb-12 w-full px-4">
          <div className="relative flex p-1 bg-zinc-950 border border-zinc-900 rounded-xl backdrop-blur-md w-full max-w-sm">
            {[
              { id: 'albums', label: 'PHOTO ALBUMS' },
              { id: 'videos', label: 'VIDEO BROADCASTS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setExpandedAlbumId(null);
                  playClick(800, 'sine', 0.025);
                }}
                onMouseEnter={() => playTick()}
                className={cn(
                  "relative flex-1 py-1.5 rounded-lg font-mono text-[8px] sm:text-[9px] md:text-[10px] tracking-widest font-black uppercase transition-colors cursor-pointer flex items-center justify-center h-8 px-1",
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
                <span className="glitch relative z-10" data-text={tab.label}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab contents */}
        <div className="relative z-10 w-full">
          {activeTab === 'albums' && (
            <AnimatePresence mode="wait">
              {expandedAlbumId === null ? (
                <motion.div
                  key="album-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto w-full mb-16 justify-items-center"
                >
                  {albums.map((album) => (
                    <StorybookAlbum
                      key={album.id}
                      album={album}
                      onClick={() => {
                        playClick(800, 'sine', 0.05);
                        setExpandedAlbumId(album.id);
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                expandedAlbum && (
                  <ExpandedBookView
                    key={expandedAlbum.id}
                    album={expandedAlbum}
                    prevAlbum={prevAlbum}
                    nextAlbum={nextAlbum}
                    onClose={() => {
                      playClick(700, 'triangle', 0.04);
                      setExpandedAlbumId(null);
                    }}
                    onNavigate={navigateToAlbum}
                    onPhotoClick={(idx: number) => {
                      playClick(900, 'sine', 0.03);
                      setLightboxIndex(idx);
                    }}
                  />
                )
              )}
            </AnimatePresence>
          )}

          {activeTab === 'videos' && (
            <div className="w-full flex justify-center pb-12">
              <CRTBroadcastDeck />
            </div>
          )}
        </div>

        {/* Lightbox Overlay */}
        <AnimatePresence>
          {expandedAlbum && lightboxIndex !== null && activeImage !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] flex flex-col justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8 select-none"
              onClick={() => setLightboxIndex(null)}
            >
              {/* Lightbox Close */}
              <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
                <button
                  onClick={() => setLightboxIndex(null)}
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
                    setLightboxIndex((lightboxIndex - 1 + expandedAlbum.images.length) % expandedAlbum.images.length);
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
                    setLightboxIndex((lightboxIndex + 1) % expandedAlbum.images.length);
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
