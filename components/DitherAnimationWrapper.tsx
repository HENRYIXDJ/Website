'use client';

import React, { useRef, useEffect } from 'react';

interface DitherAnimationWrapperProps {
  /** Path to transparent WebM / MP4 video loop exported from After Effects */
  src?: string;
  /** Optional fallback poster image */
  poster?: string;
  className?: string;
  /** Width & height or aspect ratio class */
  aspectRatio?: string;
}

/**
 * Dedicated renderer for custom After Effects animations created with Ditherboy & Script Slayer.
 * Supports transparent WebM (VP9 + Alpha) / MP4 video loops at 60fps with zero performance drop.
 */
export function DitherAnimationWrapper({
  src,
  poster,
  className = '',
  aspectRatio = 'aspect-video',
}: DitherAnimationWrapperProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [src]);

  if (!src) {
    return (
      <div className={`relative bayer-dither border border-zinc-800 flex items-center justify-center p-6 ${aspectRatio} ${className}`}>
        <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
          [ DITHERBOY / SCRIPT SLAYER AE ANIMATION PLACEHOLDER ]
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover pointer-events-none mix-blend-screen"
      />
      {/* Subtle Bayer Dither Halftone Overlay for seamless web integration */}
      <div className="absolute inset-0 bayer-dither opacity-20 pointer-events-none" />
    </div>
  );
}

export default DitherAnimationWrapper;
