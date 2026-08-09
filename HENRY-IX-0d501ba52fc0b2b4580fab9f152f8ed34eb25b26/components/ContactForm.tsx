'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick, playTick } from '@/lib/audioUtils';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

interface ContactFormProps {
  isDepth?: boolean;
}

export function ContactForm({ isDepth = false }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    playClick(900, 'sine', 0.05);

    setTimeout(() => {
      setStatus('sent');
    }, 800);
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
        className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">04 / Booking & Inquiries</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      {status === 'sent' ? (
        <div className="w-full bg-black border border-emerald-800 p-8 flex flex-col items-center justify-center text-center gap-4">
          <span className="text-emerald-400 font-bold text-sm tracking-widest uppercase animate-pulse">
            [ TRANSMISSION SENT // DISPATCHED ]
          </span>
          <p className="text-zinc-400 text-xs tracking-wider">
            Thank you. Your message has been routed to HENRY IX management.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white text-xs uppercase font-bold tracking-widest cursor-pointer"
          >
            SEND ANOTHER MESSAGE
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 bg-black border border-zinc-900 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                NAME / ORGANISATION
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (Math.random() < 0.2) playTick();
                }}
                placeholder="YOUR NAME"
                className="bg-black border border-zinc-900 px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-primary font-mono tracking-wider"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                EMAIL ADDRESS
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
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              SUBJECT / INQUIRY TYPE
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (Math.random() < 0.2) playTick();
              }}
              placeholder="BOOKING / REMIX / MEDIA / GENERAL"
              className="bg-black border border-zinc-900 px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-primary font-mono tracking-wider"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              MESSAGE / TRANSMISSION DETAILS
            </label>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (Math.random() < 0.2) playTick();
              }}
              placeholder="ENTER EVENT DATE, VENUE, PROPOSAL OR INQUIRY..."
              className="bg-black border border-zinc-900 p-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-primary font-mono tracking-wider resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-primary hover:bg-primary/90 text-black font-mono font-bold text-xs tracking-[0.2em] uppercase py-4 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{status === 'sending' ? 'DISPATCHING...' : 'DISPATCH TRANSMISSION'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </motion.section>
  );
}

export default ContactForm;
