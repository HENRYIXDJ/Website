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

interface LiveClientProps {
  initialSettings: {
    title: string;
    playbackId: string;
    viewerUserId: string;
    streamStatus: string;
    resolution: string;
    latency: string;
  };
}

export default function LiveClient({ initialSettings }: LiveClientProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'System', text: 'ESTABLISHING PORT TRANSMISSION ON COORD_51.5074...', time: '16:00' },
    { id: '2', user: 'System', text: 'DECODING AUDIO LAYER // AUDIO_RATE: 320KBPS...', time: '16:00' },
    { id: '3', user: 'System', text: 'STREAM FEED ONLINE. CHANNEL STABLE.', time: '16:01' }
  ]);
  
  const [streamActive, setStreamActive] = useState(true);
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
              className="glitch font-sans font-black text-primary text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-wider uppercase select-none"
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
                {initialSettings.streamStatus === 'active' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE BROADCAST ACTIVE
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
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-black bg-black z-10 shadow-inner">
              <MuxPlayer
                playbackId={initialSettings.playbackId}
                accentColor="#d8163f"
                metadata={{
                  videoTitle: initialSettings.title,
                  viewerUserId: initialSettings.viewerUserId
                }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bottom Info deck */}
            <div className="bg-black/50 border border-zinc-900/60 p-3.5 rounded-xl z-10 text-left">
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-bold">STREAM DIAGNOSTICS</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[6.5px] text-zinc-600">RESOLUTION</span>
                  <span className="text-primary font-black">{initialSettings.resolution}</span>
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
                    initialSettings.latency.toLowerCase().includes('low') ? "text-emerald-500" : "text-yellow-500"
                  )}>{initialSettings.latency}</span>
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

      </main>
    </PageShell>
  );
}
