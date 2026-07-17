'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playClick, playTick, playLockoutBlip } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

interface GigStop {
  id: string;
  date: string;
  month: string;
  year: string;
  city: string;
  venue: string;
  status: 'TICKETS' | 'SOLD OUT' | 'FREE';
  link?: string;
}

const GIG_DATA: GigStop[] = [
  { id: '1', date: '24', month: 'JUL', year: '2026', city: 'London, UK', venue: 'Fabric London', status: 'TICKETS', link: 'https://ra.co' },
  { id: '2', date: '12', month: 'AUG', year: '2026', city: 'Ibiza, Spain', venue: 'DC-10 Ibiza', status: 'TICKETS', link: 'https://ra.co' },
  { id: '3', date: '28', month: 'AUG', year: '2026', city: 'Berlin, Germany', venue: 'Watergate Berlin', status: 'SOLD OUT' },
  { id: '4', date: '15', month: 'SEP', year: '2026', city: 'Tokyo, Japan', venue: 'Womb Tokyo', status: 'TICKETS', link: 'https://ra.co' },
  { id: '5', date: '03', month: 'OCT', year: '2026', city: 'Manchester, UK', venue: 'Warehouse Project', status: 'TICKETS', link: 'https://ra.co' },
  { id: '6', date: '31', month: 'OCT', year: '2026', city: 'London, UK', venue: 'Printworks London', status: 'SOLD OUT' }
];

export function GigSchedule({
  isDepth,
  initialEvents,
}: {
  isDepth: boolean;
  initialEvents?: GigStop[] | null;
}) {
  const gigs = initialEvents && initialEvents.length > 0 ? initialEvents : GIG_DATA;
  // Dynamically calculate the next Friday at 10 PM as the countdown target, ensuring it is always active
  const [targetDate] = useState(() => {
    const now = new Date();
    const target = new Date();
    target.setDate(now.getDate() + ((7 + 5 - now.getDay()) % 7 || 7));
    target.setHours(22, 0, 0, 0);
    return target;
  });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleTicketClick = (stop: GigStop) => {
    if (stop.status === 'SOLD OUT') {
      playLockoutBlip();
      return;
    }
    playClick(1000, 'sine', 0.04);
    if (stop.link) {
      window.open(stop.link, '_blank', 'noopener,noreferrer');
    }
  };

  const formattedTimeToken = (num: number) => num.toString().padStart(2, '0');

  return (
    <motion.section 
      id="schedule" 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full relative py-8 md:py-16 px-4 md:px-6 max-w-3xl mx-auto select-none"
    >
      {/* Page header tag line */}
      <div className="w-full mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900/60 pb-4">
        <h2 className="font-mono text-sm md:text-base tracking-[0.25em] font-semibold uppercase text-primary">
          03 / SHOW TIMES & TICKETS
        </h2>
        <span className="font-mono text-[7px] text-zinc-500 uppercase tracking-widest leading-none">
          TIMELINES_QUANTIZED // SYSTEM_STABLE
        </span>
      </div>

      {/* Skewomorphic CDJ Countdown Panel */}
      <div className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden mb-12 flex flex-col items-center">
        {/* Carbon texture backdrop */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0" style={{
          backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px'
        }} />

        {/* Panel top line */}
        <div className="w-full flex justify-between items-center text-[7px] font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-4">
          <span>PIONEER SYSTEM // DIGITAL COUNTER</span>
          <span className="text-primary font-bold animate-pulse">LIVE TRANSMISSION COUNTDOWN</span>
        </div>

        {/* Segment Displays Grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md w-full z-10">
          {[
            { label: 'DAYS', value: timeLeft.days },
            { label: 'HOURS', value: timeLeft.hours },
            { label: 'MINUTES', value: timeLeft.minutes },
            { label: 'SECONDS', value: timeLeft.seconds }
          ].map(token => (
            <div key={token.label} className="flex flex-col items-center p-2.5 bg-black border border-zinc-900 rounded-lg relative">
              <span className="font-mono text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
                {token.label}
              </span>
              <span className="font-black text-xl md:text-2xl lg:text-3xl text-primary font-mono tracking-widest drop-shadow-[0_0_10px_rgba(216,22,63,0.5)]">
                {formattedTimeToken(token.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tourstops Timeline */}
      <div className="w-full flex flex-col gap-3 z-10 relative">
        {gigs.map((stop) => {
          const isSoldOut = stop.status === 'SOLD OUT';
          
          return (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onMouseEnter={() => playTick()}
              className={cn(
                "group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border bg-zinc-950/80 border-zinc-900/60 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-300 gap-4"
              )}
            >
              {/* Date Box */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-black border border-zinc-900 rounded-lg shrink-0">
                  <span className="font-black text-white text-base tracking-wide font-mono leading-none">
                    {stop.date}
                  </span>
                  <span className="text-[7.5px] font-mono text-zinc-500 font-bold tracking-widest mt-0.5 leading-none uppercase">
                    {stop.month}
                  </span>
                </div>
                
                {/* Event Location */}
                <div className="flex text-left flex-col">
                  <span className="text-zinc-500 font-mono text-[7px] uppercase tracking-widest">
                    {stop.city}
                  </span>
                  <span className="font-bold text-white text-sm md:text-base uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                    {stop.venue}
                  </span>
                </div>
              </div>

              {/* Action Ticket Button */}
              <button
                onClick={() => handleTicketClick(stop)}
                className={cn(
                  "px-6 py-2 rounded-md font-mono text-[9px] font-black tracking-widest uppercase transition-all duration-200 border cursor-pointer w-full md:w-36 text-center select-none active:scale-95",
                  isSoldOut
                    ? "bg-zinc-950/80 border-zinc-900 text-zinc-600 cursor-not-allowed"
                    : "bg-primary border-primary/25 text-black hover:bg-red-600 hover:shadow-[0_0_12px_rgba(216,22,63,0.35)]"
                )}
              >
                {stop.status === 'SOLD OUT' ? 'SOLD OUT' : 'GET TICKETS'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
