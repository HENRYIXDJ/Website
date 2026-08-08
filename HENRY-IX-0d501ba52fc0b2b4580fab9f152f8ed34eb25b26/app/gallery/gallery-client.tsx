'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageUrl } from '@/lib/storage';
import { client } from '@/sanity/lib/client';
import { playClick, playTick } from '@/lib/audioUtils';

interface GalleryItem {
  src: string;
  title: string;
}

interface CCTVAlbum {
  id: string;
  title: string;
  camTag: string;
  description: string;
  items: GalleryItem[];
}

const proxyUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/api/assets')) return url;
  return `/api/assets?url=${encodeURIComponent(url)}`;
};

/* ==========================================================================
   DEFAULT CCTV ALBUM DATASETS (12 SURVEILLANCE CAMERAS - 4 COLS x 3 ROWS)
   ========================================================================== */
const INITIAL_CCTV_ALBUMS: CCTVAlbum[] = [
  {
    id: 'cam_01',
    camTag: 'CAM 01',
    title: 'KNIGHT CLUB SESSIONS',
    description: 'Official promotional mix artwork covers and digital banners from Knight Club.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%201.jpg')), title: 'KNIGHT CLUB: SESSION 1' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%202.jpg')), title: 'KNIGHT CLUB: SESSION 2' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%203.jpg')), title: 'KNIGHT CLUB: SESSION 3' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%204.jpg')), title: 'KNIGHT CLUB: SESSION 4' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%205.jpg')), title: 'KNIGHT CLUB: SESSION 5' },
    ],
  },
  {
    id: 'cam_02',
    camTag: 'CAM 02',
    title: 'ROYAL COURT RESIDENCY',
    description: 'Exclusive track artwork covers from the Royal Court series.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.jpg')), title: 'ROYAL COURT: SESSION 1' },
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.jpg')), title: 'ROYAL COURT: SESSION 2' },
    ],
  },
  {
    id: 'cam_03',
    camTag: 'CAM 03',
    title: 'CORNER NEW CROSS GIGS',
    description: 'Underground club gig track artwork covers from Corner New Cross.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N1%20Artwork.png')), title: 'CORNER NEW CROSS: NIGHT 1' },
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N2%20Artwork.png')), title: 'CORNER NEW CROSS: NIGHT 2' },
    ],
  },
  {
    id: 'cam_04',
    camTag: 'CAM 04',
    title: 'KNIGHT CLUB ARCHIVE',
    description: 'Retrospective visual archive of the Knight Club series.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%201.jpg')), title: 'KNIGHT CLUB S1 ARCHIVE' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%203.jpg')), title: 'KNIGHT CLUB S3 ARCHIVE' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%205.jpg')), title: 'KNIGHT CLUB S5 ARCHIVE' },
    ],
  },
  {
    id: 'cam_05',
    camTag: 'CAM 05',
    title: 'ROYAL COURT ARCHIVE',
    description: 'High-resolution artwork stream for Royal Court sets.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.jpg')), title: 'ROYAL COURT S2 ARCHIVE' },
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.jpg')), title: 'ROYAL COURT S1 ARCHIVE' },
    ],
  },
  {
    id: 'cam_06',
    camTag: 'CAM 06',
    title: 'CORNER NEW CROSS ARCHIVE',
    description: 'Underground venue captures and artwork covers.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N2%20Artwork.png')), title: 'CORNER NEW CROSS N2 ARCHIVE' },
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N1%20Artwork.png')), title: 'CORNER NEW CROSS N1 ARCHIVE' },
    ],
  },
  {
    id: 'cam_07',
    camTag: 'CAM 07',
    title: 'TRACK ARTWORK CATALOG 01',
    description: 'Combined promotional cover art catalog.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%202.jpg')), title: 'KNIGHT CLUB S2' },
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.jpg')), title: 'ROYAL COURT S1' },
    ],
  },
  {
    id: 'cam_08',
    camTag: 'CAM 08',
    title: 'TRACK ARTWORK CATALOG 02',
    description: 'Additional artwork releases.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N1%20Artwork.png')), title: 'CORNER NEW CROSS N1' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%204.jpg')), title: 'KNIGHT CLUB S4' },
    ],
  },
  {
    id: 'cam_09',
    camTag: 'CAM 09',
    title: 'STUDIO TRANSMISSIONS',
    description: 'Darkroom transmissions and studio visuals.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%203.jpg')), title: 'STUDIO TRANSMISSION 03' },
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.jpg')), title: 'STUDIO TRANSMISSION 02' },
    ],
  },
  {
    id: 'cam_10',
    camTag: 'CAM 10',
    title: 'BOOTH & DECK CAPTURES',
    description: 'Hardware visuals and stage deck archives.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%205.jpg')), title: 'DECK VISUAL S5' },
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N2%20Artwork.png')), title: 'BOOTH VISUAL CNC' },
    ],
  },
  {
    id: 'cam_11',
    camTag: 'CAM 11',
    title: 'LIVE PERFORMANCE STREAM',
    description: 'Live set imagery and crowd visuals.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%201%20Track%20Artwork.jpg')), title: 'LIVE STREAM RC' },
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%201.jpg')), title: 'LIVE STREAM KC' },
    ],
  },
  {
    id: 'cam_12',
    camTag: 'CAM 12',
    title: 'MASTER SURVEILLANCE FEED',
    description: 'Master CCTV security monitor composite stream.',
    items: [
      { src: proxyUrl(getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%204.jpg')), title: 'MASTER FEED KC4' },
      { src: proxyUrl(getStorageUrl('/Mixes/Corner%20New%20Cross/Mix%20Artwork/CNC%20N1%20Artwork.png')), title: 'MASTER FEED CNC1' },
      { src: proxyUrl(getStorageUrl('/Mixes/Royal%20Court/Mix%20Artwork/Royal%20Court%20Session%202%20Track%20Artwork.jpg')), title: 'MASTER FEED RC2' },
    ],
  },
];

export default function GalleryClient() {
  const [albums, setAlbums] = useState<CCTVAlbum[]>(INITIAL_CCTV_ALBUMS);
  const [currentMediaIndices, setCurrentMediaIndices] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Modal / Lightbox state
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState<number | null>(null);
  const [lightboxItemIndex, setLightboxItemIndex] = useState<number>(0);

  // Load dynamic imagery from Sanity CMS & storage gracefully using Promise.allSettled
  useEffect(() => {
    async function loadDynamicGallery() {
      try {
        const results = await Promise.allSettled([
          client.fetch<any[]>(`*[_type == "galleryImage" && defined(imageFile)]`),
          client.fetch<any[]>(`*[_type == "mix" && defined(artworkFile)]`)
        ]);

        const galleryDocs = results[0].status === 'fulfilled' ? results[0].value : [];
        const mixesDocs = results[1].status === 'fulfilled' ? results[1].value : [];

        let dynamicMe: GalleryItem[] = [];
        let dynamicArtwork: GalleryItem[] = [];

        if (Array.isArray(galleryDocs) && galleryDocs.length > 0) {
          galleryDocs.forEach(d => {
            const url = proxyUrl(getStorageUrl(d.imageFile));
            const title = (d.title || 'UNTITLED').toUpperCase();
            if (d.category === 'me') {
              dynamicMe.push({ src: url, title });
            } else if (d.category === 'artwork') {
              dynamicArtwork.push({ src: url, title });
            }
          });
        }

        if (Array.isArray(mixesDocs) && mixesDocs.length > 0) {
          mixesDocs.forEach(mix => {
            const url = proxyUrl(getStorageUrl(mix.artworkFile));
            const title = (mix.title || 'ARTWORK').toUpperCase();
            dynamicArtwork.push({ src: url, title });
          });
        }

        setAlbums(prev => {
          return prev.map((album) => {
            if ((album.id === 'cam_01' || album.id === 'cam_07' || album.id === 'cam_12') && dynamicArtwork.length > 0) {
              const merged = [...album.items, ...dynamicArtwork];
              const unique = merged.filter((v, i, a) => a.findIndex(t => t.src === v.src) === i);
              return { ...album, items: unique };
            }
            if ((album.id === 'cam_02' || album.id === 'cam_05' || album.id === 'cam_10') && dynamicMe.length > 0) {
              const merged = [...album.items, ...dynamicMe];
              const unique = merged.filter((v, i, a) => a.findIndex(t => t.src === v.src) === i);
              return { ...album, items: unique };
            }
            return album;
          });
        });
      } catch (err) {
        console.warn('Sanity dynamic gallery fetch skipped or offline:', err);
      }
    }
    loadDynamicGallery();
  }, []);

  // Preload all unique gallery images in browser memory to eliminate image cycle lag and reduce R2 operations
  useEffect(() => {
    if (typeof window === 'undefined') return;
    albums.forEach(album => {
      album.items.forEach(item => {
        if (item.src) {
          const img = new window.Image();
          img.src = item.src;
        }
      });
    });
  }, [albums]);

  // Staggered media swapping interval for CCTV screens (cycles 1 random camera feed every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomScreenIndex = Math.floor(Math.random() * albums.length);
      setCurrentMediaIndices(prev => {
        const next = [...prev];
        const album = albums[randomScreenIndex];
        if (album && album.items.length > 0) {
          next[randomScreenIndex] = (next[randomScreenIndex] + 1) % album.items.length;
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [albums]);

  // Open Carousel Modal for selected CCTV screen
  const openCarousel = (screenIndex: number) => {
    playClick(900, 'sine', 0.04);
    setSelectedAlbumIndex(screenIndex);
    setLightboxItemIndex(currentMediaIndices[screenIndex] || 0);
  };

  const closeCarousel = () => {
    playClick(700, 'triangle', 0.04);
    setSelectedAlbumIndex(null);
  };

  const handleNextMedia = useCallback(() => {
    if (selectedAlbumIndex === null) return;
    playClick(800, 'sine', 0.03);
    const album = albums[selectedAlbumIndex];
    setLightboxItemIndex(prev => (prev + 1) % album.items.length);
  }, [selectedAlbumIndex, albums]);

  const handlePrevMedia = useCallback(() => {
    if (selectedAlbumIndex === null) return;
    playClick(800, 'sine', 0.03);
    const album = albums[selectedAlbumIndex];
    setLightboxItemIndex(prev => (prev - 1 + album.items.length) % album.items.length);
  }, [selectedAlbumIndex, albums]);

  // Keyboard navigation for Modal Carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedAlbumIndex === null) return;
      if (e.key === 'Escape') {
        closeCarousel();
      } else if (e.key === 'ArrowRight') {
        handleNextMedia();
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAlbumIndex, handleNextMedia, handlePrevMedia]);

  const selectedAlbum = selectedAlbumIndex !== null ? albums[selectedAlbumIndex] : null;
  const currentItem = selectedAlbum ? selectedAlbum.items[lightboxItemIndex] : null;

  return (
    <main className="fixed inset-0 pt-12 md:pt-24 pb-2 px-2 md:px-3 w-full h-full flex flex-col bg-transparent selection:bg-primary/30 selection:text-primary font-mono select-none overflow-hidden">
      {/* Fullscreen 12-Screen CCTV Matrix (4 Columns x 3 Rows on Desktop) */}
      <div className="flex-1 w-full h-full p-1 md:p-1.5 bg-black rounded-none border border-zinc-900 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-rows-6 sm:grid-rows-4 lg:grid-rows-3 gap-1 md:gap-1.5 overflow-hidden">
        {albums.map((album, screenIndex) => {
          const activeMediaIndex = currentMediaIndices[screenIndex] % (album.items.length || 1);
          const mediaItem = album.items[activeMediaIndex] || album.items[0];

          return (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: screenIndex * 0.02 }}
              onClick={() => openCarousel(screenIndex)}
              onMouseEnter={() => playTick()}
              className="group relative w-full h-full bg-zinc-950 border border-zinc-900 rounded-none overflow-hidden cursor-pointer select-none transition-all duration-300 hover:border-primary/60"
            >
              {/* Media Display */}
              {mediaItem && (
                <div className="relative w-full h-full overflow-hidden bg-black">
                  <Image
                    src={mediaItem.src}
                    alt={album.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    unoptimized={true}
                    className="object-cover w-full h-full transition-all duration-500 filter grayscale-[100%] brightness-[0.9] contrast-[1.2] group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 group-hover:scale-105"
                  />
                </div>
              )}

              {/* CCTV #D30F31 Color Tint Overlay (Removes on hover) */}
              <div className="absolute inset-0 bg-[#D30F31] mix-blend-multiply opacity-85 pointer-events-none z-10 transition-opacity duration-400 group-hover:opacity-0" />

              {/* Screen Meta HUD Overlay Header */}
              <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-center z-30 pointer-events-none text-[7.5px] md:text-[8.5px] tracking-wider uppercase font-mono">
                <span className="bg-black border border-primary/40 text-primary font-bold px-1 py-0.5 rounded-none">
                  {album.camTag}
                </span>
                <span className="bg-black text-zinc-100 font-bold px-1 py-0.5 rounded-none truncate max-w-[100px] sm:max-w-[150px] border border-zinc-900">
                  {album.title}
                </span>
              </div>

              {/* REC Indicator Footer */}
              <div className="absolute bottom-1.5 right-1.5 z-30 pointer-events-none flex items-center gap-1 bg-black px-1 py-0.5 rounded-none border border-zinc-900">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D30F31] animate-pulse" />
                <span className="text-[#D30F31] text-[7.5px] font-black tracking-widest">REC</span>
              </div>

              {/* Count Indicator Footer */}
              <div className="absolute bottom-1.5 left-1.5 z-30 pointer-events-none bg-black px-1 py-0.5 rounded-none text-[7.5px] text-zinc-400 font-bold border border-zinc-900">
                FILES // {album.items.length}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal / Carousel Lightbox Overlay */}
      <AnimatePresence>
        {selectedAlbum !== null && currentItem !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-black/95 p-4 md:p-8 select-none font-mono"
            onClick={closeCarousel}
          >
            {/* Top Navigation Bar */}
            <div className="absolute top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 z-50 flex justify-between items-center">
              <div className="flex items-center gap-2 bg-black border border-zinc-900 px-3 py-1.5 rounded-none text-xs font-bold text-primary tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#D30F31] animate-pulse" />
                <span>{selectedAlbum.camTag} // {selectedAlbum.title}</span>
              </div>

              <button
                onClick={closeCarousel}
                className="w-10 h-10 rounded-none bg-black border border-zinc-900 hover:border-primary/50 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Media Carousel Stage */}
            <div 
              className="relative flex items-center justify-center w-full max-w-5xl h-[75vh] mx-auto mt-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Carousel Prev Nav Button */}
              <button
                onClick={handlePrevMedia}
                className="absolute left-2 md:left-4 z-50 p-3 md:p-4 rounded-none bg-black border border-primary/40 hover:bg-primary hover:text-black text-white cursor-pointer transition-all duration-200 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Displayed Image */}
              <motion.div
                key={currentItem.src}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                className="relative w-full h-full flex items-center justify-center rounded-none overflow-hidden bg-black border border-zinc-900"
              >
                <Image
                  src={currentItem.src}
                  alt={currentItem.title}
                  fill
                  sizes="100vw"
                  loading="lazy"
                  unoptimized={true}
                  className="object-contain block pointer-events-none"
                />
              </motion.div>

              {/* Carousel Next Nav Button */}
              <button
                onClick={handleNextMedia}
                className="absolute right-2 md:right-4 z-50 p-3 md:p-4 rounded-none bg-black border border-primary/40 hover:bg-primary hover:text-black text-white cursor-pointer transition-all duration-200 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Bottom Caption Bar */}
            <div className="mt-4 text-center z-50 flex flex-col items-center gap-1 select-none">
              <div className="text-xs md:text-sm font-black text-white tracking-widest uppercase">
                {currentItem.title}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                RECORD [{lightboxItemIndex + 1} / {selectedAlbum.items.length}]
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
