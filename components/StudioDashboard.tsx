'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OBSStreamControl from './OBSStreamControl';
import MixUploaderPanel from './MixUploaderPanel';
import PodcastStudioPanel from './PodcastStudioPanel';
import SocialSyncPanel from './SocialSyncPanel';
import GalleryAlbumOrganizer from './GalleryAlbumOrganizer';
import AsciiDitherGlitch from './AsciiDitherGlitch';
import { playClick } from '@/lib/audioUtils';

interface StudioDashboardProps {
  children?: React.ReactNode; // Embedded NextStudio component passed from page
}

type TabType = 'broadcast' | 'mixes' | 'podcast' | 'social' | 'gallery' | 'cms';

export default function StudioDashboard({ children }: StudioDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('broadcast');

  const handleTabChange = (tab: TabType) => {
    playClick();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-mono relative overflow-x-hidden selection:bg-[#D8163F] selection:text-white pt-24 pb-20 px-4 sm:px-8">
      {/* Background Dither Overlay */}
      <div className="absolute inset-0 bayer-dither opacity-10 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Studio Top Skeuomorphic Console Banner */}
        <div className="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-white uppercase font-avathe drop-shadow-[0_0_15px_rgba(216,22,63,0.4)] flex items-center space-x-4">
                <span>HENRY IX // STUDIO CONTROL ROOM</span>
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1 tracking-wider uppercase">
                OBS LIVE STREAMING • MULTI-PLATFORM • MIX & PODCAST PUBLISHER • GALLERY ALBUMS
              </p>
            </div>

            {/* Hardware Telemetry Monitors */}
            <div className="flex items-center space-x-6 text-xs font-mono">
              <div className="bg-black border border-zinc-800 px-3 py-1.5 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400">DOMAIN:</span>
                <span className="text-white font-bold">HENRYIX.COM</span>
              </div>
              <div className="bg-black border border-zinc-800 px-3 py-1.5 flex items-center space-x-2 hidden sm:flex">
                <span className="text-zinc-400">ENCODER:</span>
                <span className="text-[#D8163F] font-bold">1080P60 H.264</span>
              </div>
            </div>
          </div>

          {/* Skeuomorphic Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-5">
            {[
              { id: 'broadcast', label: '🔴 OBS BROADCAST' },
              { id: 'mixes', label: '🎛 MIX MANAGER' },
              { id: 'podcast', label: '🎙 PODCAST HUB' },
              { id: 'social', label: '⚡ SOCIAL & EMAIL' },
              { id: 'gallery', label: '📷 GALLERY ALBUMS' },
              { id: 'cms', label: '🛠 SANITY CMS' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider font-mono border transition-all ${
                    isActive
                      ? 'bg-[#D8163F] text-white border-[#D8163F] shadow-[0_0_20px_rgba(216,22,63,0.5)]'
                      : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'broadcast' && <OBSStreamControl />}
            {activeTab === 'mixes' && <MixUploaderPanel />}
            {activeTab === 'podcast' && <PodcastStudioPanel />}
            {activeTab === 'social' && <SocialSyncPanel />}
            {activeTab === 'gallery' && <GalleryAlbumOrganizer />}
            {activeTab === 'cms' && (
              <div className="bg-zinc-950 border-2 border-zinc-800 p-4 shadow-2xl">
                <div className="border-b border-zinc-800 pb-3 mb-4 flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 uppercase font-bold">EMBEDDED SANITY STUDIO DIRECT ACCESS</span>
                  <span className="text-[#D8163F]">ROUTE: /STUDIO</span>
                </div>
                <div className="min-h-[700px] border border-zinc-800 bg-black">
                  {children}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
