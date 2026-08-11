'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SiteFooter() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Only reveal when scrolled down past tabs (250px) and near the bottom
      const isPastTabs = currentScrollY > 250;
      const isAtBottom = currentScrollY + windowHeight >= documentHeight - 50;

      if (isPastTabs && isAtBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openPreferences = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
    }
  };

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-30 py-3.5 px-6 md:px-12 bg-black/95 backdrop-blur-md border-t border-zinc-900 select-none font-mono text-[10px] text-zinc-500 transition-opacity duration-300 ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        
        {/* Promotional Portfolio & DMCA Copyright Disclaimer */}
        <div className="text-[9px] text-zinc-400 leading-normal max-w-5xl tracking-tight">
          <span className="text-zinc-400 font-bold uppercase tracking-wider">Promotional Disclaimer:</span> All DJ mixes and audio streams on this website are provided strictly for promotional portfolio purposes to showcase live performance and mixing techniques. All rights to underlying musical compositions and master recordings belong to their respective original artists, producers, and record labels. For copyright or DMCA inquiries, contact{' '}
          <a href="mailto:sitereporting@henryix.com" className="text-zinc-300 underline hover:text-primary transition-colors">
            sitereporting@henryix.com
          </a>.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1.5 border-t border-zinc-900/80">
          {/* Copyright */}
          <div className="font-bold text-zinc-400 uppercase tracking-widest text-[9px]">
            HENRY IX © {new Date().getFullYear()} ALL RIGHTS RESERVED
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 uppercase tracking-widest font-bold text-[9px]">
            <Link 
              href="/privacy" 
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              PRIVACY POLICY
            </Link>
            <span className="text-zinc-700">•</span>
            <button
              onClick={openPreferences}
              className="hover:text-zinc-200 transition-colors cursor-pointer uppercase text-[9px]"
            >
              COOKIE PREFERENCES
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
