'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Preloader, CRTOverlay } from '@/components/DJComponents';
import SiteHeader from '@/components/SiteHeader';
import { useAudioStore } from '@/store/audioStore';

export default function ClientLayoutWrappers() {
  const pathname = usePathname();
  const preloaderComplete = useAudioStore(s => s.preloaderComplete);
  const setPreloaderComplete = useAudioStore(s => s.setPreloaderComplete);

  useEffect(() => {
    if (pathname !== '/' && !preloaderComplete) {
      setPreloaderComplete(true);
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
