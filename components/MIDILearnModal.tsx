'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Cpu, Activity, RefreshCw } from 'lucide-react';
import { midiEngine, MIDIDeviceInfo } from '@/lib/midiEngine';
import { ALL_HARDWARE_PRESETS } from '@/lib/midiPresets';
import { playClick } from '@/lib/audioUtils';

interface MIDILearnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MIDILearnModal({ isOpen, onClose }: MIDILearnModalProps) {
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('xdj_rx3_hardware');
  const [learningCommandId, setLearningCommandId] = useState<string | null>(null);
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    handleRequestPermissions();

    const unsubDevices = midiEngine.subscribeDevices((devs, activePresetName) => {
      setDevices(devs);
      const matched = ALL_HARDWARE_PRESETS.find(p => p.name === activePresetName);
      if (matched) {
        setSelectedPresetId(matched.id);
      }
    });

    const unsubRaw = midiEngine.subscribeRawEvents((msg) => {
      const logLine = `[CH ${msg.channel + 1}] ${msg.status.toUpperCase()} #${msg.number} val:${msg.value} (${msg.hex})`;
      setRawLogs(prev => [logLine, ...prev.slice(0, 19)]);
    });

    return () => {
      unsubDevices();
      unsubRaw();
    };
  }, [isOpen]);

  const handleRequestPermissions = async () => {
    playClick();
    setIsInitializing(true);
    await midiEngine.init();
    setIsInitializing(false);
  };

  const handleSelectPreset = (presetId: string) => {
    playClick();
    setSelectedPresetId(presetId);
    const preset = ALL_HARDWARE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      midiEngine.setActivePreset(preset);
    }
  };

  const handleStartLearn = (mappingId: string) => {
    playClick();
    setLearningCommandId(mappingId);
    midiEngine.startMIDILearn((learned) => {
      if (learned.channel !== undefined && learned.status && learned.number !== undefined) {
        midiEngine.updateMappingItem(mappingId, learned.channel, learned.status as any, learned.number);
      }
      setLearningCommandId(null);
      midiEngine.stopMIDILearn();
    });
  };

  if (!isOpen) return null;

  const currentPreset = midiEngine.getActivePreset();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-950 border-2 border-zinc-800 rounded-none w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-black">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[#D8163F] animate-pulse" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-avathe">
                  UNIVERSAL WEBMIDI HARDWARE ENGINE & MAPPING
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Pioneer XDJ-RX3, DDJ-400, DDJ-FLX4, CDJ-3000, DDJ-1000, Denon Prime, Traktor Kontrol, Numark & Custom Gear
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6 text-xs bg-zinc-950">
            {/* Devices Status & Permission Action Bar */}
            <div className="bg-black border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#D8163F]" /> CONNECTED HARDWARE STATUS
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRequestPermissions}
                    disabled={isInitializing}
                    className="bg-zinc-900 hover:bg-[#D8163F] text-white border border-zinc-700 text-[11px] px-3 py-1 font-mono uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isInitializing ? 'animate-spin' : ''}`} />
                    <span>{isInitializing ? 'INITIALIZING...' : 'REQUEST WEBMIDI PERMISSIONS'}</span>
                  </button>

                  <span className={`text-[10px] px-2.5 py-1 border font-bold uppercase tracking-wider ${
                    devices.length > 0
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800'
                  }`}>
                    {devices.length > 0 ? `${devices.length} CONTROLLER(S) CONNECTED` : 'CLICK BUTTON TO CONNECT'}
                  </span>
                </div>
              </div>

              {devices.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic">
                  Plug in your Pioneer XDJ-RX3, DDJ-400, or USB DJ Controller and click &quot;REQUEST WEBMIDI PERMISSIONS&quot;. Rekordbox / Serato SysEx wake-up handshakes dispatch automatically.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {devices.map(dev => (
                    <div key={dev.id} className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-white text-xs">{dev.name}</span>
                      <span className="text-[10px] text-zinc-500">({dev.manufacturer || 'USB MIDI Core'})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hardware Profile Selector */}
            <div className="bg-black border border-zinc-800 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  ACTIVE CONTROLLER HARDWARE PROFILE
                </span>
                
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#D8163F] cursor-pointer"
                >
                  {ALL_HARDWARE_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.mappings.length} Binds)</option>
                  ))}
                </select>
              </div>

              {/* MIDI Binds Mapping Table */}
              <div className="border border-zinc-800 bg-zinc-950 max-h-56 overflow-y-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="p-2">Control Action</th>
                      <th className="p-2">Deck Target</th>
                      <th className="p-2">Channel / Type</th>
                      <th className="p-2">CC / Note #</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {currentPreset.mappings.map(map => (
                      <tr key={map.id} className="hover:bg-black/60">
                        <td className="p-2 font-bold text-white">{map.type} {map.pad ? `[PAD ${map.pad}]` : ''}</td>
                        <td className="p-2 text-zinc-400">{map.deckId ? `DECK ${map.deckId}` : 'MASTER'}</td>
                        <td className="p-2 text-zinc-400">CH {map.channel + 1} ({map.status.toUpperCase()})</td>
                        <td className="p-2 font-mono font-bold text-[#D8163F]">#{map.number} {map.is14Bit ? `(14-Bit LSB #${map.lsbNumber})` : ''}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleStartLearn(map.id)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer border transition-colors ${
                              learningCommandId === map.id 
                                ? 'bg-[#D8163F] text-white border-red-500 animate-pulse'
                                : 'bg-zinc-900 hover:bg-black text-zinc-300 border-zinc-800'
                            }`}
                          >
                            {learningCommandId === map.id ? 'Listening...' : 'Learn'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real-time Raw Hex Console Signal Logger */}
            <div className="bg-black border border-zinc-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>REAL-TIME RAW MIDI HEX SIGNAL CONSOLE</span>
                </span>
                <span className="text-[10px] text-zinc-500">Sub-2ms Hardware Latency</span>
              </div>
              <div className="bg-zinc-950 p-3 border border-zinc-900 h-24 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-1">
                {rawLogs.length === 0 ? (
                  <span className="text-zinc-600 italic">Waiting for physical hardware events... Move faders or press pads on your controller.</span>
                ) : (
                  rawLogs.map((log, i) => (
                    <div key={i} className="leading-none">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-zinc-800 bg-black flex items-center justify-between text-xs">
            <span className="text-[10px] text-zinc-500 font-mono">
              WebMIDI 14-Bit Pitch Fader & 2&apos;s Complement Jogwheel Physics Active
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#D8163F] hover:bg-red-600 text-white font-mono text-xs font-bold uppercase border border-red-500 cursor-pointer transition-colors shadow-md"
            >
              DONE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
