'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick, playTick } from '@/lib/audioUtils';
import siteContent from '@/lib/siteContent';

async function mockSignupAction(email: string) {
  await new Promise(r => setTimeout(r, 600));
  return { success: true };
}

export function NewsletterForm() {
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
      await mockSignupAction(email);
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
      <h3 className="font-mono text-xl font-bold tracking-[0.2em] uppercase mb-4 text-primary">
        {siteContent.newsletter.title}
      </h3>
      <p className="font-mono text-xs text-zinc-500 tracking-wider mb-8 max-w-md">
        {siteContent.newsletter.description}
      </p>

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
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
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
                className="w-full bg-black border border-zinc-900 rounded-none px-4 py-3 text-xs font-mono tracking-[0.2em] focus:outline-none focus:border-primary transition-colors text-white placeholder-zinc-600"
              />
              
              {/* Terminal glowing validation status bar */}
              <div className="font-mono text-[9px] uppercase tracking-widest mt-1.5 flex items-center gap-1.5 select-none pl-1">
                <span className={cn(
                  "px-1 py-0.5 rounded-none text-[8px] font-bold",
                  validation.status === 'waiting' && "bg-zinc-950 text-zinc-400 border border-zinc-900",
                  validation.status === 'success' && "bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.2)]",
                  validation.status === 'warning' && "bg-amber-950 text-amber-400 border border-amber-800"
                )}>
                  [{validation.status.toUpperCase()}]
                </span>
                <span className="text-zinc-500 tracking-wider">
                  {validation.message}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-primary hover:bg-primary/90 text-black font-mono text-xs font-bold tracking-[0.2em] uppercase px-6 py-3 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 rounded-none self-start sm:self-auto"
            >
              <span>{status === 'loading' ? 'SENDING...' : 'JOIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

export default NewsletterForm;
