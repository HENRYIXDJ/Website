import React from 'react';
import { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy & Legal Disclosures | HENRY IX',
  description: 'Official UK GDPR and PECR Privacy Policy, Cookie Policy, and Legal Disclosures for HENRY IX.',
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="w-full max-w-4xl mx-auto py-12 px-4 md:px-8 font-mono text-zinc-300">
        
        {/* Header */}
        <div className="border-b border-zinc-900 pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-widest">
            <span>●</span> UK LEGAL & DATA PROTECTION COMPLIANCE
          </div>
          <h1 className="text-3xl md:text-5xl font-sans font-black tracking-widest text-primary uppercase mb-4 glitch" data-text="PRIVACY POLICY">
            PRIVACY POLICY
          </h1>
          <div className="flex flex-wrap gap-4 text-[10px] text-zinc-500 uppercase tracking-widest">
            <span>EFFECTIVE DATE: AUGUST 2026</span>
            <span>•</span>
            <span>JURISDICTION: UNITED KINGDOM (ICO REGULATED)</span>
            <span>•</span>
            <span>FRAMEWORK: UK GDPR & PECR</span>
          </div>
        </div>

        {/* Legal Contents */}
        <div className="flex flex-col gap-10 leading-relaxed text-sm text-zinc-400 font-sans">
          
          {/* Section 1: Overview */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              01 // DATA CONTROLLER IDENTIFICATION
            </h2>
            <p>
              This Privacy Policy outlines how <strong className="text-zinc-200">HENRY IX</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating in London, United Kingdom, collects, uses, stores, and protects your personal data when you visit and interact with this website (<strong className="text-zinc-200">henryix.com</strong>).
            </p>
            <p>
              We act as the <strong className="text-zinc-200">Data Controller</strong> under the <strong className="text-zinc-200">UK General Data Protection Regulation (UK GDPR)</strong> and the <strong className="text-zinc-200">Data Protection Act 2018</strong>.
            </p>
            <div className="bg-black border border-zinc-900 rounded-none p-4 font-mono text-xs text-zinc-400 flex flex-col gap-1">
              <span className="text-zinc-500 uppercase tracking-widest font-bold">Data Protection Contact</span>
              <span className="text-zinc-200">Email: henryixdj@gmail.com</span>
              <span className="text-zinc-500">Location: London, United Kingdom</span>
            </div>
          </section>

          {/* Section 2: Data Collected */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              02 // PERSONAL DATA WE COLLECT
            </h2>
            <p>We may collect and process the following categories of personal information:</p>
            <ul className="list-disc list-inside flex flex-col gap-2 font-mono text-xs text-zinc-300">
              <li><strong className="text-zinc-100">Contact & Booking Information:</strong> Your name, email address, phone number, event venue, and project details submitted via our contact and ticket inquiry forms.</li>
              <li><strong className="text-zinc-100">Newsletter Subscriptions:</strong> Your email address when you voluntarily sign up for event notifications or mix release announcements.</li>
              <li><strong className="text-zinc-100">Technical & Telemetry Data:</strong> IP address, browser type, device operating system, referring URLs, time zone settings, and interactive audio player telemetry (mix playback progress, deck interactions).</li>
              <li><strong className="text-zinc-100">Cookies & Local Storage State:</strong> Waveform peak caches, volume/EQ fader preferences, and explicit cookie consent choices stored via browser local storage and cookies.</li>
            </ul>
          </section>

          {/* Section 3: Lawful Basis */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              03 // LAWFUL BASES FOR PROCESSING
            </h2>
            <p>Under Article 6 of the UK GDPR, we rely on the following lawful bases to process your personal data:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 font-mono text-xs">
              <div className="bg-black border border-zinc-900 rounded-none p-4 flex flex-col gap-2">
                <span className="text-primary font-bold uppercase tracking-wider">A. Consent</span>
                <p className="text-zinc-400 font-sans text-xs">
                  Where you have given clear consent for optional cookies, email marketing subscriptions, or non-essential analytics tracking. You can withdraw consent at any time.
                </p>
              </div>
              <div className="bg-black border border-zinc-900 rounded-none p-4 flex flex-col gap-2">
                <span className="text-cyan-400 font-bold uppercase tracking-wider">B. Contractual Necessity</span>
                <p className="text-zinc-400 font-sans text-xs">
                  Necessary to perform a contract with you (e.g. processing event booking requests, live performance inquiries, or ticket reservations).
                </p>
              </div>
              <div className="bg-black border border-zinc-900 rounded-none p-4 flex flex-col gap-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider">C. Legitimate Interests</span>
                <p className="text-zinc-400 font-sans text-xs">
                  To ensure site security, prevent fraudulent activity, optimize Web Audio DSP performance, and analyze site reliability.
                </p>
              </div>
              <div className="bg-black border border-zinc-900 rounded-none p-4 flex flex-col gap-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider">D. Legal Obligation</span>
                <p className="text-zinc-400 font-sans text-xs">
                  To comply with applicable UK statutory and regulatory obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Third-Party Service Processors */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              04 // THIRD-PARTY INFRASTRUCTURE & PROCESSORS
            </h2>
            <p>We utilize trusted third-party infrastructure providers to deliver audio streams, manage content, and handle communications:</p>
            <div className="flex flex-col gap-3 font-mono text-xs text-zinc-300">
              <div className="border-l-2 border-primary pl-3 py-1">
                <strong className="text-white block">Cloudflare (Workers & R2 Storage):</strong>
                <span className="text-zinc-400 font-sans text-xs">Used for hosting edge web server functions, streaming audio mix files, and serving media assets securely under strict TLS encryption.</span>
              </div>
              <div className="border-l-2 border-cyan-400 pl-3 py-1">
                <strong className="text-white block">Sanity.io CMS:</strong>
                <span className="text-zinc-400 font-sans text-xs">Headless content management system used for dynamic mix archives, gallery image metadata, and live stream status.</span>
              </div>
              <div className="border-l-2 border-emerald-400 pl-3 py-1">
                <strong className="text-white block">SoundCloud API:</strong>
                <span className="text-zinc-400 font-sans text-xs">Embedded widget audio streaming for selected DJ mix tracks. Subject to SoundCloud&apos;s Privacy Policy.</span>
              </div>
              <div className="border-l-2 border-purple-400 pl-3 py-1">
                <strong className="text-white block">Resend Email API:</strong>
                <span className="text-zinc-400 font-sans text-xs">Transactional email infrastructure for dispatching newsletter notifications and booking confirmation responses.</span>
              </div>
            </div>
          </section>

          {/* Section 5: Cookie Policy */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              05 // COOKIE POLICY (PECR COMPLIANCE)
            </h2>
            <p>
              In accordance with the <strong className="text-zinc-200">Privacy and Electronic Communications Regulations (PECR)</strong>, we obtain prior consent before placing non-essential cookies or tracking technologies on your device.
            </p>
            <p className="font-mono text-xs text-zinc-300">We categorize cookies into:</p>
            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="bg-black border border-zinc-900 rounded-none p-3">
                <span className="text-emerald-400 font-bold uppercase tracking-wider block mb-1">1. Strictly Necessary (Always Active)</span>
                <span className="text-zinc-400 font-sans text-xs">Essential for audio DSP playback, crossfader state, volume faders, and IndexedDB waveform peak rendering. Consent is not legally required for strictly necessary functionality.</span>
              </div>
              <div className="bg-black border border-zinc-900 rounded-none p-3">
                <span className="text-cyan-400 font-bold uppercase tracking-wider block mb-1">2. Analytics & Performance (Optional)</span>
                <span className="text-zinc-400 font-sans text-xs">Anonymous telemetry used to measure mix playback performance and monitor site load speed. Requires explicit user opt-in consent.</span>
              </div>
              <div className="bg-black border border-zinc-900 rounded-none p-3">
                <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">3. External Widgets & Marketing (Optional)</span>
                <span className="text-zinc-400 font-sans text-xs">Third-party embedded player cookies (such as SoundCloud). Requires explicit user opt-in consent.</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              You can change or withdraw your cookie consent choices at any time by clicking the <strong className="text-primary font-mono">[COOKIE PREFERENCES]</strong> link in the website footer.
            </p>
          </section>

          {/* Section 6: User Rights Under UK GDPR */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              06 // YOUR LEGAL RIGHTS UNDER UK GDPR
            </h2>
            <p>As a UK / EU data subject, you hold statutory rights regarding your personal data:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-black border border-zinc-900 rounded-none">
                <strong className="text-white block mb-0.5">Right of Access:</strong>
                <span className="text-zinc-500 font-sans text-xs">Request copies of personal data held about you.</span>
              </div>
              <div className="p-3 bg-black border border-zinc-900 rounded-none">
                <strong className="text-white block mb-0.5">Right to Rectification:</strong>
                <span className="text-zinc-500 font-sans text-xs">Request correction of inaccurate or incomplete data.</span>
              </div>
              <div className="p-3 bg-black border border-zinc-900 rounded-none">
                <strong className="text-white block mb-0.5">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong>
                <span className="text-zinc-500 font-sans text-xs">Request deletion of your data under specific conditions.</span>
              </div>
              <div className="p-3 bg-black border border-zinc-900 rounded-none">
                <strong className="text-white block mb-0.5">Right to Object:</strong>
                <span className="text-zinc-500 font-sans text-xs">Object to processing based on legitimate interests or direct marketing.</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              To exercise any of your rights, please submit a request to <a href="mailto:henryixdj@gmail.com" className="text-primary underline font-mono">henryixdj@gmail.com</a>. We will respond within one calendar month.
            </p>
          </section>

          {/* Section 7: ICO Regulatory Contact */}
          <section className="bg-black border border-zinc-900 rounded-none p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider text-primary border-b border-zinc-900 pb-2">
              07 // RIGHT TO LODGE A COMPLAINT (ICO)
            </h2>
            <p>
              If you have concerns regarding our data processing practices, we encourage you to contact us first so we can resolve the issue directly.
            </p>
            <p>
              You also have the right to lodge a formal complaint with the UK data protection supervisory authority:
            </p>
            <div className="bg-black border border-zinc-900 rounded-none p-4 font-mono text-xs text-zinc-400 flex flex-col gap-1">
              <span className="text-white font-bold uppercase tracking-wider">Information Commissioner&apos;s Office (ICO)</span>
              <span>Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</span>
              <span>Helpline: 0303 123 1113</span>
              <span>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://ico.org.uk</a></span>
            </div>
          </section>

        </div>

        {/* Back navigation footer */}
        <div className="mt-12 pt-6 border-t border-zinc-900 flex justify-between items-center text-xs">
          <Link href="/" className="px-4 py-2 bg-black hover:bg-zinc-900 border border-zinc-900 rounded-none text-zinc-400 hover:text-zinc-200 transition-colors uppercase font-mono tracking-widest font-bold">
            ← RETURN TO ARCHIVE
          </Link>
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
            SYS_REF // PRIVACY_v4.1
          </span>
        </div>

      </div>
    </PageShell>
  );
}
