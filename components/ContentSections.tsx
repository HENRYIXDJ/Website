'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/audioUtils';

export { GigSchedule as Schedule } from './GigSchedule';
export { NewsletterForm as MailingList } from './NewsletterForm';
export { ContactForm } from './ContactForm';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

export function MerchVault({ isDepth }: { isDepth: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitted'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    playClick(900, 'sine', 0.03);
    setStatus('submitted');
  };

  return (
    <section id="merch" className="min-h-[40vh] flex flex-col justify-center items-center w-full px-6 relative max-w-4xl mx-auto py-16 scroll-mt-24 font-mono">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="w-full mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">03 // VIP Secret Drops & Guestlist</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      <div className="w-full border border-zinc-900 bg-black p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Priority Access Dispatch</span>
          </div>
          <p className="text-xs text-zinc-400 max-w-md">
            Receive unreleased dubplates, secret London warehouse coordinates, and limited vinyl drops directly to your inbox.
          </p>
        </div>

        {status === 'submitted' ? (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-widest uppercase bg-zinc-950 border border-emerald-800/60 px-4 py-3">
            <Check className="w-4 h-4" />
            <span>Access Granted</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full md:w-auto items-stretch gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER EMAIL..."
              className="bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary font-mono tracking-wider w-full md:w-56"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-black font-bold px-4 py-2 text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Join</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
