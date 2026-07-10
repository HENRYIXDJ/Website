'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { playClick, playTick, playNavSwoosh } from '@/lib/audioUtils';

const navLinks = [
  { name: 'MIXES', href: '/mixes' },
  { name: 'GALLERY', href: '/gallery' },
  { name: 'EVENTS', href: '/events' },
  { name: 'CONTACT', href: '/contact' },
];

const pageTitles: Record<string, string> = {
  '/mixes': '01 / MIXES',
  '/gallery': '02 / GALLERY',
  '/events': '03 / EVENTS',
  '/contact': '04 / CONTACT',
};

export default function SiteHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || '';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-16 z-50 bg-black border-b border-zinc-900 flex items-center justify-between px-6">
      {/* Left: Section Title & Social Links (Hidden on mobile to prevent overlaps) */}
      <div className="font-mono text-[10px] md:text-xs tracking-[0.2em] font-semibold uppercase text-zinc-400 w-1/4 hidden md:flex items-center gap-3 justify-start select-none">
        {title && <span>{title}</span>}
        {title && <span className="text-zinc-800 font-light">|</span>}
        <div className="flex items-center gap-2.5">
          <a
            href="https://soundcloud.com/henryixdj"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-[9px] tracking-[0.2em]"
            onMouseEnter={() => playTick()}
            onClick={() => playClick(800, 'sine', 0.03)}
          >
            SC
          </a>
          <span className="text-zinc-800 font-light text-[8px]">/</span>
          <a
            href="https://www.instagram.com/henryixdj/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-[9px] tracking-[0.2em]"
            onMouseEnter={() => playTick()}
            onClick={() => playClick(800, 'sine', 0.03)}
          >
            IG
          </a>
          <span className="text-zinc-800 font-light text-[8px]">/</span>
          <a
            href="https://www.youtube.com/@HenryIXDJ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-[9px] tracking-[0.2em]"
            onMouseEnter={() => playTick()}
            onClick={() => playClick(800, 'sine', 0.03)}
          >
            YT
          </a>
        </div>
      </div>

      {/* Center/Left: Logo */}
      <div className="w-full md:w-2/4 flex justify-start md:justify-center">
        <Link
          href="/"
          className="glitch font-sans font-bold text-xl md:text-2xl text-primary cursor-pointer select-none"
          data-text="HENRY IX"
        >
          HENRY IX
        </Link>
      </div>

      {/* Right: Navigation / Menu */}
      <div className="w-auto md:w-1/4 flex items-center justify-end relative" ref={dropdownRef}>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => playNavSwoosh()}
              onMouseEnter={() => playTick()}
              className={`font-mono text-[10px] tracking-widest uppercase transition-colors shrink-0 ${
                pathname === link.href
                  ? 'text-primary'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => {
            playClick();
            setIsOpen(!isOpen);
          }}
          onMouseEnter={() => playTick()}
          className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700 font-mono text-[9px] tracking-widest uppercase transition-all duration-150 select-none cursor-pointer"
        >
          <span>MENU</span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="inline-block"
          >
            <ChevronDown size={10} className="text-zinc-400" />
          </motion.span>
        </button>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-[2.5rem] w-44 bg-black/95 backdrop-blur-md border border-zinc-800/80 rounded-md overflow-hidden z-50 shadow-[0_10px_30px_rgba(0,0,0,0.9),_0_0_20px_rgba(216,22,63,0.05)]"
            >
              <div className="flex flex-col py-1 font-mono">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      playNavSwoosh();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => playTick()}
                    className={`px-4 py-2.5 text-[9px] tracking-widest uppercase transition-all duration-150 border-l-2 flex items-center justify-between ${
                      pathname === link.href
                        ? 'border-primary text-primary bg-zinc-900/30'
                        : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span>{link.name}</span>
                    {pathname === link.href && (
                      <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_#d8163f]" />
                    )}
                  </Link>
                ))}
                {/* Mobile Social Links */}
                <div className="border-t border-zinc-900 mt-1 py-2 px-4 flex items-center justify-between text-[8px] tracking-[0.2em]">
                  <a
                    href="https://soundcloud.com/henryixdj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-primary transition-all duration-300"
                    onMouseEnter={() => playTick()}
                    onClick={() => playClick(800, 'sine', 0.03)}
                  >
                    SC
                  </a>
                  <span className="text-zinc-800 font-light">/</span>
                  <a
                    href="https://www.instagram.com/henryixdj/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-primary transition-all duration-300"
                    onMouseEnter={() => playTick()}
                    onClick={() => playClick(800, 'sine', 0.03)}
                  >
                    IG
                  </a>
                  <span className="text-zinc-800 font-light">/</span>
                  <a
                    href="https://www.youtube.com/@HenryIXDJ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-primary transition-all duration-300"
                    onMouseEnter={() => playTick()}
                    onClick={() => playClick(800, 'sine', 0.03)}
                  >
                    YT
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
