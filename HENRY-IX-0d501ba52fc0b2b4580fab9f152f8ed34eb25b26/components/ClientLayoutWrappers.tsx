'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect } from 'react';
import { Preloader, CRTOverlay } from '@/components/DJComponents';
import SiteHeader from '@/components/SiteHeader';
import { useAudioStore } from '@/store/audioStore';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ClientLayoutWrappers() {
  const pathname = usePathname();
  const preloaderComplete = useAudioStore(s => s.preloaderComplete);
  const setPreloaderComplete = useAudioStore(s => s.setPreloaderComplete);

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
  const isHomePage = pathname === '/';

  return (
    <>
      {showPreloader && (
        <Preloader onComplete={() => setPreloaderComplete(true)} />
      )}
      <CRTOverlay />
      {!isHomePage && <SiteHeader />}
    </>
  );
}
