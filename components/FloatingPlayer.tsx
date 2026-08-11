'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { playClick } from '@/lib/audioUtils';
import { useAudioStore } from '@/store/audioStore';
import { audioEngine } from '@/lib/AudioEngine';
import { PlayheadScrubber } from '@/components/PlayheadScrubber';

export function FloatingPlayer() {
  const pathname = usePathname();
  const decks = useAudioStore(s => s.decks);
  const [userSelectedDeck, setUserSelectedDeck] = React.useState<number | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // Marquee pause-scroll measurement state
  const titleContainerRef = React.useRef<HTMLDivElement>(null);
  const titleTextRef = React.useRef<HTMLSpanElement>(null);
  const [scrollOverflow, setScrollOverflow] = React.useState(0);

  // Active decks logic
  const activeDecks = [1, 2, 3, 4].filter(id => decks[id]?.isPlaying);
  const loadedDecks = [1, 2, 3, 4].filter(id => decks[id]?.isReady || decks[id]?.title);

  // Determine active deck focus
  const selectedDeckId = React.useMemo(() => {
    if (userSelectedDeck && decks[userSelectedDeck]) return userSelectedDeck;
    if (activeDecks.length > 0) return activeDecks[0];
    if (loadedDecks.length > 0) return loadedDecks[0];
    return 1;
  }, [userSelectedDeck, activeDecks, loadedDecks, decks]);

  const deck = decks[selectedDeckId] || decks[1];

  // Measure title marquee overflow
  React.useEffect(() => {
    if (titleTextRef.current && titleContainerRef.current) {
      const containerWidth = titleContainerRef.current.clientWidth;
      const textWidth = titleTextRef.current.scrollWidth;
      const diff = textWidth - containerWidth;
      setScrollOverflow(diff > 4 ? diff + 16 : 0);
    }
  }, [deck?.title, isHovered]);

  const seekDelta = React.useCallback((seconds: number) => {
    if (!deck || !deck.duration) return;
    playClick(1100, 'sine', 0.02);
    const newTime = Math.max(0, Math.min(deck.duration, deck.progress + seconds));
    audioEngine.seekLocalBuffer(selectedDeckId, newTime);
  }, [deck, selectedDeckId]);

  const handleDeckSelect = (deckId: number) => {
    playClick(900, 'sine', 0.02);
    setUserSelectedDeck(deckId);
  };

  // Hide on mixes page or if no deck loaded/available
  if (pathname === '/mixes' || !deck) return null;

  // Symmetrical CDJ Deck Colors
  const deckColors: Record<number, { border: string; bg: string; text: string; glow: string; badge: string }> = {
    1: { border: 'border-red-500/60', bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(211,15,49,0.5)]', badge: 'bg-red-500/20 border-red-500/50 text-red-400' },
    2: { border: 'border-cyan-400/60', bg: 'bg-cyan-400', text: 'text-cyan-400', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.5)]', badge: 'bg-cyan-400/20 border-cyan-400/50 text-cyan-400' },
    3: { border: 'border-emerald-400/60', bg: 'bg-emerald-400', text: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]', badge: 'bg-emerald-400/20 border-emerald-400/50 text-emerald-400' },
    4: { border: 'border-yellow-400/60', bg: 'bg-yellow-400', text: 'text-yellow-400', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.5)]', badge: 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' },
  };

  const activeColor = deckColors[selectedDeckId] || deckColors[1];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-6 right-6 z-[60] bg-black border ${activeColor.border} text-white shadow-2xl shadow-black/90 transition-all duration-300 ease-in-out overflow-hidden select-none ${
        isHovered ? 'w-[300px] sm:w-[340px] p-4 rounded-none' : 'w-[260px] sm:w-[280px] p-2.5 rounded-none'
      }`}
    >
      {/* Dynamic Keyframe Injection for Pause-Scroll Marquee */}
      {scrollOverflow > 0 && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pauseScrollAnim_${selectedDeckId} {
            0%, 20% { transform: translateX(0); }
            60%, 80% { transform: translateX(-${scrollOverflow}px); }
            95%, 100% { transform: translateX(0); }
          }
        ` }} />
      )}

      {/* Header Info Bar */}
      <div className="flex items-center justify-between mb-2">
        {/* Deck Selectors (D1, D2, D3, D4) */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(id => {
            const isSel = selectedDeckId === id;
            const isDeckPlaying = decks[id]?.isPlaying;
            const isDeckReady = decks[id]?.isReady || decks[id]?.title;
            const col = deckColors[id];

            return (
              <button
                key={id}
                onClick={() => handleDeckSelect(id)}
                title={`Switch to Deck ${id}`}
                className={`relative px-2 py-0.5 text-[10px] font-bold font-mono transition-all border ${
                  isSel
                    ? `${col.badge} font-black ${col.glow}`
                    : isDeckReady
                    ? 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                    : 'border-zinc-900 bg-black/60 text-zinc-600 hover:text-zinc-400'
                }`}
              >
                D{id}
                {isDeckPlaying && (
                  <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${col.bg} animate-ping`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Deck Indicator Badge */}
        <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 border ${activeColor.badge}`}>
          DECK {selectedDeckId}
        </span>
      </div>

      {/* Song Title Row with Pause-and-Scroll Marquee */}
      <div className="flex items-center gap-3 mb-2.5">
        <div className="flex-1 overflow-hidden" ref={titleContainerRef}>
          <div
            className="whitespace-nowrap inline-block"
            style={
              scrollOverflow > 0
                ? {
                    animation: `pauseScrollAnim_${selectedDeckId} 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
                  }
                : undefined
            }
          >
            <span ref={titleTextRef} className="text-xs font-bold tracking-wide text-zinc-100 font-mono">
              {deck.title || `Deck ${selectedDeckId} Idle`}
            </span>
          </div>
          {deck.artist && (
            <div className="text-[10px] text-zinc-400 font-mono truncate tracking-tight">
              {deck.artist}
            </div>
          )}
        </div>

        {/* Play/Pause Button (Compact mode) */}
        {!isHovered && (
          <button
            onClick={() => audioEngine.togglePlayGlobal(selectedDeckId)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-transform active:scale-95 ${
              deck.isPlaying ? `${activeColor.bg} text-black ${activeColor.glow}` : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {deck.isPlaying ? (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        )}
      </div>

      {/* Interactive Timeline Scrubber & Time Display */}
      <PlayheadScrubber
        progress={deck.progress}
        duration={deck.duration}
        activeColorBg={activeColor.bg}
        onSeek={(seekTime) => audioEngine.seekLocalBuffer(selectedDeckId, seekTime)}
      />

      {/* Expanded Controls Suite (On Hover) */}
      {isHovered && (
        <div className="mt-3 pt-2.5 border-t border-zinc-900/80 flex items-center justify-center gap-4 transition-all duration-200">
          {/* Rewind 10s */}
          <button
            onClick={() => seekDelta(-10)}
            title="Rewind 10s"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all font-mono text-xs flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
            <span className="text-[9px] font-bold">-10s</span>
          </button>

          {/* Main Expanded Play / Pause Toggle */}
          <button
            onClick={() => audioEngine.togglePlayGlobal(selectedDeckId)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
              deck.isPlaying ? `${activeColor.bg} text-black ${activeColor.glow}` : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {deck.isPlaying ? (
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Fast Forward 10s */}
          <button
            onClick={() => seekDelta(10)}
            title="Fast Forward 10s"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all font-mono text-xs flex items-center gap-1"
          >
            <span className="text-[9px] font-bold">+10s</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
