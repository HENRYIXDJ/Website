'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, Settings } from 'lucide-react';
import CookiePreferencesModal, { CookiePreferences } from './CookiePreferencesModal';
import { playClick } from '@/lib/audioUtils';

const STORAGE_KEY = 'henryix_cookie_consent_v1';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    if (typeof window === 'undefined') return { necessary: true, analytics: false, marketing: false };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { necessary: true, analytics: false, marketing: false };
    } catch {
      return { necessary: true, analytics: false, marketing: false };
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
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
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 select-none"
          >
            <div className="bg-black border border-zinc-900 rounded-none p-5 font-mono text-zinc-300 relative overflow-hidden">
            {/* Top primary status line */}
            <div className="h-1 bg-primary w-full absolute top-0 left-0 right-0" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="p-2 bg-black border border-zinc-900 rounded-none text-primary shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      DATA TELEMETRY & COOKIE PREFERENCES
                    </span>
                    <span className="text-[7.5px] px-1.5 py-0.5 bg-black border border-zinc-900 text-zinc-400 font-mono rounded-none uppercase">
                      PRIVACY_PROTOCOL_v2.4
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    We use local storage and essential cookies for Web Audio DSP state, session recovery, and anonymous traffic metrics. No third-party data broker tracking.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-900">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 py-2.5 px-4 bg-primary hover:bg-red-600 text-black font-black uppercase text-[10.5px] tracking-widest rounded-none transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  ACCEPT ALL
                </button>

                <button
                  onClick={handleRejectNonEssential}
                  className="flex-1 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-200 font-black uppercase text-[10.5px] tracking-widest rounded-none transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  REJECT NON-ESSENTIAL
                </button>

                <button
                  onClick={() => {
                    playClick(800, 'sine', 0.02);
                    setIsModalOpen(true);
                  }}
                  className="py-2.5 px-3 bg-black hover:bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-wider rounded-none transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  PREFERENCES
                </button>
              </div>

            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for detailed preferences */}
      <CookiePreferencesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveConsent}
        initialPreferences={preferences}
      />
    </>
  );
}
