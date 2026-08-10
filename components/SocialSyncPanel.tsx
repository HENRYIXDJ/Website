'use client';

import React, { useState } from 'react';
import { playClick, playTick } from '@/lib/audioUtils';

export default function SocialSyncPanel() {
  const [platforms] = useState([
    { id: 'resend', name: 'RESEND EMAIL HUB (@henryix.com)', status: 'ACTIVE', handle: 'broadcasts@henryix.com' },
    { id: 'youtube', name: 'YOUTUBE BROADCAST API', status: 'ACTIVE', handle: '@HENRYIX_DJ' },
    { id: 'instagram', name: 'INSTAGRAM AUTO-POST', status: 'ACTIVE', handle: '@henryix_dj' },
    { id: 'tiktok', name: 'TIKTOK LIVE CREATOR HUB', status: 'ACTIVE', handle: '@henryix' },
    { id: 'x', name: 'X / TWITTER FEED', status: 'ACTIVE', handle: '@HENRYIX_LIVE' },
    { id: 'soundcloud', name: 'SOUNDCLOUD API SYNC', status: 'ACTIVE', handle: 'soundcloud.com/henryix' },
    { id: 'discord', name: 'DISCORD SERVER WEBHOOK', status: 'ACTIVE', handle: '#broadcast-announcements' },
  ]);

  const [announcementTitle, setAnnouncementTitle] = useState('Knight Club: Session 6 Live Set');
  const [announcementType, setAnnouncementType] = useState<'live' | 'mix' | 'podcast'>('live');
  const [copied, setCopied] = useState(false);

  const generateAnnouncementText = () => {
    const divider = '░▒▓█══════════════════════════════█▓▒░';
    if (announcementType === 'live') {
      return `${divider}\n🔴 LIVE TRANSMISSION SIGNAL :: HENRY IX\n\nTITLE: ${announcementTitle.toUpperCase()}\nSTATUS: BROADCAST ACTIVE\n\nLINK: https://henryix.com/live\n\n#henryix #ukgarage #livestream #djset\n${divider}`;
    } else if (announcementType === 'mix') {
      return `${divider}\n🎛 NEW MIX DROPPED :: HENRY IX\n\nTITLE: ${announcementTitle.toUpperCase()}\nCATALOG: OFFICIAL ARCHIVE\n\nLISTEN NOW: https://henryix.com/mixes\n\n#henryix #mix #ukg #bassline #dj\n${divider}`;
    } else {
      return `${divider}\n🎙 NEW PODCAST EPISODE :: HENRY IX\n\nEPISODE: ${announcementTitle.toUpperCase()}\nAVAILABLE ON APPLE PODCASTS & SPOTIFY\n\nLISTEN: https://henryix.com/api/podcast/rss.xml\n\n#podcast #henryix #musiccommentary\n${divider}`;
    }
  };

  const copyAnnouncement = () => {
    playClick();
    navigator.clipboard.writeText(generateAnnouncementText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 font-mono text-zinc-100 rounded-none shadow-2xl space-y-8">
      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase font-avathe">
          SOCIAL SYNC // CROSS-POSTING & EMAIL HUB
        </h2>
        <span className="text-xs bg-red-950/80 text-[#D8163F] border border-red-800/80 px-3 py-1 font-mono uppercase">
          CONNECTED DOMAIN: HENRYIX.COM
        </span>
      </div>

      {/* Social Connection Matrix */}
      <div className="bg-black border border-zinc-800 p-5 space-y-4">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          CONNECTED PLATFORM HUB & INTEGRATIONS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {platforms.map(p => (
            <div key={p.id} className="bg-zinc-900/80 p-3 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white uppercase">{p.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">{p.handle}</div>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 font-bold uppercase">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monospaced Announcement Post Generator */}
      <div className="bg-black border border-zinc-800 p-5 space-y-4">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex justify-between items-center">
          <span>MONOSPACED ANNOUNCEMENT POST GENERATOR</span>
          {copied && <span className="text-emerald-400 font-normal">COPIED TO CLIPBOARD!</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => { playTick(); setAnnouncementType('live'); }}
            className={`py-2 text-xs font-bold font-mono uppercase border ${
              announcementType === 'live' ? 'bg-[#D8163F] text-white border-[#D8163F]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            🔴 LIVE BROADCAST POST
          </button>
          <button
            onClick={() => { playTick(); setAnnouncementType('mix'); }}
            className={`py-2 text-xs font-bold font-mono uppercase border ${
              announcementType === 'mix' ? 'bg-[#D8163F] text-white border-[#D8163F]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            🎛 MIX DROP POST
          </button>
          <button
            onClick={() => { playTick(); setAnnouncementType('podcast'); }}
            className={`py-2 text-xs font-bold font-mono uppercase border ${
              announcementType === 'podcast' ? 'bg-[#D8163F] text-white border-[#D8163F]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            🎙 PODCAST EPISODE POST
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-400 uppercase block mb-1">
            ANNOUNCEMENT TITLE / SUBJECT
          </label>
          <input
            type="text"
            value={announcementTitle}
            onChange={e => setAnnouncementTitle(e.target.value)}
            className="w-full bg-zinc-900 text-white px-3 py-2 text-xs border border-zinc-800 font-mono focus:outline-none"
          />
        </div>

        <div className="relative">
          <textarea
            readOnly
            rows={8}
            value={generateAnnouncementText()}
            className="w-full bg-zinc-900 text-emerald-400 p-4 text-xs font-mono border border-zinc-800 leading-relaxed focus:outline-none"
          />
          <button
            onClick={copyAnnouncement}
            className="absolute top-3 right-3 bg-[#D8163F] hover:bg-red-600 text-white text-xs px-3 py-1.5 font-mono uppercase tracking-wider border border-red-500 shadow-md"
          >
            📋 COPY POST ANNOUNCEMENT
          </button>
        </div>
      </div>
    </div>
  );
}
