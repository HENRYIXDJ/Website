'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SiFacebook, SiInstagram, SiSoundcloud, SiMixcloud, SiTiktok, SiYoutube, SiTwitch, SiX } from 'react-icons/si';
import { playClick, playTick, playNavSwoosh } from '@/lib/audioUtils';

const navLinks = [
  { name: 'MIXES', href: '/mixes' },
  { name: 'GALLERY', href: '/gallery' },
  { name: 'LIVE', href: '/live' },
  { name: 'EVENTS', href: '/events' },
  { name: 'CONTACT', href: '/contact' },
];

const pageTitles: Record<string, string> = {
  '/mixes': '01 / MIXES',
  '/gallery': '02 / GALLERY',
  '/live': '03 / LIVE',
  '/events': '04 / EVENTS',
  '/contact': '05 / CONTACT',
};

const SocialLink = ({ href, icon, className }: { href: string; icon: React.ReactNode; className?: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`group flex items-center justify-center text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${className || ''}`}
    onMouseEnter={() => playTick()}
    onClick={() => playClick(800, 'sine', 0.03)}
  >
    <div className="text-[16px] md:text-[20px] w-5 md:w-6 h-5 md:h-6 flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.05)] group-hover:drop-shadow-[0_0_12px_rgba(216,22,63,0.4)] transition-all">
      {icon}
    </div>
  </a>
);

export default function SiteHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const title = pageTitles[pathname] || '';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathnameRef.current === '/' && pathname !== '/') {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 1200);
      return () => clearTimeout(timer);
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  // Close dropdown synchronously during render when pathname changes,
  // avoiding the React strict-mode setState-in-useEffect warning.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (isOpen) setIsOpen(false);
  }

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
    <header className="fixed top-0 left-0 w-full h-24 z-50 bg-transparent flex items-center justify-between px-6 md:px-8 pointer-events-none">
      {/* Left: Social Links */}
      <div className="w-auto flex items-center gap-4 md:gap-5 select-none pointer-events-auto -translate-y-1">
        <SocialLink href="https://www.facebook.com/HenryIXDJ/" icon={<SiFacebook />} />
        <SocialLink href="https://x.com/HenryIXDJ" icon={<SiX className="scale-[0.95]" />} />
        <SocialLink href="https://www.instagram.com/henryixdj/" icon={<SiInstagram />} />
        <SocialLink href="https://www.tiktok.com/@henryixdj" icon={<SiTiktok />} />
        <SocialLink href="https://www.youtube.com/@HenryIXDJ" icon={<SiYoutube className="scale-[1.1]" />} />
        <SocialLink href="https://www.twitch.tv/henryixdj" icon={<SiTwitch />} />
        <SocialLink href="https://soundcloud.com/henryixdj" icon={<SiSoundcloud className="scale-[1.35] origin-center -translate-y-[1px]" />} />
        <SocialLink href="https://www.mixcloud.com/HenryIXDJ/" icon={<SiMixcloud className="scale-[1.7] origin-center" />} className="ml-1 md:ml-1.5" />
      </div>

      {/* Center: Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-auto">
        {!isHomePage && (
          <Link
            href="/"
            className="glitch font-sans font-bold text-2xl md:text-3xl tracking-wider leading-none text-primary cursor-pointer select-none"
            data-text="HENRY IX"
          >
            HENRY IX
          </Link>
        )}
      </div>

      {/* Right: Navigation / Menu */}
      <div className="w-auto md:w-1/4 flex items-center justify-end relative pointer-events-auto -translate-y-1" ref={dropdownRef}>
        {!isHomePage && (
          <motion.div
            key={shouldAnimate ? "animate-header-nav" : "static-header-nav"}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.06,
                  delayChildren: 0.02
                }
              }
            }}
            initial={shouldAnimate ? "hidden" : "show"}
            animate="show"
            className="flex items-center justify-end"
          >
            {/* Desktop Navigation */}
            <motion.nav className="hidden md:flex items-center gap-6 shrink-0 leading-none">
              {navLinks.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, y: -6 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => playNavSwoosh()}
                    onMouseEnter={() => playTick()}
                    className={`font-mono text-[9px] md:text-[10px] tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 ${
                      pathname === link.href
                        ? 'text-primary'
                        : 'text-zinc-500 hover:text-primary'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Mobile Menu Button */}
            <motion.button
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
              }}
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
            </motion.button>

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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </header>
  );
}
