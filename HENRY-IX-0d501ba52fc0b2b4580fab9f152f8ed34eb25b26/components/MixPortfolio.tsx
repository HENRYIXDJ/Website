'use client';

import React, { useState, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { client } from '@/sanity/lib/client';
import { STATIC_MIX_GROUPS, proxyUrl } from '@/lib/mixes';
import { getStorageUrl } from '@/lib/storage';
import { audioEngine } from '@/lib/AudioEngine';
import MixArchive from './MixArchive';

export default function MixPortfolio({ 
  isDepth = true, 
  activeView: initialActiveView = 'cdj' 
}: { 
  isDepth?: boolean; 
  activeView?: 'cdj' | 'tracklist'; 
}) {
  const [activeView, setActiveView] = useState<'cdj' | 'tracklist'>(initialActiveView);
  const [mixGroups, setMixGroups] = useState<any[]>(() => {
    return STATIC_MIX_GROUPS.map(group => ({
      ...group,
      mixes: (group.mixes || []).filter(mix => mix.url || mix.link)
    })).filter(group => group.mixes.length > 0);
  });

  // Reactive deck state from Zustand — granular subscriptions, no cascade
  const leftActiveDeck = useAudioStore(s => s.leftActiveDeck);
  const setDecks = useAudioStore(s => s.setDecks);

  // Reference directly from the audioEngine singleton
  const togglePlayGlobal = audioEngine.togglePlayGlobal.bind(audioEngine);
  const seekLocalBuffer = audioEngine.seekLocalBuffer.bind(audioEngine);

  const widgetRefs = { current: audioEngine.widgetRefs };

  const seekDeckToTime = React.useCallback((deckId: number, seekPosSec: number) => {
    const deck = useAudioStore.getState().decks[deckId];
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
  }, [widgetRefs, seekLocalBuffer, setDecks]);

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
      const deck = useAudioStore.getState().decks[activeDeckId];
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
  }, [leftActiveDeck, seekDeckToTime, togglePlayGlobal, setDecks]);

  useEffect(() => {
    async function loadDynamicMixes() {
      try {
        const data = await client.fetch<any[]>(`*[_type == "mixGroup"]{
          title,
          slug,
          description,
          mixes[]->{
            _id,
            title,
            slug,
            bpm,
            soundcloudLink,
            audioFile,
            artworkFile,
            tracklist,
            cuePoints
          }
        }`);

        if (data && data.length > 0) {
          const formatted = data
            .map(group => {
              const filteredMixes = (group.mixes || [])
                .filter((mix: any) => mix.audioFile || mix.soundcloudLink)
                .map((mix: any) => ({
                  id: mix._id,
                  title: mix.title,
                  url: mix.audioFile ? proxyUrl(getStorageUrl(mix.audioFile)) : mix.soundcloudLink || '',
                  link: mix.soundcloudLink || '',
                  bpm: mix.bpm || 120,
                  cuePoints: mix.cuePoints || [],
                  tracklist: mix.tracklist || '',
                  artworkUrl: mix.artworkFile ? getStorageUrl(mix.artworkFile) : undefined
                }));
              return {
                title: group.title,
                mixes: filteredMixes
              };
            })
            .filter(group => group.mixes.length > 0);

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
                artworkUrl: kc1.artworkUrl,
                tracklist: kc1.tracklist
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
                artworkUrl: kc2.artworkUrl,
                tracklist: kc2.tracklist
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
                artworkUrl: kc3.artworkUrl,
                tracklist: kc3.tracklist
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
                artworkUrl: kc4.artworkUrl,
                tracklist: kc4.tracklist
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
      mixGroups={mixGroups}
      seekDeckToTime={seekDeckToTime}
    />
  );
}
