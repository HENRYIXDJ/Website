'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export { GigSchedule as Schedule } from './GigSchedule';
export { NewsletterForm as MailingList } from './NewsletterForm';
export { ContactForm } from './ContactForm';

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 20 };

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
        className="w-full h-64 border border-dashed border-zinc-900 rounded-none flex flex-col items-center justify-center gap-4 text-zinc-600 bg-black"
      >
        <Cloud className="w-10 h-10 opacity-50 animate-bounce" />
        <span className="font-mono text-xs tracking-widest uppercase text-primary">Vault Sealed</span>
        <span className="text-sm font-sans tracking-wide text-zinc-400">Physical editions arriving late 2026</span>
      </motion.div>
    </section>
  );
}
