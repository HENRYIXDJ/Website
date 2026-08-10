'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { playClick, playTick } from '@/lib/audioUtils';

export default function OBSStreamControl() {
  const [serverUrl] = useState('rtmp://live.henryix.com/app');
  const [streamKey, setStreamKey] = useState('live_henryix_obs_8923749812');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [broadcastMode, setBroadcastMode] = useState<'immediate' | 'countdown'>('countdown');
  const [countdownMinutes, setCountdownMinutes] = useState<number>(5);

  const [notifyWebPush, setNotifyWebPush] = useState(true);
  const [notifyResendEmail, setNotifyResendEmail] = useState(true);
  const [notifyDiscord, setNotifyDiscord] = useState(true);

  const [platforms, setPlatforms] = useState([
    { id: 'yt', name: 'YOUTUBE LIVE', enabled: true, streamKey: 'yt_live_key_99812', status: 'READY' },
    { id: 'tw', name: 'TWITCH.TV', enabled: true, streamKey: 'live_user_henryix_tw', status: 'READY' },
    { id: 'kc', name: 'KICK.COM', enabled: false, streamKey: 'sk_us_kick_8812', status: 'OFFLINE' },
    { id: 'tk', name: 'TIKTOK LIVE', enabled: false, streamKey: 'tt_live_key_1102', status: 'OFFLINE' },
  ]);

  const [streamTitle, setStreamTitle] = useState('HENRY IX: KNIGHT CLUB LIVE SESSION');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    playClick();
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePlatform = (id: string) => {
    playTick();
    setPlatforms(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const updatePlatformKey = (id: string, key: string) => {
    setPlatforms(prev =>
      prev.map(p => (p.id === id ? { ...p, streamKey: key } : p))
    );
  };

  const handleStartBroadcast = async (overrideImmediate = false) => {
    playClick();
    setIsLoading(true);
    setStatusMessage(null);

    const selectedCountdown = overrideImmediate ? 0 : (broadcastMode === 'immediate' ? 0 : countdownMinutes);
    const actionType = selectedCountdown === 0 ? 'immediate' : 'publish';

    try {
      const res = await fetch('/api/live-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          countdownMinutes: selectedCountdown,
          streamUrl: serverUrl,
          obsStreamKey: streamKey,
          multiPlatformTargets: platforms,
          notifySubscribers: notifyResendEmail || notifyWebPush,
        }),
      });

      const data: any = await res.json();
      if (res.ok) {
        setIsBroadcasting(true);
        setStatusMessage(
          selectedCountdown === 0
            ? '🔴 BROADCAST ACTIVE NOW! Signal dispatched to all channels.'
            : `⏳ COUNTDOWN ACTIVATED: ${selectedCountdown} MINUTE ALERT DISPATCHED!`
        );
      } else {
        setStatusMessage(`ERROR: ${data.error || 'Failed to start broadcast'}`);
      }
    } catch (err: any) {
      setStatusMessage(`NETWORK ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBroadcast = async () => {
    playClick();
    setIsLoading(true);
    try {
      const res = await fetch('/api/live-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ended' }),
      });
      if (res.ok) {
        setIsBroadcasting(false);
        setStatusMessage('🏁 BROADCAST CONCLUDED - 30 MIN GRACE SCREEN ACTIVATED');
      }
    } catch (err: any) {
      setStatusMessage(`ERROR CONCLUDING: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-2xl relative font-mono text-zinc-100 rounded-none">
      {/* Skeuomorphic Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3.5 h-3.5 rounded-full ${isBroadcasting ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
          <h2 className="text-xl font-bold tracking-widest text-white uppercase font-avathe">
            OBS // MULTI-STREAM BROADCAST CONTROL
          </h2>
        </div>
        <span className="text-xs bg-red-950/80 text-red-400 border border-red-800/60 px-3 py-1 font-mono uppercase tracking-wider">
          {isBroadcasting ? 'SIGNAL: ON AIR' : 'SIGNAL: STANDBY'}
        </span>
      </div>

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-zinc-900 border-l-4 border-[#D8163F] text-zinc-200 text-sm flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-500 hover:text-white ml-4">✕</button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: OBS Ingest Credentials & Stream Setup */}
        <div className="space-y-6">
          <div className="bg-black border border-zinc-800 p-5 space-y-4">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
              <span>1. OBS SERVER INGEST URL</span>
              {copiedField === 'server' && <span className="text-emerald-400 font-normal">COPIED!</span>}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={serverUrl}
                className="w-full bg-zinc-900 text-zinc-200 px-3 py-2 text-sm border border-zinc-800 font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(serverUrl, 'server')}
                className="bg-zinc-800 hover:bg-[#D8163F] text-white text-xs px-3 py-2 font-mono uppercase tracking-wider transition-colors"
              >
                COPY
              </button>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 p-5 space-y-4">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
              <span>2. OBS STREAM KEY</span>
              {copiedField === 'key' && <span className="text-emerald-400 font-normal">COPIED!</span>}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type={showStreamKey ? 'text' : 'password'}
                value={streamKey}
                onChange={e => setStreamKey(e.target.value)}
                className="w-full bg-zinc-900 text-[#D8163F] font-bold px-3 py-2 text-sm border border-zinc-800 font-mono focus:outline-none"
              />
              <button
                onClick={() => setShowStreamKey(!showStreamKey)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs px-3 py-2 border border-zinc-700 font-mono uppercase"
              >
                {showStreamKey ? 'HIDE' : 'SHOW'}
              </button>
              <button
                onClick={() => copyToClipboard(streamKey, 'key')}
                className="bg-zinc-800 hover:bg-[#D8163F] text-white text-xs px-3 py-2 font-mono uppercase tracking-wider transition-colors"
              >
                COPY
              </button>
            </div>
          </div>

          {/* Broadcast Title & Stream Presets */}
          <div className="bg-black border border-zinc-800 p-5 space-y-4">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
              3. TRANSMISSION SHOW TITLE
            </label>
            <input
              type="text"
              value={streamTitle}
              onChange={e => setStreamTitle(e.target.value)}
              className="w-full bg-zinc-900 text-white px-3 py-2 text-sm border border-zinc-800 font-mono focus:border-[#D8163F] focus:outline-none"
              placeholder="e.g. Knight Club: Session 6 - UK Garage Special"
            />
          </div>

          {/* Recommended OBS Profile Card */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 text-xs space-y-2 text-zinc-400">
            <div className="text-white font-bold uppercase tracking-wider mb-2 text-xs flex items-center justify-between">
              <span>RECOMMENDED OBS ENCODER SETTINGS</span>
              <span className="text-[#D8163F]">1080P60 PRESET</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Video Encoder: <span className="text-zinc-200">x264 / NVENC H.264</span></div>
              <div>Target Bitrate: <span className="text-zinc-200">6000 Kbps</span></div>
              <div>Keyframe Interval: <span className="text-zinc-200">2 Seconds</span></div>
              <div>Audio Bitrate: <span className="text-zinc-200">320 Kbps AAC</span></div>
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Trigger & Countdown & Multi-Platform Matrix */}
        <div className="space-y-6">
          {/* Go Live Mode & Countdown Selector */}
          <div className="bg-black border border-zinc-800 p-5 space-y-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>4. BROADCAST MODE & COUNTDOWN TIMER</span>
              <span className="text-emerald-400">NOTIFICATIONS ACTIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { playTick(); setBroadcastMode('immediate'); }}
                className={`py-3 text-xs font-bold uppercase font-mono tracking-wider border transition-all ${
                  broadcastMode === 'immediate'
                    ? 'bg-[#D8163F] text-white border-[#D8163F] shadow-[0_0_15px_rgba(216,22,63,0.5)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                🔴 GO LIVE IMMEDIATELY
              </button>
              <button
                onClick={() => { playTick(); setBroadcastMode('countdown'); }}
                className={`py-3 text-xs font-bold uppercase font-mono tracking-wider border transition-all ${
                  broadcastMode === 'countdown'
                    ? 'bg-[#D8163F] text-white border-[#D8163F] shadow-[0_0_15px_rgba(216,22,63,0.5)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                ⏳ SCHEDULE COUNTDOWN
              </button>
            </div>

            {broadcastMode === 'countdown' && (
              <div className="pt-3 border-t border-zinc-800/80">
                <div className="text-[11px] text-zinc-400 font-mono mb-2 uppercase">SELECT COUNTDOWN DURATION (MINUTES):</div>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => { playTick(); setCountdownMinutes(mins); }}
                      className={`py-2 text-xs font-mono font-bold border transition-colors ${
                        countdownMinutes === mins
                          ? 'bg-zinc-100 text-black border-white'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {mins} MIN
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Checkboxes */}
            <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs text-zinc-300">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyWebPush}
                  onChange={e => setNotifyWebPush(e.target.checked)}
                  className="accent-[#D8163F] w-4 h-4"
                />
                <span>Web Browser & iOS PWA Push Notification Alert</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyResendEmail}
                  onChange={e => setNotifyResendEmail(e.target.checked)}
                  className="accent-[#D8163F] w-4 h-4"
                />
                <span>Resend Email Blast (<span className="text-[#D8163F]">broadcasts@henryix.com</span>)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyDiscord}
                  onChange={e => setNotifyDiscord(e.target.checked)}
                  className="accent-[#D8163F] w-4 h-4"
                />
                <span>Discord Webhook Channel Dispatch</span>
              </label>
            </div>
          </div>

          {/* Multi-Platform Restream Targets */}
          <div className="bg-black border border-zinc-800 p-5 space-y-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              5. MULTI-PLATFORM RESTREAM DESTINATIONS
            </div>
            <div className="space-y-3">
              {platforms.map(p => (
                <div key={p.id} className="bg-zinc-900/80 p-3 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={() => togglePlatform(p.id)}
                        className="accent-[#D8163F] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{p.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${p.enabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-500'}`}>
                      {p.enabled ? 'ACTIVE TARGET' : 'DISABLED'}
                    </span>
                  </div>
                  {p.enabled && (
                    <input
                      type="password"
                      value={p.streamKey}
                      onChange={e => updatePlatformKey(p.id, e.target.value)}
                      placeholder={`Enter ${p.name} Stream Key`}
                      className="w-full bg-black text-zinc-300 px-3 py-1.5 text-xs border border-zinc-800 font-mono focus:outline-none focus:border-[#D8163F]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Master Stream Action Trigger Buttons */}
          <div className="pt-2">
            {!isBroadcasting ? (
              <button
                disabled={isLoading}
                onClick={() => handleStartBroadcast()}
                className="w-full py-4 bg-[#D8163F] hover:bg-red-600 text-white font-bold font-mono tracking-widest uppercase text-base border-2 border-red-500 shadow-[0_0_25px_rgba(216,22,63,0.6)] transition-all disabled:opacity-50"
              >
                {isLoading ? 'INITIATING BROADCAST...' : (broadcastMode === 'immediate' ? '🚀 GO LIVE NOW' : `⏳ START ${countdownMinutes} MIN COUNTDOWN`)}
              </button>
            ) : (
              <button
                disabled={isLoading}
                onClick={handleStopBroadcast}
                className="w-full py-4 bg-zinc-900 hover:bg-black text-red-400 font-bold font-mono tracking-widest uppercase text-base border-2 border-red-800 shadow-[0_0_15px_rgba(216,22,63,0.3)] transition-all disabled:opacity-50"
              >
                {isLoading ? 'CONCLUDING...' : '⏹ STOP LIVE BROADCAST'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
