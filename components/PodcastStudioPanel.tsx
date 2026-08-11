'use client';

import React, { useState } from 'react';
import { playClick } from '@/lib/audioUtils';

export default function PodcastStudioPanel() {
  const [title, setTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [summary, setSummary] = useState('');
  const [guestsInput, setGuestsInput] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [artworkUrl, setArtworkUrl] = useState('');
  const [duration, setDuration] = useState('00:45:00');
  const [explicit, setExplicit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage('ERROR: Please provide an episode title.');
      return;
    }

    playClick();
    setIsLoading(true);
    setStatusMessage(null);

    const guests = guestsInput.split(',').map(g => g.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/studio/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'podcastEpisode',
          data: {
            title,
            seasonNumber,
            episodeNumber,
            summary,
            guests,
            audioUrl: audioUrl || `/Podcast/Season${seasonNumber}/Ep${episodeNumber}.mp3`,
            artworkUrl: artworkUrl || `/Podcast/Season${seasonNumber}/Artwork.jpg`,
            duration,
            explicit,
          },
        }),
      });

      const data: any = await res.json();
      if (res.ok) {
        setStatusMessage(`✅ PODCAST EPISODE ${episodeNumber} PUBLISHED TO RSS FEED & FRONTEND!`);
        setTitle('');
        setSummary('');
        setEpisodeNumber(prev => prev + 1);
      } else {
        setStatusMessage(`ERROR: ${data.error || 'Failed to publish episode'}`);
      }
    } catch (err: any) {
      setStatusMessage(`NETWORK ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 font-mono text-zinc-100 rounded-none shadow-2xl space-y-6">
      <div className="border-b border-zinc-800 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-widest text-white uppercase font-avathe">
            PODCAST STUDIO // RSS EPISODE PUBLISHER
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Apple Podcasts & Spotify Compliant Feed: <span className="text-[#D8163F]">/api/podcast/rss.xml</span>
          </p>
        </div>
        <a
          href="/api/podcast/rss.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-zinc-900 border border-zinc-700 hover:border-[#D8163F] text-zinc-300 hover:text-white px-3 py-1.5 text-xs font-mono uppercase"
        >
          📄 VIEW RSS XML FEED
        </a>
      </div>

      {statusMessage && (
        <div className="p-4 bg-zinc-900 border-l-4 border-[#D8163F] text-sm text-zinc-200 flex justify-between items-center">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleCreateEpisode} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black border border-zinc-800 p-4 space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              1. EPISODE TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Episode 12: The Evolution of UK Garage & Bass Culture"
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 bg-black border border-zinc-800 p-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                SEASON #
              </label>
              <input
                type="number"
                value={seasonNumber}
                onChange={e => setSeasonNumber(Number(e.target.value))}
                className="w-full bg-zinc-900 text-[#D8163F] font-bold px-3 py-1.5 text-sm border border-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                EPISODE #
              </label>
              <input
                type="number"
                value={episodeNumber}
                onChange={e => setEpisodeNumber(Number(e.target.value))}
                className="w-full bg-zinc-900 text-[#D8163F] font-bold px-3 py-1.5 text-sm border border-zinc-800 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-4 space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            2. SHOW NOTES & EPISODE SUMMARY
          </label>
          <textarea
            rows={4}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="In this episode, Henry IX breaks down classic 90s UK Garage vinyl pressings, production techniques..."
            className="w-full bg-zinc-900 text-zinc-200 p-3 text-xs border border-zinc-800 font-mono focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              3. FEATURED GUESTS (SEPARATED BY COMMA)
            </label>
            <input
              type="text"
              value={guestsInput}
              onChange={e => setGuestsInput(e.target.value)}
              placeholder="DJ EZ, Grant Nelson, Todd Edwards"
              className="w-full bg-zinc-900 text-zinc-200 px-3 py-2 text-xs border border-zinc-800 font-mono"
            />
          </div>

          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              4. DURATION (HH:MM:SS) & EXPLICIT TAG
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="00:45:30"
                className="w-full bg-zinc-900 text-white px-3 py-1.5 text-xs border border-zinc-800 font-mono"
              />
              <label className="flex items-center space-x-2 cursor-pointer select-none text-xs text-zinc-300 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={explicit}
                  onChange={e => setExplicit(e.target.checked)}
                  className="accent-[#D8163F] w-4 h-4"
                />
                <span>EXPLICIT</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              5. AUDIO FILE URL (MP3 / M4A)
            </label>
            <input
              type="text"
              value={audioUrl}
              onChange={e => setAudioUrl(e.target.value)}
              placeholder="https://henryix.com/Podcast/Ep12.mp3 or R2 path"
              className="w-full bg-zinc-900 text-zinc-300 px-3 py-2 text-xs border border-zinc-800 font-mono"
            />
          </div>

          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              6. EPISODE COVER ARTWORK URL
            </label>
            <input
              type="text"
              value={artworkUrl}
              onChange={e => setArtworkUrl(e.target.value)}
              placeholder="https://henryix.com/Podcast/Artwork.jpg"
              className="w-full bg-zinc-900 text-zinc-300 px-3 py-2 text-xs border border-zinc-800 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#D8163F] hover:bg-red-600 text-white font-bold font-mono tracking-widest uppercase text-sm border border-red-500 shadow-[0_0_20px_rgba(216,22,63,0.5)] transition-all disabled:opacity-50"
        >
          {isLoading ? 'PUBLISHING EPISODE...' : '🎙 PUBLISH EPISODE TO APPLE & SPOTIFY RSS FEED'}
        </button>
      </form>
    </div>
  );
}
