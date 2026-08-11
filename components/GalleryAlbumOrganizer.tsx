'use client';

import React, { useState } from 'react';
import { playClick, playTick } from '@/lib/audioUtils';

export default function GalleryAlbumOrganizer() {
  const [album, setAlbum] = useState('Knight Club Sessions');
  const [customAlbum, setCustomAlbum] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('me');
  const [imageUrl, setImageUrl] = useState('');
  const [gridClass, setGridClass] = useState('col-span-1 aspect-square');
  const [tagsInput, setTagsInput] = useState('#photography, #livegig');
  const [caption, setCaption] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage('ERROR: Please provide a photo title.');
      return;
    }

    playClick();
    setIsLoading(true);
    setStatusMessage(null);

    const targetAlbum = album === 'NEW_CUSTOM' ? customAlbum : album;
    const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/studio/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'galleryImage',
          data: {
            title,
            album: targetAlbum,
            category,
            imageUrl: imageUrl || `/gallery/${category}/${title}.jpg`,
            imageFile: imageUrl || `/gallery/${category}/${title}.jpg`,
            gridClass,
            tags: parsedTags,
            caption,
          },
        }),
      });

      const data: any = await res.json();
      if (res.ok) {
        setStatusMessage(`✅ PHOTO "${title}" SAVED TO ALBUM "${targetAlbum}" & PUBLISHED TO PUBLIC GALLERY!`);
        setTitle('');
        setCaption('');
      } else {
        setStatusMessage(`ERROR: ${data.error || 'Failed to save photo'}`);
      }
    } catch (err: any) {
      setStatusMessage(`NETWORK ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 font-mono text-zinc-100 rounded-none shadow-2xl space-y-6">
      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase font-avathe">
          GALLERY STUDIO // ALBUMS & PHOTO ORGANIZER
        </h2>
        <span className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1 uppercase">
          PUBLIC ROUTE: /GALLERY
        </span>
      </div>

      {statusMessage && (
        <div className="p-4 bg-zinc-900 border-l-4 border-[#D8163F] text-sm text-zinc-200 flex justify-between items-center">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleUploadPhoto} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Album Selector */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              1. SELECT ALBUM / CCTV CHANNEL *
            </label>
            <select
              value={album}
              onChange={e => { playTick(); setAlbum(e.target.value); }}
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            >
              <option value="Knight Club Sessions">Knight Club Sessions (CAM 01)</option>
              <option value="Royal Court Residency">Royal Court Residency (CAM 02)</option>
              <option value="Corner New Cross Gigs">Corner New Cross Gigs (CAM 03)</option>
              <option value="Me">Official Artist Photos (Me)</option>
              <option value="Artwork">Mix Cover Artworks</option>
              <option value="Live Gigs 2026">Live Gigs & Festival Stage</option>
              <option value="Studio Gear">Analog Synth & CDJ Studio Gear</option>
              <option value="NEW_CUSTOM">+ CREATE NEW CUSTOM ALBUM...</option>
            </select>

            {album === 'NEW_CUSTOM' && (
              <input
                type="text"
                required
                value={customAlbum}
                onChange={e => setCustomAlbum(e.target.value)}
                placeholder="Enter New Album Name..."
                className="w-full bg-zinc-900 text-[#D8163F] font-bold px-3 py-2 text-sm border border-zinc-800 font-mono mt-2"
              />
            )}
          </div>

          {/* Category */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              2. CATEGORY TAG
            </label>
            <select
              value={category}
              onChange={e => { playTick(); setCategory(e.target.value); }}
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            >
              <option value="me">Me (Personal & Press)</option>
              <option value="artwork">Artwork</option>
              <option value="gigs">Gig Performance</option>
              <option value="studio">Studio Gear</option>
              <option value="custom">Custom Series</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo Title */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              3. PHOTO TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Royal Court Session 1 Front Deck View"
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            />
          </div>

          {/* Grid CSS Class Picker */}
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              4. GALLERY GRID ASPECT RATIO / SIZE
            </label>
            <select
              value={gridClass}
              onChange={e => { playTick(); setGridClass(e.target.value); }}
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
            >
              <option value="col-span-1 aspect-square">Standard Square (1x1)</option>
              <option value="col-span-2 aspect-[2/1]">Wide Banner (2x1)</option>
              <option value="col-span-1 aspect-[3/4]">Vertical Portrait (3x4)</option>
              <option value="col-span-2 aspect-square">Large Highlight Square (2x2)</option>
            </select>
          </div>
        </div>

        {/* Image File / URL Input */}
        <div className="bg-black border border-zinc-800 p-4 space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            5. IMAGE FILE URL / R2 RELATIVE PATH
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="/gallery/Me/your-photo.jpg or https://..."
            className="w-full bg-zinc-900 text-zinc-300 px-3 py-2 text-xs border border-zinc-800 font-mono"
          />
        </div>

        {/* Tags & Caption */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              6. TAGS (SEPARATED BY COMMA)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="#photography, #livegig, #decklayout"
              className="w-full bg-zinc-900 text-zinc-200 px-3 py-2 text-xs border border-zinc-800 font-mono"
            />
          </div>

          <div className="bg-black border border-zinc-800 p-4 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              7. CAPTION / SURVEILLANCE LOG NOTE
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Captured live on main stage deck setup..."
              className="w-full bg-zinc-900 text-zinc-200 px-3 py-2 text-xs border border-zinc-800 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#D8163F] hover:bg-red-600 text-white font-bold font-mono tracking-widest uppercase text-sm border border-red-500 shadow-[0_0_20px_rgba(216,22,63,0.5)] transition-all disabled:opacity-50"
        >
          {isLoading ? 'UPLOADING PHOTO...' : '📷 SAVE PHOTO TO ALBUM & PUBLISH TO GALLERY'}
        </button>
      </form>
    </div>
  );
}
