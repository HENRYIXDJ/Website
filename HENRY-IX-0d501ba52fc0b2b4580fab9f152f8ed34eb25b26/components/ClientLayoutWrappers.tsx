'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Preloader, CRTOverlay } from '@/components/DJComponents';
import SiteHeader from '@/components/SiteHeader';
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
    <motion.div 
      className="fixed inset-x-0 top-0 bottom-[-200px] pointer-events-none z-0 opacity-5"
      style={isMobile ? {} : { y: yBackgroundGrid, willChange: "transform" }}
    >
      <div className="w-full h-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:5rem_5rem]" style={{ backgroundPosition: 'calc(50% - 0.5px) 0' }} />
    </motion.div>
  );
}

export default function ClientLayoutWrappers() {
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
    <>
      <GlobalBackgroundGrid />
      {showPreloader && (
        <Preloader onComplete={() => setPreloaderComplete(true)} />
      )}
      <CRTOverlay />
      {!isCDJView && <SiteHeader />}
    </>
  );
}
