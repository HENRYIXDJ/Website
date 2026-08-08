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
      className={`fixed bottom-0 left-0 right-0 z-30 py-4 px-6 md:px-12 bg-transparent select-none font-mono text-[10px] text-zinc-500 transition-opacity duration-300 ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Copyright (Clean text - no red dot) */}
        <div className="font-bold text-zinc-500 uppercase tracking-widest">
          HENRY IX © {new Date().getFullYear()} ALL RIGHTS RESERVED
        </div>

        {/* Legal Links (Professional spacing & typography) */}
        <div className="flex items-center gap-4 uppercase tracking-widest font-bold text-[10px]">
          <Link 
            href="/privacy" 
            className="hover:text-zinc-200 transition-colors cursor-pointer"
          >
            PRIVACY POLICY
          </Link>
          <span className="text-zinc-700">•</span>
          <button
            onClick={openPreferences}
            className="hover:text-zinc-200 transition-colors cursor-pointer uppercase text-[10px]"
          >
            COOKIE PREFERENCES
          </button>
        </div>

      </div>
    </footer>
  );
}
