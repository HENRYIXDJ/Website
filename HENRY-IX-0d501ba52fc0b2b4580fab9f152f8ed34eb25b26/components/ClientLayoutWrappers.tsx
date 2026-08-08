'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Preloader, CRTOverlay } from '@/components/DJComponents';
import SiteHeader from '@/components/SiteHeader';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import SiteFooter from '@/components/SiteFooter';
import { useAudioStore } from '@/store/audioStore';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function GlobalBackgroundGrid() {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 20, mass: 0.2 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const yBackgroundGrid = useTransform(smoothScrollY, [0, 2000], [0, -160]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-black overflow-hidden">
      {/* Parallax White Lines (#ffffff) Grid on OLED Black (#000000) */}
      <motion.div 
        style={{ y: isMobile ? 0 : yBackgroundGrid }}
        className="absolute -inset-y-40 inset-x-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:80px_80px]"
      />
    </div>
  );
}

export default function ClientLayoutWrappers({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const preloaderComplete = useAudioStore(s => s.preloaderComplete);
  const setPreloaderComplete = useAudioStore(s => s.setPreloaderComplete);
  const isCDJView = useAudioStore(s => s.isCDJView);

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = sessionStorage.getItem('hasVisited');
      if (hasVisited === 'true' && !preloaderComplete) {
        setPreloaderComplete(true);
      } else if (pathname !== '/' && !preloaderComplete) {
        setPreloaderComplete(true);
      }
    }
  }, [pathname, preloaderComplete, setPreloaderComplete]);

  const showPreloader = pathname === '/' && !preloaderComplete;

  return (
    <div className="flex flex-col min-h-screen">
      <GlobalBackgroundGrid />
      {showPreloader && (
        <Preloader onComplete={() => setPreloaderComplete(true)} />
      )}
      <CRTOverlay />
      {!isCDJView && <SiteHeader />}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <CookieConsentBanner />
      {!isCDJView && <SiteFooter />}
    </div>
  );
}
