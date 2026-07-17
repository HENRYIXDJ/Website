'use client';

import React, { useState, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { useAudio } from './AudioProvider';
import { client } from '@/sanity/lib/client';
import { STATIC_MIX_GROUPS, proxyUrl } from '@/lib/mixes';
import { getStorageUrl } from '@/lib/storage';
import MixArchive from './MixArchive';

export default function MixPortfolio({ 
  isDepth = true, 
  activeView: initialActiveView = 'cdj' 
}: { 
  isDepth?: boolean; 
  activeView?: 'cdj' | 'tracklist'; 
}) {
  const [activeView, setActiveView] = useState<'cdj' | 'tracklist'>(initialActiveView);
  const [mixGroups, setMixGroups] = useState<any[]>(STATIC_MIX_GROUPS);

  // Reactive deck state from Zustand — granular subscriptions, no cascade
  const decks = useAudioStore(s => s.decks);
  const crossfader = useAudioStore(s => s.crossfader);
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const rightActiveDeck = useAudioStore(s => s.rightActiveDeck);
  const { setDecks, setCrossfader, setLeftActiveDeck, setRightActiveDeck } = useAudioStore();

  // Non-reactive engine refs + imperative functions from context
  const {
    playTrack, playLockoutBlip, togglePlayGlobal,
    widgetRefs, initAudioDSP, loadLocalFile, seekLocalBuffer,
    audioElementsRef, playPendingRef, scratchingRef, alignSyncPlayback
  } = useAudio();

  const seekDeckToTime = React.useCallback((deckId: number, seekPosSec: number) => {
    const deck = decks[deckId];
    if (!deck) return;
    const widget = widgetRefs.current[deckId];
    if (deck.scMode && widget) {
      try {
        widget.seekTo(seekPosSec * 1000);
      } catch (e) {
        setDecks((prev: any) => ({
          ...prev,
          [deckId]: { ...prev[deckId], progress: seekPosSec }
        }));
      }
    } else {
      if (seekLocalBuffer) {
        seekLocalBuffer(deckId, seekPosSec);
      }
      setDecks((prev: any) => ({
        ...prev,
        [deckId]: { ...prev[deckId], progress: seekPosSec }
      }));
    }
  }, [decks, widgetRefs, seekLocalBuffer, setDecks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const activeDeckId = leftActiveDeck;
      const deck = decks[activeDeckId];
      if (!deck) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayGlobal(activeDeckId);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        const currentVolume = deck.volume !== undefined ? deck.volume : 1;
        setDecks((prev: any) => ({
          ...prev,
          [activeDeckId]: { ...prev[activeDeckId], volume: currentVolume > 0 ? 0 : 1 }
        }));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentProgress = deck.progress || 0;
        const newProgress = Math.max(0, currentProgress - 15);
        seekDeckToTime(activeDeckId, newProgress);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const currentProgress = deck.progress || 0;
        const duration = deck.duration || 300;
        const newProgress = Math.min(duration, currentProgress + 15);
        seekDeckToTime(activeDeckId, newProgress);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftActiveDeck, decks, seekDeckToTime, togglePlayGlobal, setDecks]);

  useEffect(() => {
    async function loadDynamicMixes() {
      try {
        const data = await client.fetch<any[]>(`*[_type == "mixGroup"]{
          title,
          slug,
          description,
          mixes[]->[defined(audioFile) || defined(muxVideo)]{
            _id,
            title,
            slug,
            bpm,
            soundcloudLink,
            audioFile,
            artworkFile,
            tracklist,
            cuePoints,
            "muxPlaybackId": muxVideo.asset->playbackId
          }
        }`);

        if (data && data.length > 0) {
          const formatted = data.map(group => ({
            title: group.title,
            mixes: (group.mixes || []).map((mix: any) => ({
              id: mix._id,
              title: mix.title,
              url: mix.muxPlaybackId
                ? `https://stream.mux.com/${mix.muxPlaybackId}/audio.m4a`
                : proxyUrl(getStorageUrl(mix.audioFile || '')),
              link: mix.soundcloudLink || '',
              bpm: mix.bpm || 120,
              cuePoints: mix.cuePoints || [],
              tracklist: mix.tracklist || '',
              artworkUrl: mix.artworkFile ? proxyUrl(getStorageUrl(mix.artworkFile)) : undefined
            }))
          }));

          setMixGroups(formatted);

          // Update decks dynamically from loaded mixes
          const allMixes = formatted.flatMap(g => g.mixes);
          
          setDecks((prevDecks: any) => {
            const updated = { ...prevDecks };
            const kc1 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 1'));
            if (kc1 && updated[1]) {
              updated[1] = {
                ...updated[1],
                id: kc1.id,
                title: kc1.title,
                url: kc1.url,
                link: kc1.link,
                bpm: kc1.bpm,
                cuePoints: kc1.cuePoints,
                artworkUrl: kc1.artworkUrl
              };
            }
            const kc2 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 2'));
            if (kc2 && updated[2]) {
              updated[2] = {
                ...updated[2],
                id: kc2.id,
                title: kc2.title,
                url: kc2.url,
                link: kc2.link,
                bpm: kc2.bpm,
                cuePoints: kc2.cuePoints,
                artworkUrl: kc2.artworkUrl
              };
            }
            const kc3 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 3'));
            if (kc3 && updated[3]) {
              updated[3] = {
                ...updated[3],
                id: kc3.id,
                title: kc3.title,
                url: kc3.url,
                link: kc3.link,
                bpm: kc3.bpm,
                cuePoints: kc3.cuePoints,
                artworkUrl: kc3.artworkUrl
              };
            }
            const kc4 = allMixes.find(m => m.title.includes('Knight Club') && m.title.includes('Session 4'));
            if (kc4 && updated[4]) {
              updated[4] = {
                ...updated[4],
                id: kc4.id,
                title: kc4.title,
                url: kc4.url,
                link: kc4.link,
                bpm: kc4.bpm,
                cuePoints: kc4.cuePoints,
                artworkUrl: kc4.artworkUrl
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic mixes from Sanity, falling back to static database:', String(err));
      }
    }
    loadDynamicMixes();
  }, [setDecks]);

  return (
    <MixArchive 
      isDepth={isDepth} 
      activeView={activeView} 
      setActiveView={setActiveView}
      decks={decks}
      setDecks={setDecks}
      mixGroups={mixGroups}
      crossfader={crossfader}
      setCrossfader={setCrossfader}
      leftActiveDeck={leftActiveDeck}
      setLeftActiveDeck={setLeftActiveDeck}
      rightActiveDeck={rightActiveDeck}
      setRightActiveDeck={setRightActiveDeck}
      playTrack={playTrack}
      playLockoutBlip={playLockoutBlip}
      togglePlayGlobal={togglePlayGlobal}
      widgetRefs={widgetRefs}
      initAudioDSP={initAudioDSP}
      loadLocalFile={loadLocalFile}
      seekLocalBuffer={seekLocalBuffer}
      audioElementsRef={audioElementsRef}
      playPendingRef={playPendingRef}
      scratchingRef={scratchingRef}
      alignSyncPlayback={alignSyncPlayback}
      seekDeckToTime={seekDeckToTime}
    />
  );
}
