'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Shield, Info } from 'lucide-react';
import { playClick } from '@/lib/audioUtils';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences?: CookiePreferences;
}

export default function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences = { necessary: true, analytics: false, marketing: false }
}: CookiePreferencesModalProps) {
  const [prefs, setPrefs] = useState<CookiePreferences>(initialPreferences);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) setPrefs(initialPreferences);
  }

  const handleSave = () => {
    playClick(900, 'sine', 0.03);
    onSave(prefs);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-xl border border-zinc-900 bg-black rounded-none p-6 shadow-2xl font-mono text-zinc-300 z-10 select-none overflow-hidden"
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-primary text-xs md:text-sm font-black tracking-widest uppercase">
                  COOKIE PREFERENCES MANAGER
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-sans mb-6 leading-relaxed">
              We respect your legal data rights under <strong className="text-zinc-200">UK GDPR</strong> and <strong className="text-zinc-200">PECR</strong>. Customize your preference settings below. Strictly necessary cookies are required for basic Web Audio DSP features.
            </p>

            {/* Categories */}
            <div className="flex flex-col gap-4 mb-8">
              
              {/* Category 1: Necessary */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-none flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">1. STRICTLY NECESSARY</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-none uppercase font-bold">
                      ALWAYS ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                    Required for core Web Audio DSP nodes, crossfader state, local volume settings, and IndexedDB waveform peak caches.
                  </p>
                </div>
                <div className="w-10 h-6 bg-zinc-900 border border-zinc-800 rounded-none flex items-center justify-end px-1 opacity-60 cursor-not-allowed">
                  <div className="w-4 h-4 rounded-none bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>
              </div>

              {/* Category 2: Analytics */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-none flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">2. ANALYTICS & PERFORMANCE</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                    Anonymous telemetry used to measure mix playback performance, load speeds, and Cloudflare CDN response rates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick(700, 'sine', 0.02);
                    setPrefs(prev => ({ ...prev, analytics: !prev.analytics }));
                  }}
                  className={`w-11 h-6 rounded-none transition-colors p-1 cursor-pointer flex items-center border ${
                    prefs.analytics ? 'bg-primary border-primary justify-end' : 'bg-zinc-900 border-zinc-800 justify-start'
                  }`}
                >
                  <motion.div
                    layout
                    className={`w-4 h-4 rounded-none ${prefs.analytics ? 'bg-black' : 'bg-zinc-500'}`}
                  />
                </button>
              </div>

              {/* Category 3: Marketing & External Widgets */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-none flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">3. EXTERNAL WIDGETS & MARKETING</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                    Third-party embedded SoundCloud audio players, newsletter signup tracking, and promotional stream alerts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick(700, 'sine', 0.02);
                    setPrefs(prev => ({ ...prev, marketing: !prev.marketing }));
                  }}
                  className={`w-11 h-6 rounded-none transition-colors p-1 cursor-pointer flex items-center border ${
                    prefs.marketing ? 'bg-cyan-500 border-cyan-500 justify-end' : 'bg-zinc-900 border-zinc-800 justify-start'
                  }`}
                >
                  <motion.div
                    layout
                    className={`w-4 h-4 rounded-none ${prefs.marketing ? 'bg-black' : 'bg-zinc-500'}`}
                  />
                </button>
              </div>

            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-900 pt-4">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3 h-3 text-zinc-600" />
                CHOICES ARE SAVED LOCALLY
              </span>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-red-600 text-black font-black uppercase text-xs tracking-widest rounded-none transition-colors cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(216,22,63,0.3)] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                SAVE PREFERENCES
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
