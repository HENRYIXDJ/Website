'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Ticket, Download, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/audioUtils';
import { downloadICalFile, EventICalData } from '@/lib/icsGenerator';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

export interface TourEvent {
  id: string;
  city: string;
  country: string;
  venue: string;
  dateStr: string;
  isoDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: 'TICKETS AVAILABLE' | 'SELLING FAST' | 'VIP ONLY' | 'CONFIRMED' | 'ON SALE';
  lat: number;
  lng: number;
  ticketSerial: string;
}

const UPCOMING_GIGS: TourEvent[] = [
  {
    id: 'gig-lon-01',
    city: 'LONDON',
    country: 'UNITED KINGDOM',
    venue: 'MINISTRY OF SOUND (MAIN ROOM)',
    dateStr: '12 SEP 2026',
    isoDate: '2026-09-12',
    startTime: '23:00',
    endTime: '04:00',
    status: 'TICKETS AVAILABLE',
    lat: 51.4984,
    lng: -0.0998,
    ticketSerial: 'HIX-LON-9012',
  },
  {
    id: 'gig-ibz-02',
    city: 'IBIZA',
    country: 'SPAIN',
    venue: 'AMNESIA (TERRACE)',
    dateStr: '28 SEP 2026',
    isoDate: '2026-09-28',
    startTime: '00:00',
    endTime: '06:00',
    status: 'SELLING FAST',
    lat: 38.9567,
    lng: 1.4072,
    ticketSerial: 'HIX-IBZ-4028',
  },
  {
    id: 'gig-ber-03',
    city: 'BERLIN',
    country: 'GERMANY',
    venue: 'WATERGATE (FLOOR 1)',
    dateStr: '15 OCT 2026',
    isoDate: '2026-10-15',
    startTime: '23:30',
    endTime: '05:00',
    status: 'VIP ONLY',
    lat: 52.5015,
    lng: 13.4447,
    ticketSerial: 'HIX-BER-8115',
  },
  {
    id: 'gig-ams-04',
    city: 'AMSTERDAM',
    country: 'NETHERLANDS',
    venue: 'ADE (AMSTERDAM DANCE EVENT)',
    dateStr: '22 OCT 2026',
    isoDate: '2026-10-22',
    startTime: '22:00',
    endTime: '06:00',
    status: 'CONFIRMED',
    lat: 52.3676,
    lng: 4.9041,
    ticketSerial: 'HIX-ADE-2026',
  },
  {
    id: 'gig-man-05',
    city: 'MANCHESTER',
    country: 'UNITED KINGDOM',
    venue: 'THE WAREHOUSE PROJECT',
    dateStr: '07 NOV 2026',
    isoDate: '2026-11-07',
    startTime: '21:00',
    endTime: '04:00',
    status: 'ON SALE',
    lat: 53.4770,
    lng: -2.2312,
    ticketSerial: 'HIX-MAN-3007',
  },
];

interface GigScheduleProps {
  isDepth?: boolean;
  initialEvents?: any[] | null;
}

