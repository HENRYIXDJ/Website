'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, FileText, Cpu, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick, playTick } from '@/lib/audioUtils';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

interface ContactFormProps {
  isDepth?: boolean;
}

export function ContactForm({ isDepth = false }: ContactFormProps) {
  const [activeTab, setActiveTab] = useState<'booking' | 'epk'>('booking');
  const [eventType, setEventType] = useState('FESTIVAL MAINSTAGE');
  const [region, setRegion] = useState('UK NATIONAL');
  const [duration, setDuration] = useState('2 HOUR SET');
  const [eventDate, setEventDate] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'BOOKING INQUIRY // HENRY IX',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    playClick(900, 'sine', 0.05);

    const fullPayload = {
      ...formData,
      subject: `[BOOKING] ${eventType} - ${region} (${eventDate || 'DATE TBD'})`,
      message: `--- PRO DJ BOOKING SPECIFICATION ---\n` +
        `EVENT TYPE: ${eventType}\n` +
        `REGION: ${region}\n` +
        `DURATION: ${duration}\n` +
        `DATE: ${eventDate || 'N/A'}\n` +
        `------------------------------------\n` +
        `INQUIRY DETAILS:\n${formData.message}`,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <motion.section 
      id="contact" 
      className="w-full relative py-16 md:py-32 px-6 max-w-4xl mx-auto scroll-mt-24 font-mono select-none"
      onViewportEnter={() => {
        playClick(700, 'sine', 0.05);
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">04 / Contact & Booking Console</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      {/* Mode Switcher: Booking Form vs EPK & Tech Rider */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-900 pb-3">
        <button
          type="button"
          onClick={() => {
            playClick(850, 'sine', 0.02);
            setActiveTab('booking');
          }}
          className={cn(
            "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border",
            activeTab === 'booking'
              ? "bg-primary text-black border-primary font-black shadow-neon-glow"
              : "bg-zinc-950 text-zinc-400 hover:text-white border-zinc-900"
          )}
        >
          01 // Booking Inquiry Console
        </button>

        <button
          type="button"
          onClick={() => {
            playClick(950, 'sine', 0.02);
            setActiveTab('epk');
          }}
          className={cn(
            "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5",
            activeTab === 'epk'
              ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-[0_0_12px_rgba(34,211,238,0.5)]"
              : "bg-zinc-950 text-zinc-400 hover:text-white border-zinc-900"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>02 // EPK & Technical Rider</span>
        </button>
      </div>

      {activeTab === 'epk' ? (
        <div className="w-full flex flex-col gap-6 bg-black border border-zinc-900 p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">PROMOTER & FESTIVAL PRESS KIT</span>
              <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase mt-0.5">HENRY IX // ELECTRONIC PRESS KIT</h3>
            </div>
            <a
              href="mailto:contact@henryix.com?subject=Press%20Kit%20Request%20//%20HENRY%20IX"
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[9px] font-mono uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Request Press Assets (ZIP)</span>
            </a>
          </div>

          {/* Artist Bio Snippet */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Artist Sound Profile & Bio</span>
            </span>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950/60 border border-zinc-900 p-4">
              London-based DJ and electronic artist HENRY IX bridges peak-time underground energy with unapologetic queer dance music culture. Known for high-octane 4-deck selections spanning Peak-Time Techno, Driving House, UK Garage, and Queer Disco, HENRY IX crafts immersive sonic journeys across London club institutions and international stages.
            </p>
          </div>

          {/* Technical Hardware DJ Rider */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Technical DJ Rider Requirements</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 flex flex-col gap-1.5">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Decks & Mixer Setup</span>
                <ul className="text-zinc-300 list-disc list-inside space-y-1 text-[11px]">
                  <li>3x Pioneer CDJ-3000 (or CDJ-2000NXS2) connected via Pro DJ Link Hub</li>
                  <li>1x Pioneer DJM-A9 (or DJM-900NXS2) 4-Channel Mixer</li>
                  <li>All firmware updated to latest version</li>
                </ul>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 flex flex-col gap-1.5">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Monitoring & Power</span>
                <ul className="text-zinc-300 list-disc list-inside space-y-1 text-[11px]">
                  <li>2x High-output stereo booth monitors with independent volume on mixer</li>
                  <li>1x Wireless Shure SM58 microphone (if MC required)</li>
                  <li>2x Clean UK/EU power sockets on DJ riser</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Direct Agency / Management Contacts */}
          <div className="flex flex-col gap-2 border-t border-zinc-900 pt-4">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-1">
              <Mail className="w-3 h-3 text-primary" />
              <span>Direct Management Dispatch</span>
            </span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-900 p-4">
              <div>
                <span className="text-xs text-white font-bold tracking-wider">BOOKINGS & MANAGEMENT</span>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">contact@henryix.com // London, United Kingdom</p>
              </div>
              <button
                onClick={() => {
                  playClick(850, 'sine', 0.02);
                  setActiveTab('booking');
                }}
                className="px-4 py-2 bg-primary text-black font-bold text-[10px] tracking-widest uppercase hover:bg-primary/90 transition-all cursor-pointer"
              >
                Launch Booking Spec
              </button>
            </div>
          </div>
        </div>
      ) : status === 'sent' ? (
        <div className="w-full bg-black border border-emerald-800 p-8 flex flex-col items-center justify-center text-center gap-4">
          <span className="text-emerald-400 font-bold text-sm tracking-widest uppercase animate-pulse">
            [ BOOKING SPECIFICATION DISPATCHED ]
          </span>
          <p className="text-zinc-400 text-xs tracking-wider">
            Thank you. Your booking inquiry has been routed directly to HENRY IX management.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white text-xs uppercase font-bold tracking-widest cursor-pointer"
          >
            SUBMIT ANOTHER INQUIRY
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 bg-black border border-zinc-900 p-6 md:p-10">
          {/* EVENT CATEGORY SELECTION */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              1. EVENT TYPE / CATEGORY
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['FESTIVAL MAINSTAGE', 'CLUB HEADLINE', 'PRIVATE / CORPORATE', 'RADIO GUEST SET'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playClick(900, 'sine', 0.02);
                    setEventType(cat);
                  }}
                  className={cn(
                    "py-2 px-2 border text-[9px] font-bold uppercase transition-all tracking-wider text-center cursor-pointer",
                    eventType === cat ? "bg-primary text-black border-primary font-black shadow-neon-glow" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* REGION & DURATION SELECTORS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                2. REGION / TERRITORY
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['UK NATIONAL', 'EUROPE / EU', 'WORLDWIDE'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      playClick(900, 'sine', 0.02);
                      setRegion(r);
                    }}
                    className={cn(
                      "py-2 px-1 border text-[8.5px] font-bold uppercase transition-all tracking-wider text-center cursor-pointer",
                      region === r ? "bg-cyan-500 text-black border-cyan-400 font-black" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                3. SET DURATION
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['1 HOUR PEAK', '2 HOUR SET', 'ALL-NIGHT'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      playClick(900, 'sine', 0.02);
                      setDuration(d);
                    }}
                    className={cn(
                      "py-2 px-1 border text-[8.5px] font-bold uppercase transition-all tracking-wider text-center cursor-pointer",
                      duration === d ? "bg-amber-500 text-black border-amber-400 font-black" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                4. PROMOTER / ORGANISATION
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (Math.random() < 0.2) playTick();
                }}
                placeholder="YOUR NAME / AGENCY"
                className="bg-black border border-zinc-900 px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-primary font-mono tracking-wider"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                5. EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (Math.random() < 0.2) playTick();
                }}
                placeholder="EMAIL@DOMAIN.COM"
                className="bg-black border border-zinc-900 px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-primary font-mono tracking-wider"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                6. ESTIMATED EVENT DATE
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-black border border-zinc-900 px-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-mono tracking-wider"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              7. VENUE & ADDITIONAL EVENT DETAILS
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (Math.random() < 0.2) playTick();
              }}
              placeholder="ENTER VENUE NAME, CITY, CAPACITY, PROPOSED LINEUP OR SPECIAL REQUESTS..."
              className="bg-black border border-zinc-900 p-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-primary font-mono tracking-wider resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-primary hover:bg-primary/90 text-black font-mono font-bold text-xs tracking-[0.2em] uppercase py-4 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-neon-glow"
          >
            <span>{status === 'sending' ? 'DISPATCHING BOOKING...' : 'DISPATCH BOOKING INQUIRY'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </motion.section>
  );
}

export default ContactForm;
