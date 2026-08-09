'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, Settings } from 'lucide-react';
import CookiePreferencesModal, { CookiePreferences } from './CookiePreferencesModal';
import { playClick } from '@/lib/audioUtils';

const STORAGE_KEY = 'henryix_cookie_consent_v1';

interface CookieConsentBannerProps {
  onConsentSaved?: () => void;
}

export default function CookieConsentBanner({ onConsentSaved }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
      const cookieExists = document.cookie.includes('henryix_consent');
      if (!saved && !cookieExists) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Listen for custom trigger event to open preferences anytime (e.g. from footer)
  useEffect(() => {
    const handleOpenTrigger = () => {
      setIsModalOpen(true);
    };
    window.addEventListener('open-cookie-preferences', handleOpenTrigger);
    return () => window.removeEventListener('open-cookie-preferences', handleOpenTrigger);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    setPreferences(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      document.cookie = `henryix_consent=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    setIsVisible(false);
    if (onConsentSaved) {
      onConsentSaved();
    }
  };

  const handleAcceptAll = () => {
    playClick(900, 'sine', 0.03);
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleRejectNonEssential = () => {
    playClick(600, 'sine', 0.03);
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md select-none overflow-y-auto custom-scrollbar">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-lg bg-black border border-zinc-800 p-6 md:p-8 font-mono text-zinc-300 relative overflow-hidden shadow-[0_0_50px_rgba(216,22,63,0.35)] rounded-none"
            >
              {/* Top primary glowing border */}
              <div className="h-1 bg-primary w-full absolute top-0 left-0 right-0 shadow-[0_0_12px_var(--color-primary-glow)]" />

              {/* Header Title */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-900 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-zinc-950 border border-zinc-900 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-xs md:text-sm font-black tracking-[0.15em] uppercase">
                      COOKIE & TELEMETRY PROTOCOL
                    </h3>
                    <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
                      PRIVACY_SETTINGS // UK_GDPR_COMPLIANT
                    </span>
                  </div>
                </div>

                <span className="text-[8px] font-bold px-2 py-0.5 bg-red-950/60 border border-primary/40 text-primary uppercase tracking-widest shrink-0">
                  v2.4_STAGED
                </span>
              </div>

              {/* Concise Policy Text */}
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-sans">
                We use local storage and essential cookies to manage Web Audio DSP nodes, crossfader state, and peak waveform caches. No third-party data broker tracking.
              </p>

              {/* Quick Summary Badges */}
              <div className="grid grid-cols-3 gap-2 mb-6 text-[9.5px]">
                <div className="bg-zinc-950 border border-zinc-900 p-2.5 flex flex-col gap-1 items-start">
                  <span className="text-emerald-400 font-bold tracking-wider">[ESSENTIAL]</span>
                  <span className="text-zinc-500 text-[8.5px]">Web Audio DSP</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-2.5 flex flex-col gap-1 items-start">
                  <span className="text-zinc-400 font-bold tracking-wider">[ANALYTICS]</span>
                  <span className="text-zinc-500 text-[8.5px]">Performance Metrics</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-2.5 flex flex-col gap-1 items-start">
                  <span className="text-cyan-400 font-bold tracking-wider">[WIDGETS]</span>
                  <span className="text-zinc-500 text-[8.5px]">Stream & Audio</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  onClick={handleAcceptAll}
                  className="w-full sm:flex-1 py-3 px-4 bg-primary hover:bg-red-600 text-black font-black uppercase text-xs tracking-widest rounded-none transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(216,22,63,0.3)] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  ACCEPT ALL
                </button>

                <button
                  onClick={handleRejectNonEssential}
                  className="w-full sm:flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold uppercase text-xs tracking-wider rounded-none transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  ESSENTIAL ONLY
                </button>

                <button
                  onClick={() => {
                    playClick(800, 'sine', 0.02);
                    setIsModalOpen(true);
                  }}
                  className="w-full sm:w-auto py-3 px-3.5 bg-black hover:bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-wider rounded-none transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Settings className="w-3.5 h-3.5" />
                  CUSTOMIZE
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed preferences manager modal */}
      <CookiePreferencesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveConsent}
        initialPreferences={preferences}
      />
    </>
  );
}
