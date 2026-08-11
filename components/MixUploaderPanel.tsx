'use client';

import React, { useState } from 'react';
import { playClick, playTick } from '@/lib/audioUtils';

export default function MixUploaderPanel() {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Knight Club');
  const [bpm, setBpm] = useState<number>(132);
  const [tagsInput, setTagsInput] = useState('#ukgarage, #bassline, #london');
  const [soundcloudLink, setSoundcloudLink] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [artworkUrl, setArtworkUrl] = useState('');
  const [tracklist, setTracklist] = useState('');
  const [cuePointsInput, setCuePointsInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleUploadMix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage('ERROR: Please provide a mix title.');
      return;
    }

    playClick();
    setIsLoading(true);
    setStatusMessage(null);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const parsedCuePoints = cuePointsInput
      .split(',')
      .map(cp => parseInt(cp.trim(), 10))
      .filter(cp => !isNaN(cp));

    try {
      const res = await fetch('/api/studio/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mix',
          data: {
            title,
            genre,
            bpm,
            tags: parsedTags,
            soundcloudLink,
            audioUrl: audioUrl || `/Mixes/${genre}/${title}.mp3`,
            audioFile: audioUrl || `/Mixes/${genre}/${title}.mp3`,
            artworkUrl: artworkUrl || `/Mixes/${genre}/Mix Artwork/${title}.jpg`,
            artworkFile: artworkUrl || `/Mixes/${genre}/Mix Artwork/${title}.jpg`,
            tracklist,
            cuePoints: parsedCuePoints,
          },
        }),
      });

      const data: any = await res.json();
      if (res.ok) {
        setStatusMessage(`✅ MIX "${title}" PUBLISHED SUCCESSFULLY TO SANITY & FRONTEND CATALOG!`);
        setTitle('');
        setTracklist('');
      } else {
        setStatusMessage(`ERROR: ${data.error || 'Failed to save mix'}`);
      }
    } catch (err: any) {
      setStatusMessage(`NETWORK ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 font-mono text-zinc-100 rounded-none shadow-2xl">
      <div className="border-b border-zinc-800 pb-4 mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase font-avathe">
          MIX CATALOG // AUDIO & ARTWORK UPLOADER
        </h2>
        <span className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1 uppercase">
          STORAGE: SANITY + R2
        </span>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-zinc-900 border-l-4 border-[#D8163F] text-sm text-zinc-200 flex justify-between items-center">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleUploadMix} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mix Title */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              1. MIX TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Knight Club: Session 6 - Midnight Garage"
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            />
          </div>

          {/* Genre / Series Selector */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              2. GENRE / SERIES
            </label>
            <select
              value={genre}
              onChange={e => { playTick(); setGenre(e.target.value); }}
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            >
              <option value="Knight Club">Knight Club Series</option>
              <option value="Royal Court">Royal Court Residency</option>
              <option value="Corner New Cross">Corner New Cross Gigs</option>
              <option value="UK Garage">UK Garage Special</option>
              <option value="Liquid DnB">Liquid Drum & Bass</option>
              <option value="Deep House">Deep House / Techno</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BPM */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              3. TEMPO (BPM)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="w-full bg-zinc-900 text-[#D8163F] font-bold text-lg px-3 py-1.5 border border-zinc-800 font-mono focus:outline-none"
              />
              <span className="text-xs text-zinc-500 font-bold">BPM</span>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              4. TAGS (HASHTAGS SEPARATED BY COMMA)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="#ukgarage, #bassline, #2step, #london"
              className="w-full bg-zinc-900 text-zinc-200 px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            />
          </div>
        </div>

        {/* File / URL Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              5. AUDIO FILE URL / R2 PATH
            </label>
            <input
              type="text"
              value={audioUrl}
              onChange={e => setAudioUrl(e.target.value)}
              placeholder="/Mixes/Knight Club/Session6.mp3 or direct URL"
              className="w-full bg-zinc-900 text-zinc-300 px-3 py-2 text-xs border border-zinc-800 font-mono focus:outline-none"
            />
          </div>

          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              6. COVER ARTWORK URL / R2 PATH
            </label>
            <input
              type="text"
              value={artworkUrl}
              onChange={e => setArtworkUrl(e.target.value)}
              placeholder="/Mixes/Knight Club/Artwork/Session6.jpg"
              className="w-full bg-zinc-900 text-zinc-300 px-3 py-2 text-xs border border-zinc-800 font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* SoundCloud Link */}
        <div className="bg-black border border-zinc-800 p-4 space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            7. SOUNDCLOUD LINK (OPTIONAL)
          </label>
          <input
            type="url"
            value={soundcloudLink}
            onChange={e => setSoundcloudLink(e.target.value)}
            placeholder="https://soundcloud.com/henryix/knight-club-session-6"
            className="w-full bg-zinc-900 text-zinc-300 px-3 py-2 text-xs border border-zinc-800 font-mono focus:outline-none"
          />
        </div>

        {/* Tracklist & Cue Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              8. TRACKLIST (ONE SONG PER LINE)
            </label>
            <textarea
              rows={5}
              value={tracklist}
              onChange={e => setTracklist(e.target.value)}
              placeholder={`01. MJ Cole - Sincere\n02. Wookie - Scrappy\n03. Todd Edwards - Saved My Life`}
              className="w-full bg-zinc-900 text-zinc-200 p-3 text-xs border border-zinc-800 font-mono focus:outline-none"
            />
          </div>

          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              9. CUE POINTS TIMESTAMPS (MS, SEPARATED BY COMMA)
            </label>
            <textarea
              rows={5}
              value={cuePointsInput}
              onChange={e => setCuePointsInput(e.target.value)}
              placeholder="0, 180000, 360000, 540000"
              className="w-full bg-zinc-900 text-zinc-200 p-3 text-xs border border-zinc-800 font-mono focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#D8163F] hover:bg-red-600 text-white font-bold font-mono tracking-widest uppercase text-sm border border-red-500 shadow-[0_0_20px_rgba(216,22,63,0.5)] transition-all disabled:opacity-50"
        >
          {isLoading ? 'UPLOADING & PUBLISHING...' : '💾 PUBLISH MIX TO FRONTEND CATALOG'}
        </button>
      </form>
    </div>
  );
}