export function GigSchedule({ isDepth = false }: GigScheduleProps) {
  const [selectedTicketEvent, setSelectedTicketEvent] = useState<TourEvent | null>(null);

  const handleDownloadCalendar = (gig: TourEvent) => {
    playClick(900, 'sine', 0.03);
    const icalData: EventICalData = {
      title: `HENRY IX Live @ ${gig.venue}`,
      description: `HENRY IX Live Performance at ${gig.venue}, ${gig.city}, ${gig.country}. Status: ${gig.status}. Serial: ${gig.ticketSerial}`,
      location: `${gig.venue}, ${gig.city}, ${gig.country}`,
      startDate: `${gig.isoDate.replace(/-/g, '')}T${gig.startTime.replace(':', '')}00Z`,
      endDate: `${gig.isoDate.replace(/-/g, '')}T${gig.endTime.replace(':', '')}00Z`,
      url: 'https://henryix.com/events',
    };
    downloadICalFile(icalData);
  };

  return (
    <motion.section 
      id="schedule" 
      className="w-full relative py-16 md:py-32 px-6 max-w-7xl mx-auto scroll-mt-24 font-mono select-none"
      onViewportEnter={() => {
        playClick(700, 'sine', 0.05);
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">03 / Tour Schedule & Live Gigs</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      {/* TOUR MAP DISPLAY HEADER */}
      <div className="w-full bg-black border border-zinc-900 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0" />
          <div>
            <span className="text-xs font-bold text-white tracking-widest uppercase block">WORLD TOUR DISPATCH SYSTEM</span>
            <span className="text-[9px] text-zinc-500 tracking-wider">SELECT CITY OR EVENT PASS FOR ICS CALENDAR SYNC</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-bold uppercase">
          <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-primary">5 UPCOMING DATES</span>
          <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-cyan-400">UK / EUROPE / WORLDWIDE</span>
        </div>
      </div>

      {/* GIG SCHEDULE GRID */}
      <div className="grid grid-cols-1 gap-4">
        {UPCOMING_GIGS.map((gig) => (
          <motion.div
            key={gig.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full bg-black border border-zinc-900 hover:border-zinc-700 p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all group"
          >
            {/* Left: Date badge */}
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 p-3 min-w-[70px] text-center shrink-0">
                <Calendar className="w-4 h-4 text-primary mb-1" />
                <span className="text-[11px] font-black text-white tracking-wider">{gig.dateStr.split(' ')[0]} {gig.dateStr.split(' ')[1]}</span>
                <span className="text-[8px] text-zinc-500 font-bold">{gig.dateStr.split(' ')[2]}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase block">{gig.country}</span>
                <span className="text-sm font-black text-white tracking-wider uppercase group-hover:text-primary transition-colors">{gig.city}</span>
              </div>
            </div>

            {/* Center: Venue Details */}
            <div className="flex flex-col gap-1 flex-grow">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{gig.venue}</span>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span>DOORS {gig.startTime} — {gig.endTime}</span>
                </div>
                <span className="text-zinc-700">|</span>
                <span className="text-emerald-400 font-bold tracking-wider">{gig.status}</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                onClick={() => handleDownloadCalendar(gig)}
                title="Save Event to Apple / Google Calendar (.ics)"
                className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>+ CALENDAR (.ICS)</span>
              </button>

              <button
                onClick={() => {
                  playClick(900, 'sine', 0.03);
                  setSelectedTicketEvent(gig);
                }}
                className="py-2 px-4 bg-primary hover:bg-primary/90 text-black font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-neon-glow"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>RSVP / GET PASS</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SKEUOMORPHIC VHS TICKET STUB MODAL */}
      <AnimatePresence>
        {selectedTicketEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedTicketEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-950 border-2 border-primary p-6 relative font-mono text-zinc-300 shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 0 30px rgba(216, 22, 63, 0.3)' }}
            >
              <button
                onClick={() => setSelectedTicketEvent(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-900">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">SKEUOMORPHIC GIG PASS // {selectedTicketEvent.ticketSerial}</span>
              </div>

              <div className="bg-black border border-zinc-900 p-4 mb-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block">ARTIST / HEADLINER</span>
                    <span className="text-lg font-black text-primary font-avathe tracking-wider">HENRY IX</span>
                  </div>
                  <span className="text-[8px] bg-emerald-950 border border-emerald-500 text-emerald-400 px-2 py-0.5 font-bold uppercase">
                    {selectedTicketEvent.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-zinc-900 pt-3">
                  <div>
                    <span className="text-zinc-500 block text-[8px]">VENUE</span>
                    <span className="font-bold text-white">{selectedTicketEvent.venue}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px]">CITY / COUNTRY</span>
                    <span className="font-bold text-white">{selectedTicketEvent.city}, {selectedTicketEvent.country}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px]">DATE</span>
                    <span className="font-bold text-amber-400">{selectedTicketEvent.dateStr}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px]">DOORS OPEN</span>
                    <span className="font-bold text-cyan-400">{selectedTicketEvent.startTime} — {selectedTicketEvent.endTime}</span>
                  </div>
                </div>

                {/* ASCII Dithered Barcode */}
                <div className="mt-2 pt-3 border-t border-zinc-900 flex flex-col items-center justify-center">
                  <div className="font-mono text-[9px] text-zinc-600 tracking-tighter select-none font-bold">
                    ░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
                  </div>
                  <span className="text-[8px] text-zinc-500 font-mono tracking-widest mt-1">SERIAL: {selectedTicketEvent.ticketSerial}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadCalendar(selectedTicketEvent)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>SAVE TO CALENDAR (.ICS)</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default GigSchedule;
