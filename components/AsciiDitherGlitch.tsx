'use client';

import React, { useState, useEffect, useRef } from 'react';

const ASCII_DITHER_CHARS = ['█', '▓', '▒', '░', '░', '▒', '▓', '█', '#', '+', '/', '-', '\\', '*'];

interface AsciiDitherGlitchProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
  onClick?: () => void;
}

export function AsciiDitherGlitch({
  text,
  className = '',
  as: Component = 'span',
  onClick,
}: AsciiDitherGlitchProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const triggerGlitch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsGlitching(true);

    let iteration = 0;
    const maxIterations = text.length * 2.5;

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration / 2.5) return text[index];
            const randomIndex = Math.floor(Math.random() * ASCII_DITHER_CHARS.length);
            return ASCII_DITHER_CHARS[randomIndex];
          })
          .join('');
      });

      iteration += 1;
      if (iteration >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsGlitching(false);
      }
    }, 35);
  };

  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    setDisplayText(text);
  }

  return (
    <Component
      onClick={onClick}
      onMouseEnter={triggerGlitch}
      className={`relative inline-block select-none cursor-pointer group ${className}`}
    >
      <span className="relative z-10">{displayText}</span>

      {/* ASCII Dither Glitch Layer 1 (Red Offset) */}
      {isGlitching && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 -translate-x-[2px] text-[#D8163F] opacity-70 pointer-events-none z-0 overflow-hidden"
        >
          {displayText}
        </span>
      )}

      {/* ASCII Dither Glitch Layer 2 (Cyan/Blue Offset) */}
      {isGlitching && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 translate-x-[2px] text-[#22d3ee] opacity-70 pointer-events-none z-0 overflow-hidden"
        >
          {displayText}
        </span>
      )}

      {/* 2-Bit Bayer Dither Texture Overlay */}
      <span className="absolute inset-0 bayer-dither pointer-events-none opacity-30 mix-blend-overlay" />
    </Component>
  );
}

export default AsciiDitherGlitch;
