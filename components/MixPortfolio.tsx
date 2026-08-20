'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAudioStore } from '@/store/audioStore';
import { safeSanityFetch } from '@/sanity/lib/client';
import { STATIC_MIX_GROUPS, proxyUrl } from '@/lib/mixes';
import { getStorageUrl } from '@/lib/storage';
import { audioEngine } from '@/lib/AudioEngine';

const MixArchive = dynamic(() => import('./MixArchive'), { ssr: false });

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

  const widgetRefs = React.useRef(audioEngine.widgetRefs);
  React.useEffect(() => {
    widgetRefs.current = audioEngine.widgetRefs;
  });

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
        const [groupsData, standaloneMixesData] = await Promise.all([
          safeSanityFetch<any[]>(`*[_type == "mixGroup"]{
            title,
            slug,
            description,
            mixes[]->{
              _id,
              title,
              slug,
              bpm,
              genre,
              tags,
              soundcloudLink,
              audioFile,
              audioUrl,
              artworkFile,
              artworkUrl,
              tracklist,
              cuePoints
            }
          }`),
          safeSanityFetch<any[]>(`*[_type == "mix"] | order(publishedAt desc, _createdAt desc){
            _id,
            title,
            slug,
            bpm,
            genre,
            tags,
            soundcloudLink,
            audioFile,
            audioUrl,
            artworkFile,
            artworkUrl,
            tracklist,
            cuePoints
          }`)
        ]);

        const groupFormatted = (groupsData || [])
          .map((group: any) => {
            const filteredMixes = (group.mixes || [])
              .filter((mix: any) => mix.audioFile || mix.audioUrl || mix.soundcloudLink)
              .map((mix: any) => ({
                id: mix._id,
                title: mix.title,
                url: mix.audioUrl ? mix.audioUrl : (mix.audioFile ? proxyUrl(getStorageUrl(mix.audioFile)) : mix.soundcloudLink || ''),
                link: mix.soundcloudLink || '',
                bpm: mix.bpm || 120,
                genre: mix.genre || 'UK Garage',
                tags: mix.tags || [],
                cuePoints: mix.cuePoints || [],
                tracklist: mix.tracklist || '',
                artworkUrl: mix.artworkUrl ? mix.artworkUrl : (mix.artworkFile ? getStorageUrl(mix.artworkFile) : undefined)
              }));
            return {
              title: group.title,
              mixes: filteredMixes
            };
          })
          .filter((group: any) => group.mixes.length > 0);

        if (standaloneMixesData && standaloneMixesData.length > 0) {
          const formattedStandalone = standaloneMixesData
            .filter((mix: any) => mix.audioFile || mix.audioUrl || mix.soundcloudLink)
            .map((mix: any) => ({
              id: mix._id,
              title: mix.title,
              url: mix.audioUrl ? mix.audioUrl : (mix.audioFile ? proxyUrl(getStorageUrl(mix.audioFile)) : mix.soundcloudLink || ''),
              link: mix.soundcloudLink || '',
              bpm: mix.bpm || 120,
              genre: mix.genre || 'UK Garage',
              tags: mix.tags || [],
              cuePoints: mix.cuePoints || [],
              tracklist: mix.tracklist || '',
              artworkUrl: mix.artworkUrl ? mix.artworkUrl : (mix.artworkFile ? getStorageUrl(mix.artworkFile) : undefined)
            }));

          if (formattedStandalone.length > 0) {
            groupFormatted.unshift({
              title: 'STUDIO UPLOADS & RELEASES',
              mixes: formattedStandalone
            });
          }
        }

        if (groupFormatted.length > 0) {
          setMixGroups(groupFormatted);

          const allMixes = groupFormatted.flatMap((g: any) => g.mixes);
          setDecks((prevDecks: any) => {
            const updated = { ...prevDecks };
            const kc1 = allMixes.find((m: any) => m.title.includes('Knight Club') && m.title.includes('Session 1')) || allMixes[0];
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
            return updated;
          });
        }
      } catch (err) {
        console.warn('Dynamic mix portfolio fetch skipped or offline:', err);
      }
    }
    loadDynamicMixes();
  }, [setDecks]);

  // Preload all mix artwork images in browser cache for zero lag on hover/selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    mixGroups.forEach(group => {
      group.mixes.forEach((mix: any) => {
        const imgUrl = mix.artworkUrl ? proxyUrl(mix.artworkUrl) : null;
        if (imgUrl) {
          const img = new window.Image();
          img.src = imgUrl;
        }
      });
    });
  }, [mixGroups]);

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
