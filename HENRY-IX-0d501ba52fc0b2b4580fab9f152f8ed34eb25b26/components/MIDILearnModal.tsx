'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Cpu } from 'lucide-react';
import { midiEngine, MIDIDeviceInfo } from '@/lib/midiEngine';
import { ALL_HARDWARE_PRESETS } from '@/lib/midiPresets';

interface MIDILearnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MIDILearnModal({ isOpen, onClose }: MIDILearnModalProps) {
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pioneer_xdj_rx3');
  const [learningCommandId, setLearningCommandId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    midiEngine.init();

    const unsubDevices = midiEngine.subscribeDevices((devs) => {
      setDevices(devs);
    });

    return () => {
      unsubDevices();
    };
  }, [isOpen]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = ALL_HARDWARE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      midiEngine.setActivePreset(preset);
    }
  };

  const handleStartLearn = (mappingId: string) => {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-black border border-zinc-900 rounded-none w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-900 bg-black">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-primary animate-pulse" />
              <div>
                <h3 className="font-mono text-sm font-black uppercase tracking-wider text-zinc-100">
                  WebMIDI Hardware Link & Mapping
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Pioneer XDJ-RX3, CDJ-3000, DDJ-1000/FLX4, Numark, Hercules & Custom Controllers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-none text-zinc-400 hover:text-zinc-100 hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs font-mono bg-black">
            {/* Devices Status Panel */}
            <div className="bg-black border border-zinc-900 rounded-none p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" /> Connected USB DJ Hardware
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-none border border-emerald-800/40 bg-emerald-950/40 text-emerald-400 font-bold uppercase">
                  {devices.length > 0 ? `${devices.length} Hardware Connected` : 'Listening on WebMIDI...'}
                </span>
              </div>

              {devices.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic">
                  Plug in any USB MIDI controller (Pioneer CDJ/DDJ, Traktor Kontrol, Akai, Novation, or custom WebMIDI hardware) and press buttons/faders to auto-bind.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {devices.map(dev => (
                    <div key={dev.id} className="bg-black border border-zinc-900 rounded-none px-3 py-1 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-zinc-200 text-[11px]">{dev.name}</span>
                      <span className="text-[9px] text-zinc-500">({dev.manufacturer || 'MIDI Core'})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Presets & Mapping Controls */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Hardware Presets & Controls Mapping
                </span>
                
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="bg-black border border-zinc-900 rounded-none px-3 py-2 text-zinc-100 text-xs font-mono font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {ALL_HARDWARE_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.mappings.length} binds)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MIDI Monitor & Mapping List Table */}
              <div className="border border-zinc-900 rounded-none bg-black overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-black border-b border-zinc-900 text-zinc-400 font-bold uppercase">
                    <tr>
                      <th className="p-2">Control Action</th>
                      <th className="p-2">Deck</th>
                      <th className="p-2">Channel / Type</th>
                      <th className="p-2">CC / Note #</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {currentPreset.mappings.map(map => (
                      <tr key={map.id} className="hover:bg-black">
                        <td className="p-2 font-bold text-zinc-100">{map.type} {map.pad ? `[PAD ${map.pad}]` : ''}</td>
                        <td className="p-2 text-zinc-400">{map.deckId ? `DECK ${map.deckId}` : 'MASTER'}</td>
                        <td className="p-2 text-zinc-400">CH {map.channel + 1} ({map.status.toUpperCase()})</td>
                        <td className="p-2 font-mono font-bold text-primary">#{map.number} {map.is14Bit ? `(14-Bit LSB #${map.lsbNumber})` : ''}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleStartLearn(map.id)}
                            className={`px-2 py-1 rounded-none text-[9px] font-bold uppercase cursor-pointer border transition-colors ${
                              learningCommandId === map.id 
                                ? 'bg-primary text-white border-primary animate-pulse'
                                : 'bg-black hover:bg-black text-zinc-300 border-zinc-900'
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
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-zinc-900 bg-black flex items-center justify-between">
            <span className="text-[9px] text-zinc-500 font-mono">
              WebMIDI 14-Bit High Resolution Pitch & 2&apos;s Complement Jogwheel Physics Active
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-primary hover:bg-white text-black font-mono text-xs font-bold uppercase rounded-none cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
