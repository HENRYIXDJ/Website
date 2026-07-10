'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick, playTick, playDegauss } from '@/lib/audioUtils';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

export function Schedule({ isDepth }: { isDepth: boolean }) {
  const [inView, setInView] = useState(false);

  return (
    <motion.section 
      id="schedule" 
      className="w-full relative py-16 md:py-32 px-6 max-w-7xl mx-auto scroll-mt-24"
      onViewportEnter={() => {
        setInView(true);
        playClick(700, 'sine', 0.05);
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">03 / Events</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      <div className="w-full flex flex-col items-center justify-center py-32 relative px-4">
        {/* Pulse dot */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-3 h-3 rounded-full bg-primary mb-10 shadow-[0_0_12px_rgba(216,22,63,0.6)]"
        />

        <motion.h3 
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          whileInView={{ y: 0, opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
          className="glitch font-sans font-bold tracking-wider leading-none text-center select-none text-primary w-full flex flex-col items-center"
          data-text="COMING SOON"
        >
          <span className="text-[clamp(2.5rem,13vw,13vw)]">COMING</span>
          <span className="text-[clamp(2.5rem,13vw,13vw)]">SOON</span>
        </motion.h3>

        <p className="font-mono text-[9px] tracking-[0.25em] text-zinc-500 uppercase max-w-md text-center px-4 leading-relaxed mt-8">
          TRANSMISSION_STAGED // DATES_UNDER_CLASSIFICATION
        </p>
      </div>
    </motion.section>
  );
}

export function MerchVault({ isDepth }: { isDepth: boolean }) {
  return (
    <section id="merch" className="min-h-[50vh] flex flex-col justify-center items-center w-full px-6 relative max-w-7xl mx-auto py-24 scroll-mt-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="w-full mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">03 / Artifacts & Merch</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="w-full h-64 border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-4 text-zinc-600 bg-zinc-950/30"
      >
        <Cloud className="w-10 h-10 opacity-50 animate-bounce" />
        <span className="font-mono text-xs tracking-widest uppercase text-primary">Vault Sealed</span>
        <span className="text-sm font-sans tracking-wide text-zinc-400">Physical editions arriving late 2026</span>
      </motion.div>
    </section>
  );
}

export function MailingList({ isDepth }: { isDepth: boolean }) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMessage('');
    playClick(1000, 'sine', 0.1);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to establish transmission');
      }

      setStatus('success');
      setJoined(true);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Transmission failed');
    }
  };

  const validation = useMemo(() => {
    if (!email) return { status: 'waiting' as const, message: 'ENTER_INQUIRY...' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      return { status: 'success' as const, message: 'ADDRESS_VERIFIED // TARGET_STAGED' };
    } else {
      return { status: 'warning' as const, message: 'VALIDATION_FAILED - RESUBMIT_REQUIRED' };
    }
  }, [email]);

  return (
    <section className="w-full px-6 py-12 md:py-24 max-w-xl mx-auto flex flex-col items-center text-center">
      <h3 className="font-mono text-xl font-bold tracking-[0.2em] uppercase mb-4 text-primary">The Inner Circle</h3>

      
      <AnimatePresence mode="wait">
        {joined ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center gap-3 py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(216,22,63,0.4)]"
            >
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p className="font-mono text-xs tracking-widest uppercase text-primary">Transmission Received</p>
            <p className="text-xs text-zinc-500 font-mono">{email}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col sm:flex-row gap-3 relative"
            onSubmit={handleJoin}
          >
            <div className="flex-grow flex flex-col items-start w-full">
              <input 
                type="email"
                required
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (Math.random() < 0.3) playTick();
                }}
                placeholder="EMAIL ADDRESS" 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-4 py-3 text-xs font-mono tracking-[0.2em] focus:outline-none focus:border-primary transition-colors text-white placeholder-zinc-600"
              />
              
              {/* Terminal glowing validation status bar */}
              <div className="font-mono text-[9px] uppercase tracking-widest mt-1.5 flex items-center gap-1.5 select-none pl-1">
                <span className={cn(
                  "px-1 py-0.5 rounded text-[8px] font-bold",
                  validation.status === 'waiting' && "bg-zinc-800/80 text-zinc-400 border border-zinc-700/30",
                  validation.status === 'success' && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/30 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.2)]",
                  validation.status === 'warning' && "bg-amber-950/80 text-amber-400 border border-amber-800/30",
                )}>
                  {validation.status === 'waiting' && '[WAITING]'}
                  {validation.status === 'success' && '[SUCCESS]'}
                  {validation.status === 'warning' && '[WARNING]'}
                </span>
                <span className={cn(
                  validation.status === 'waiting' && "text-zinc-500",
                  validation.status === 'success' && "text-emerald-400 font-bold",
                  validation.status === 'warning' && "text-amber-400 font-bold",
                )}>
                  {validation.message}
                </span>
              </div>

              {status === 'error' && (
                <div className="text-red-400 font-mono text-[9px] uppercase tracking-widest mt-2 bg-red-950/20 border border-red-800/30 px-3 py-1.5 rounded w-full text-left">
                  [CRITICAL]: {errorMessage}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="bg-primary text-black font-mono font-bold uppercase tracking-[0.2em] px-8 py-3 rounded hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(216,22,63,0.3)] transition-all text-xs h-11 magnetic-snap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {status === 'loading' ? 'Joining...' : 'Join'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

export function ContactForm({ isDepth }: { isDepth: boolean }) {
  const [formData, setFormData] = useState({ name: '', agency: '', email: '', details: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    playClick(1000, 'triangle', 0.15);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      playDegauss();
      setFormData({ name: '', agency: '', email: '', details: '' });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong');
    }
  };

  const nameVal = useMemo(() => {
    if (!formData.name) return { status: 'waiting' as const, message: 'INPUT_REPRESENTATIVE_ID...' };
    return { status: 'success' as const, message: 'NAME_CAPTURED // SECURE_IDENT' };
  }, [formData.name]);

  const agencyVal = useMemo(() => {
    if (!formData.agency) return { status: 'waiting' as const, message: 'ENTER_AGENCY_NAME (OPTIONAL)...' };
    return { status: 'success' as const, message: 'ENTITY_REGISTERED // ID_BOUND' };
  }, [formData.agency]);

  const emailVal = useMemo(() => {
    if (!formData.email) return { status: 'waiting' as const, message: 'INPUT_REPLY_COMMS...' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(formData.email)) {
      return { status: 'success' as const, message: 'COMMS_PATH_SECURED // PORT_OPEN' };
    } else {
      return { status: 'warning' as const, message: 'INVALID_COMMS_SYNTAX' };
    }
  }, [formData.email]);

  const detailsVal = useMemo(() => {
    if (!formData.details) return { status: 'waiting' as const, message: 'ENTER_SPECIFICATIONS...' };
    return { status: 'success' as const, message: `TRANSMISSION_PAYLOAD_LOADED (${formData.details.length} BYTES)` };
  }, [formData.details]);

  return (
    <section id="booking" className="w-full relative py-16 md:py-32 px-6 max-w-7xl mx-auto flex flex-col items-center scroll-mt-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG }}
        className="w-full mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <h2 className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold uppercase">04 / Contact Me</h2>
        <div className={cn("h-[1px] flex-grow w-full md:w-auto md:ml-8", isDepth ? "bg-zinc-800" : "bg-black/20")} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ ...SPRING_CONFIG, delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        <form className="space-y-8 block" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input field 1: Representative Name */}
            <div className="space-y-3">
              <label className="font-mono text-xs tracking-widest opacity-60">REPRESENTATIVE NAME</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => {
                  setFormData({ ...formData, name: e.target.value });
                  if (Math.random() < 0.25) playTick();
                }}
                placeholder="NAME"
                className={cn(
                   "w-full bg-transparent border-b py-2 font-mono text-xs focus:outline-none transition-colors",
                   isDepth ? "border-zinc-800 focus:border-primary text-white" : "border-black/20 focus:border-primary text-black"
                )}
              />
              
              {/* Console log */}
              <div className="font-mono text-[9px] uppercase tracking-widest mt-1 flex items-center gap-1.5 select-none pl-0.5">
                <span className={cn(
                  "px-1 py-0.5 rounded text-[7px] font-bold",
                  nameVal.status === 'waiting' && "bg-zinc-800/80 text-zinc-400 border border-zinc-700/30",
                  nameVal.status === 'success' && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/30 animate-pulse",
                )}>
                  {nameVal.status === 'waiting' ? '[WAITING]' : '[OK]'}
                </span>
                <span className={cn(
                  nameVal.status === 'waiting' && "text-zinc-500",
                  nameVal.status === 'success' && "text-emerald-400 font-bold",
                )}>
                  {nameVal.message}
                </span>
              </div>
            </div>

            {/* Input field 2: Agency */}
            <div className="space-y-3">
              <label className="font-mono text-xs tracking-widest opacity-60">AGENCY / ENTITY</label>
              <input 
                type="text" 
                value={formData.agency}
                onChange={e => {
                  setFormData({ ...formData, agency: e.target.value });
                  if (Math.random() < 0.25) playTick();
                }}
                placeholder="AGENCY / LLC"
                className={cn(
                   "w-full bg-transparent border-b py-2 font-mono text-xs focus:outline-none transition-colors",
                   isDepth ? "border-zinc-800 focus:border-primary text-white" : "border-black/20 focus:border-primary text-black"
                )}
              />
              
              {/* Console log */}
              <div className="font-mono text-[9px] uppercase tracking-widest mt-1 flex items-center gap-1.5 select-none pl-0.5">
                <span className={cn(
                  "px-1 py-0.5 rounded text-[7px] font-bold",
                  agencyVal.status === 'waiting' && "bg-zinc-800/80 text-zinc-400 border border-zinc-700/30",
                  agencyVal.status === 'success' && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/30 animate-pulse",
                )}>
                  {agencyVal.status === 'waiting' ? '[WAITING]' : '[OK]'}
                </span>
                <span className={cn(
                  agencyVal.status === 'waiting' && "text-zinc-500",
                  agencyVal.status === 'success' && "text-emerald-400 font-bold",
                )}>
                  {agencyVal.message}
                </span>
              </div>
            </div>
          </div>
          
          {/* Input field 3: Email */}
          <div className="space-y-3">
            <label className="font-mono text-xs tracking-widest opacity-60">EMAIL ADDRESS</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => {
                setFormData({ ...formData, email: e.target.value });
                if (Math.random() < 0.25) playTick();
              }}
              placeholder="EMAIL_ADDRESS"
              className={cn(
                 "w-full bg-transparent border-b py-2 font-mono text-xs focus:outline-none transition-colors",
                 isDepth ? "border-zinc-800 focus:border-primary text-white" : "border-black/20 focus:border-primary text-black"
              )}
            />
            
            {/* Console log */}
            <div className="font-mono text-[9px] uppercase tracking-widest mt-1 flex items-center gap-1.5 select-none pl-0.5">
              <span className={cn(
                "px-1 py-0.5 rounded text-[7px] font-bold",
                emailVal.status === 'waiting' && "bg-zinc-800/80 text-zinc-400 border border-zinc-700/30",
                emailVal.status === 'success' && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/30 animate-pulse",
                emailVal.status === 'warning' && "bg-amber-950/80 text-amber-400 border border-amber-800/30",
              )}>
                {emailVal.status === 'waiting' && '[WAITING]'}
                {emailVal.status === 'success' && '[SUCCESS]'}
                {emailVal.status === 'warning' && '[WARNING]'}
              </span>
              <span className={cn(
                emailVal.status === 'waiting' && "text-zinc-500",
                emailVal.status === 'success' && "text-emerald-400 font-bold",
                emailVal.status === 'warning' && "text-amber-400 font-bold",
              )}>
                {emailVal.message}
              </span>
            </div>
          </div>

          {/* Input field 4: Message */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-mono text-xs tracking-widest opacity-60">MESSAGE</label>
              <span className={cn("font-mono text-[10px] tabular-nums transition-colors", formData.details.length > 450 ? "text-primary" : "opacity-30")}>{formData.details.length}/500</span>
            </div>
            <textarea 
              rows={1}
              required
              maxLength={500}
              value={formData.details}
              onChange={e => {
                setFormData({ ...formData, details: e.target.value });
                if (Math.random() < 0.25) playTick();
              }}
              placeholder="EVENT_SPECIFICATIONS"
              className={cn(
                 "w-full bg-transparent border-b h-8 py-1.5 font-mono text-xs focus:outline-none transition-colors resize-none overflow-hidden leading-normal",
                 isDepth ? "border-zinc-800 focus:border-primary text-white" : "border-black/20 focus:border-primary text-black"
              )}
            />
            
            {/* Console log */}
            <div className="font-mono text-[9px] uppercase tracking-widest mt-1 flex items-center gap-1.5 select-none pl-0.5">
              <span className={cn(
                "px-1 py-0.5 rounded text-[7px] font-bold",
                detailsVal.status === 'waiting' && "bg-zinc-800/80 text-zinc-400 border border-zinc-700/30",
                detailsVal.status === 'success' && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/30 animate-pulse",
              )}>
                {detailsVal.status === 'waiting' ? '[WAITING]' : '[OK]'}
              </span>
              <span className={cn(
                detailsVal.status === 'waiting' && "text-zinc-500",
                detailsVal.status === 'success' && "text-emerald-400 font-bold",
              )}>
                {detailsVal.message}
              </span>
            </div>
          </div>

          {status === 'success' && (
            <div className="text-green-400 font-mono text-xs tracking-widest bg-emerald-950/20 border border-emerald-800/30 px-4 py-3 rounded animate-pulse">
              [SUCCESS]: TRANSMISSION ESTABLISHED. MESSAGE PACKET HAS DEPARTED GATEWAY.
            </div>
          )}
          {status === 'error' && (
            <div className="text-red-400 font-mono text-xs tracking-widest bg-red-950/20 border border-red-800/30 px-4 py-3 rounded">
              [CRITICAL_FAILURE]: TRANSMISSION TERMINATED. REASON: {errorMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
            <motion.a 
              href="/Henry_IX_EPK.pdf"
              download
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => playClick(850, 'sine', 0.05)}
              className={cn(
                "w-full sm:w-1/2 py-4 px-8 font-mono text-[10px] tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-3 transition-colors border border-zinc-800 rounded magnetic-snap cursor-pointer",
                isDepth ? "bg-transparent text-white hover:border-primary hover:text-primary" : "bg-transparent text-black border-black/20 hover:border-primary"
              )}
            >
              Download EPK
            </motion.a>

            <motion.button 
              type="submit"
              disabled={status === 'loading'}
              whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
              whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
              className={cn(
                "w-full sm:w-1/2 py-4 px-8 font-mono text-[10px] tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-3 transition-colors rounded magnetic-snap cursor-pointer",
                isDepth ? "bg-zinc-100 text-black hover:bg-primary hover:text-white disabled:opacity-50" : "bg-black text-white hover:bg-primary disabled:opacity-50"
              )}
            >
              {status === 'loading' ? 'Transmitting...' : 'Send Message'} 
              {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </section>
  );
}

export function SocialLinks({ isDepth }: { isDepth: boolean }) {
  const socialLinks = [
    { name: "Facebook", href: "https://www.facebook.com/HenryIXDJ/" },
    { name: "Instagram", href: "https://www.instagram.com/henryixdj/" },
    { name: "SoundCloud", href: "https://soundcloud.com/henryixdj" },
    { name: "Mixcloud", href: "https://www.mixcloud.com/HenryIXDJ/" },
    { name: "TikTok", href: "https://www.tiktok.com/@henryixdj" },
    { name: "YouTube", href: "https://www.youtube.com/@HenryIXDJ" }
  ];

  return (
    <section className="w-full px-6 py-12 md:py-24 max-w-xl mx-auto flex flex-col items-center text-center border-t border-zinc-900/50 mt-12">
      <h3 className="font-mono text-xl font-bold tracking-[0.2em] uppercase mb-8 text-primary">Socials</h3>
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClick(800, 'sine', 0.05)}
            className={cn(
              "font-mono text-xs tracking-widest uppercase py-2 px-4 rounded border transition-colors hover:bg-zinc-900",
              isDepth ? "border-zinc-800 text-zinc-400 hover:text-white hover:border-primary" : "border-black/20 text-zinc-600 hover:text-black hover:border-black"
            )}
          >
            {link.name}
          </a>
        ))}
      </div>
    </section>
  );
}
