'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MuxPlayer from '@mux/mux-player-react';
import PageShell from '@/components/PageShell';
import { playClick, playTick } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

const CHAT_USERS = [
  'CyberPulse', 'DeepVibes', 'TechnoSam', 'IbizaFlyer', 
  'AcidWarp', 'BassHead', 'VaporDJ', 'EchoLine', 'Synapse'
];

const CHAT_PHRASES = [
  'This track is absolutely insane! 🔥',
  'What a transition... smooth as butter.',
  'HENRY IX on the decks is unmatched.',
  'Greeting from London! Love the visualizer.',
  'BPM is hitting perfectly right now.',
  'Wait, whats the ID on this tune?',
  'That bass drop is massive!',
  'Unreal set, locked in from Berlin!',
  'The Pioneer simulation is so dope.'
];

interface HistoryItem {
  id: string;
  title: string;
  playbackId: string;
  date: string;
  resolution: string;
}

interface LiveClientProps {
  initialSettings: {
    title: string;
    playbackId: string;
    viewerUserId: string;
    streamStatus: string;
    resolution: string;
    latency: string;
  };
  history: HistoryItem[];
}

export default function LiveClient({ initialSettings, history }: LiveClientProps) {
  const [activeStream, setActiveStream] = useState(initialSettings);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'System', text: 'ESTABLISHING PORT TRANSMISSION ON COORD_51.5074...', time: '16:00' },
    { id: '2', user: 'System', text: 'DECODING AUDIO LAYER // AUDIO_RATE: 320KBPS...', time: '16:00' },
    { id: '3', user: 'System', text: 'STREAM FEED ONLINE. CHANNEL STABLE.', time: '16:01' }
  ]);
  
  const [showConsoleLine, setShowConsoleLine] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat box
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Simulate incoming live chat messages
  useEffect(() => {
    const addMessageInterval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newUser = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
      const newText = CHAT_PHRASES[Math.floor(Math.random() * CHAT_PHRASES.length)];
      
      const newMsg: ChatMessage = {
        id: performance.now().toString(),
        user: newUser,
        text: newText,
        time: timeStr
      };

      setChatMessages(prev => [...prev.slice(-30), newMsg]);
      playTick();
    }, 4500 + Math.random() * 3500);

    return () => clearInterval(addMessageInterval);
  }, []);

  const isStreaming = activeStream.status === 'live' || activeStream.status === 'archived';

  return (
    <PageShell>
      <main className="min-h-screen text-zinc-100 selection:bg-primary/30 selection:text-primary pt-24 pb-20 px-4 md:px-8 w-full relative overflow-y-auto custom-scrollbar">
        
        {/* Section Header */}
        <div className="relative z-10 mb-8 md:mb-12 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1
              className="glitch font-sans font-black text-primary text-[clamp(2rem,6vh,5.5rem)] leading-none tracking-wider uppercase select-none"
              data-text="LIVE TRANSMISSION"
            >
              LIVE STREAM
            </h1>
          </motion.div>
        </div>

        {/* Master Content Layout */}
        <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch select-none font-mono">
          
          {/* Stream Player Container (2/3 width) */}
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-3xl p-4 md:p-6 shadow-2xl relative flex flex-col gap-4">
            {/* Carbon texture background */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0" style={{
              backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px'
            }} />

            {/* Top Stats Bar */}
            <div className="w-full flex justify-between items-center text-[7.5px] text-zinc-500 uppercase tracking-widest border-b border-zinc-900/60 pb-2 z-10">
              <span className="flex items-center gap-1.5 text-zinc-300">
                {activeStream.status === 'live' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE BROADCAST ACTIVE
                  </>
                ) : activeStream.status === 'upcoming' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    UPCOMING TRANSMISSION SCHEDULED
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    OFFLINE / LAST BROADCAST ARCHIVE
                  </>
                )}
              </span>
              <span className="font-bold text-primary">PORT_3000 // DECODER_ENGAGED</span>
            </div>

            {/* Mux Player element */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 z-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center">
              {activeStream.status === 'live' || activeStream.status === 'archived' ? (
                <MuxPlayer
                  playbackId={activeStream.playbackId}
                  streamType={activeStream.status === 'live' ? 'live' : 'on-demand'}
                  accentColor="#d8163f"
                  metadata={{
                    videoTitle: activeStream.title,
                    viewerUserId: activeStream.viewerUserId
                  }}
                  className="w-full h-full object-contain"
                />
              ) : activeStream.status === 'upcoming' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center select-none overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(216,22,63,0.1)_95%)] bg-[size:100%_6px] pointer-events-none z-20 opacity-30 animate-pulse" />
                  
                  <div className="flex flex-col gap-4 relative z-10 items-center">
                    <span className="text-primary font-black text-xs md:text-sm tracking-[0.3em] uppercase animate-pulse">
                      [ UPCOMING_TRANSMISSION ]
                    </span>
                    <span className="text-[14px] md:text-[18px] font-sans font-bold text-zinc-200 tracking-wider max-w-sm uppercase">
                      {activeStream.title}
                    </span>
                    {activeStream.scheduledTime && (
                      <div className="flex flex-col gap-1.5 mt-2 bg-zinc-900/50 border border-zinc-800 rounded px-4 py-2 font-mono">
                        <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Scheduled Start Time:</span>
                        <span className="text-xs text-primary font-bold">
                          {new Date(activeStream.scheduledTime).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic details */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[7px] text-zinc-600 uppercase font-black tracking-widest border-t border-zinc-900/60 pt-2.5">
                    <span>SYS_MODE: SCHEDULED</span>
                    <span>SIGNAL: READY_FOR_CARRIER</span>
                    <span>TARGET: {activeStream.title}</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center select-none overflow-hidden">
                  {/* Subtle Grid Scanning overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(216,22,63,0.1)_95%)] bg-[size:100%_6px] pointer-events-none z-20 opacity-30 animate-pulse" />
                  
                  {/* Test Pattern Color Bars */}
                  <div className="flex h-3.5 w-44 rounded-sm overflow-hidden mb-6 border border-zinc-900 opacity-60">
                    <div className="w-[14.28%] h-full bg-zinc-100" />
                    <div className="w-[14.28%] h-full bg-yellow-400" />
                    <div className="w-[14.28%] h-full bg-cyan-400" />
                    <div className="w-[14.28%] h-full bg-green-500" />
                    <div className="w-[14.28%] h-full bg-pink-500" style={{ backgroundColor: '#ec4899' }} />
                    <div className="w-[14.28%] h-full bg-red-500" />
                    <div className="w-[14.28%] h-full bg-blue-600" />
                  </div>

                  <div className="flex flex-col gap-2.5 relative z-10">
                    <span className="text-primary font-black text-xs md:text-sm tracking-[0.3em] uppercase animate-pulse">
                      [ BROADCAST_STANDBY ]
                    </span>
                    <span className="text-[9px] text-zinc-500 tracking-[0.15em] uppercase font-bold max-w-sm leading-normal">
                      No feed detected. Awaiting transmission connection from OBS encoder.
                    </span>
                  </div>

                  {/* Diagnostic details */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[7px] text-zinc-600 uppercase font-black tracking-widest border-t border-zinc-900/60 pt-2.5">
                    <span>SYS_MODE: OFFLINE</span>
                    <span>SIGNAL: LOSS_OF_CARRIER</span>
                    <span>TARGET: {activeStream.title}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Info deck */}
            <div className="bg-black/50 border border-zinc-900/60 p-3.5 rounded-xl z-10 text-left">
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-bold">STREAM DIAGNOSTICS</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[6.5px] text-zinc-600">RESOLUTION</span>
                  <span className="text-primary font-black">{activeStream.resolution}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[6.5px] text-zinc-600">CODEC LAYER</span>
                  <span className="text-white">H.264 // HE-AAC</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[6.5px] text-zinc-600">TARGET BITRATE</span>
                  <span className="text-white">6800 KBPS</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[6.5px] text-zinc-600">LATENCY MODE</span>
                  <span className={cn(
                    "font-black",
                    activeStream.latency.toLowerCase().includes('low') ? "text-emerald-500" : "text-yellow-500"
                  )}>{activeStream.latency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Live Chat Container (1/3 width) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col justify-between h-[450px] lg:h-auto select-none">
            {/* Terminal Top info */}
            <div className="w-full border-b border-zinc-900 pb-2 flex justify-between items-center text-[7.5px] text-zinc-500 uppercase tracking-widest font-bold">
              <span>CHAT FEED TERMINAL</span>
              <span className="text-primary font-black">SYS_LOG</span>
            </div>

            {/* Scrollable messages area */}
            <div 
              ref={scrollRef}
              className="flex-grow my-4 overflow-y-auto pr-1 text-left flex flex-col gap-2.5 custom-scrollbar"
            >
              {chatMessages.map(msg => {
                const isSystem = msg.user === 'System';
                return (
                  <div key={msg.id} className="text-[9px] leading-relaxed">
                    <span className="text-zinc-600 mr-1.5">[{msg.time}]</span>
                    {isSystem ? (
                      <span className="text-emerald-500 font-bold uppercase">{msg.text}</span>
                    ) : (
                      <>
                        <span className="text-primary font-black uppercase mr-1">{msg.user}:</span>
                        <span className="text-zinc-300 font-medium">{msg.text}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input prompt line (skeuomorphic mock input) */}
            <div className="border-t border-zinc-900 pt-3 flex items-center gap-1.5">
              <span className="text-[9px] text-primary font-bold animate-pulse">&gt;</span>
              <input 
                type="text" 
                placeholder="TRANSMISSION CHAT MUTE / OFFLINE..."
                disabled
                className="w-full bg-transparent border-0 font-mono text-[9.5px] text-zinc-600 focus:outline-none placeholder-zinc-700"
              />
            </div>

          </div>

        </div>

        {/* Past Broadcasts History Section */}
        {history.length > 0 && (
          <div className="relative z-10 w-full max-w-5xl mx-auto mt-12 md:mt-16 text-left select-none font-mono">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-900 pb-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                PAST TRANSMISSION ARCHIVES
              </span>
              <div className="h-[1px] flex-grow bg-zinc-900" />
              <span className="text-[7.5px] text-primary font-black uppercase tracking-widest border border-primary/20 px-2 py-0.5 rounded bg-primary/5">
                {history.length} VODS AVAILABLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {history.map((item) => {
                const isSelected = activeStream.playbackId === item.playbackId;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      playClick(750, 'sine', 0.02);
                      setActiveStream({
                        title: item.title,
                        playbackId: item.playbackId,
                        viewerUserId: "user-id-007",
                        streamStatus: "archive",
                        resolution: item.resolution,
                        latency: "Standard Latency"
                      });
                    }}
                    className={cn(
                      "group bg-zinc-950/80 border rounded-2xl p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden",
                      isSelected
                        ? "border-primary shadow-[0_0_15px_rgba(216,22,63,0.15)] scale-[1.01]"
                        : "border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/40"
                    )}
                  >
                    {/* Color bars placeholder thumb */}
                    <div className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-900 overflow-hidden flex flex-col items-center justify-center">
                      <div className="flex h-1.5 w-24 rounded-sm overflow-hidden mb-2 border border-zinc-900/60 opacity-40">
                        <div className="w-[14.28%] h-full bg-zinc-100" />
                        <div className="w-[14.28%] h-full bg-yellow-400" />
                        <div className="w-[14.28%] h-full bg-cyan-400" />
                        <div className="w-[14.28%] h-full bg-green-500" />
                        <div className="w-[14.28%] h-full bg-pink-500" style={{ backgroundColor: '#ec4899' }} />
                        <div className="w-[14.28%] h-full bg-red-500" />
                        <div className="w-[14.28%] h-full bg-blue-600" />
                      </div>
                      <span className="text-[6.5px] text-zinc-600 font-bold uppercase tracking-wider">PREVIEW_NOT_LOADED</span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                          <span className="text-primary text-[8px] font-black tracking-widest border border-primary bg-zinc-950 px-2 py-1 rounded">
                            NOW PLAYING
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-zinc-500 text-[7px] tracking-widest font-black uppercase">
                        RECORDED: {item.date}
                      </span>
                      <span className="text-white text-[9.5px] font-bold tracking-wide uppercase line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 text-[6.5px] text-zinc-500 font-black uppercase tracking-widest">
                      <span>{item.resolution}</span>
                      <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">LOAD FEED &gt;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </PageShell>
  );
}
