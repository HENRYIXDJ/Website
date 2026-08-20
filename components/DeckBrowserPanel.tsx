'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Search, X, Music, Folder, FolderOpen, Upload, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClick, playLockoutBlip, SUPPORTED_AUDIO_ACCEPT, isSupportedAudioFile } from '@/lib/audioUtils';
import { detectCamelotKey, isHarmonicallyCompatible, getHarmonicCompatibilityInfo, CAMELOT_MAP } from '@/lib/proTrackAnalysis';
import { useAudioStore } from '@/store/audioStore';
import { DeckBadge, DeckId } from './DeckBadge';
import { HarmonicRadarDrawer } from './HarmonicRadarDrawer';

interface DeckBrowserPanelProps {
  deckCount?: 2 | 4;
  activeDeckId?: DeckId;
  mixGroups: any[];
  browserFolder: string;
  onFolderSelect: (folderName: string) => void;
  detectedBpms: Record<string, number>;
  onTrackSelect: (track: any, deckId: DeckId) => void;
  onLoadLocalFile?: (file: File, targetDeckId?: DeckId) => void;
  themeColor?: string;
  isExpandedView?: boolean;
  onCloseExpanded?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DeckBrowserPanel({
  deckCount = 2,
  activeDeckId = 1,
  mixGroups,
  browserFolder,
  onFolderSelect,
  detectedBpms,
  onTrackSelect,
  onLoadLocalFile,
  themeColor = '#D8163F',
  isExpandedView = false,
  onCloseExpanded,
  isCollapsed = false,
  onToggleCollapse,
}: DeckBrowserPanelProps) {
  const decks = useAudioStore(s => s.decks);
  const playLockEnabled = useAudioStore(s => s.playLockEnabled);
  const setPlayLockEnabled = useAudioStore(s => s.setPlayLockEnabled);
  const playedTrackIds = useAudioStore(s => s.playedTrackIds || []);
  const activeDeckObj = decks[activeDeckId];
  const masterKey = activeDeckObj?.isPlaying ? detectCamelotKey(activeDeckObj?.title || '', activeDeckObj?.bpm || 120).code : null;

  const [isExpanded, setIsExpanded] = useState(isExpandedView);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<string>('ALL');
  const [selectedBpmFilter, setSelectedBpmFilter] = useState<string>('ALL');
  const [sortColumn, setSortColumn] = useState<'title' | 'key' | 'bpm'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFoldersSidebar, setShowFoldersSidebar] = useState(true);
  const [selectedTargetDeck, setSelectedTargetDeck] = useState<DeckId>(activeDeckId);
  const [prevActiveDeckId, setPrevActiveDeckId] = useState<DeckId>(activeDeckId);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);

  if (activeDeckId !== prevActiveDeckId) {
    setPrevActiveDeckId(activeDeckId);
    setSelectedTargetDeck(activeDeckId);
  }

  const tracks: any[] = browserFolder === 'all'
    ? (mixGroups || []).flatMap(g => g.mixes || [])
    : ((mixGroups || []).find(g => g.title.toLowerCase() === browserFolder.toLowerCase())?.mixes || []);

  const activeBpm = activeDeckObj?.bpm || 124;

  const filteredTracks = tracks.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const trackBpm = (detectedBpms[t.id] || t.bpm || 120).toString();
      const keyObj = detectCamelotKey(t.title, Number(trackBpm));
      const matchText = `${t.title} ${t.artist || ''} ${keyObj.code} ${keyObj.name} ${trackBpm}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    if (selectedKeyFilter !== 'ALL') {
      const trackBpm = detectedBpms[t.id] || t.bpm || 120;
      const keyObj = detectCamelotKey(t.title, trackBpm);
      if (keyObj.code !== selectedKeyFilter) return false;
    }

    if (selectedBpmFilter !== 'ALL') {
      const trackBpm = detectedBpms[t.id] || t.bpm || 120;
      if (selectedBpmFilter === '±4%') {
        const minBpm = activeBpm * 0.96;
        const maxBpm = activeBpm * 1.04;
        if (trackBpm < minBpm || trackBpm > maxBpm) return false;
      } else if (selectedBpmFilter === '±8%') {
        const minBpm = activeBpm * 0.92;
        const maxBpm = activeBpm * 1.08;
        if (trackBpm < minBpm || trackBpm > maxBpm) return false;
      } else if (selectedBpmFilter === '115-124') {
        if (trackBpm < 115 || trackBpm > 124) return false;
      } else if (selectedBpmFilter === '125-130') {
        if (trackBpm < 125 || trackBpm > 130) return false;
      } else if (selectedBpmFilter === '130+') {
        if (trackBpm < 130) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const bpmA = detectedBpms[a.id] || a.bpm || 120;
    const bpmB = detectedBpms[b.id] || b.bpm || 120;
    const keyA = detectCamelotKey(a.title, bpmA).code;
    const keyB = detectCamelotKey(b.title, bpmB).code;

    let res = 0;
    if (sortColumn === 'bpm') {
      res = bpmA - bpmB;
    } else if (sortColumn === 'key') {
      const numA = parseInt(keyA) || 0;
      const numB = parseInt(keyB) || 0;
      res = numA - numB || keyA.localeCompare(keyB);
    } else {
      res = (a.title || '').localeCompare(b.title || '');
    }

    return sortDirection === 'asc' ? res : -res;
  });

  // Keyboard navigation for track list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        onCloseExpanded?.();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedTrackIndex(prev => Math.min(filteredTracks.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedTrackIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTracks[selectedTrackIndex]) {
          onTrackSelect(filteredTracks[selectedTrackIndex], selectedTargetDeck);
          if (isExpanded) {
            setIsExpanded(false);
            onCloseExpanded?.();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onCloseExpanded, filteredTracks, selectedTrackIndex, selectedTargetDeck, onTrackSelect]);

  const deckTargetIds: DeckId[] = deckCount === 4 ? [1, 2, 3, 4] : [1, 2];

  // Minimized bottom bar view
  if (isCollapsed) {
    return (
      <div 
        className="w-full bg-black border-t border-zinc-900 px-2 py-1 flex items-center justify-between gap-2 text-zinc-300 font-mono text-[8.5px] select-none shrink-0"
        style={{ borderTopColor: themeColor }}
      >
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          <div className="flex items-center gap-1 shrink-0 text-zinc-500 font-bold uppercase tracking-wider text-[7.5px] bg-zinc-950 px-1.5 py-0.5 border border-zinc-900">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <span>CRATE BAR</span>
          </div>

          {/* Folder Pills */}
          <button
            onClick={() => { playClick(900, 'sine', 0.02); onFolderSelect('all'); }}
            className={cn(
              "px-2 py-0.5 font-bold uppercase tracking-tight shrink-0 border transition-all text-[8px]",
              browserFolder === 'all'
                ? "bg-primary text-black border-primary font-black"
                : "bg-zinc-950 text-zinc-400 hover:text-white border-zinc-900"
            )}
          >
            ALL ({ (mixGroups || []).flatMap(g => g.mixes || []).length })
          </button>

          {(mixGroups || []).map(group => (
            <button
              key={group.title}
              onClick={() => { playClick(900, 'sine', 0.02); onFolderSelect(group.title); }}
              className={cn(
                "px-2 py-0.5 font-bold uppercase tracking-tight shrink-0 border transition-all text-[8px] truncate max-w-[110px]",
                browserFolder.toLowerCase() === group.title.toLowerCase()
                  ? "bg-primary text-black border-primary font-black"
                  : "bg-zinc-950 text-zinc-400 hover:text-white border-zinc-900"
              )}
            >
              {group.title}
            </button>
          ))}
        </div>

        {/* Right side controls: USB Loader & Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* USB / Local File Loader Button */}
          {onLoadLocalFile && (
            <label className="py-0.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 font-bold uppercase text-[7.5px] tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0">
              <Upload className="w-2.5 h-2.5" />
              <span>LOAD USB / FILE</span>
              <input
                type="file"
                accept={SUPPORTED_AUDIO_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onLoadLocalFile) {
                    const check = isSupportedAudioFile(file);
                    if (check.supported) {
                      onLoadLocalFile(file, selectedTargetDeck);
                    } else if (check.reason) {
                      alert(check.reason);
                    }
                  }
                }}
                className="hidden"
              />
            </label>
          )}

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 text-[8px] w-24 md:w-32">
            <Search className="w-2.5 h-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-white font-mono text-[8px] focus:outline-none w-full tracking-wider placeholder-zinc-600"
            />
          </div>

          <button
            onClick={() => {
              playClick(900, 'sine', 0.03);
              onToggleCollapse?.();
            }}
            className="py-0.5 px-2 bg-primary text-black font-black uppercase text-[8px] tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-neon-glow"
          >
            <ChevronUp className="w-3 h-3" />
            <span>OPEN CRATE (B)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="rounded-none border border-zinc-900 bg-zinc-950/95 flex flex-col text-zinc-300 font-mono text-[9px] select-none h-full w-full overflow-hidden shadow-2xl relative transition-all duration-300 min-h-0"
        style={{ borderTop: `2px solid ${themeColor}` }}
      >
        {/* Tracklist & Playlist Browser Header */}
        <div className="flex justify-between items-center bg-black/90 border-b border-zinc-900 px-2.5 py-1.5 shrink-0 text-[8px] text-zinc-400 tracking-wider uppercase font-bold">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
            <span className="truncate font-black">MASTER MUSIC CRATE BROWSER</span>
            <span className="text-[7.5px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 shrink-0">
              {filteredTracks.length} TRACKS
            </span>

            {/* Folder sidebar toggle button */}
            <button
              onClick={() => setShowFoldersSidebar(!showFoldersSidebar)}
              title="Toggle Folders Sidebar"
              className={cn(
                "py-0.5 px-1.5 text-[7.5px] border uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1",
                showFoldersSidebar ? "bg-zinc-900 border-zinc-700 text-white" : "bg-black border-zinc-900 text-zinc-500 hover:text-zinc-300"
              )}
            >
              {showFoldersSidebar ? <FolderOpen className="w-2.5 h-2.5 text-amber-400" /> : <Folder className="w-2.5 h-2.5" />}
              <span className="hidden sm:inline">FOLDERS</span>
            </button>

            {/* Industry Standard Play Lock Safety Toggle */}
            <button
              onClick={() => {
                playClick(800, 'sine', 0.02);
                setPlayLockEnabled(!playLockEnabled);
              }}
              title={playLockEnabled ? "PLAY LOCK ACTIVE: Prevents loading tracks onto playing decks (Rekordbox / Serato style)" : "PLAY LOCK OFF: Tracks can be loaded on playing decks"}
              className={cn(
                "py-0.5 px-1.5 text-[7.5px] border uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0 font-mono",
                playLockEnabled
                  ? "bg-red-950/80 border-red-800 text-red-400 hover:bg-red-900/90 shadow-sm"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              {playLockEnabled ? <Lock className="w-2.5 h-2.5 text-red-500 animate-pulse" /> : <Unlock className="w-2.5 h-2.5 text-zinc-500" />}
              <span className="hidden sm:inline">PLAY LOCK</span>
              <span>[{playLockEnabled ? "ON" : "OFF"}]</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Inline Search Bar */}
            <div className="flex items-center gap-1 bg-black border border-zinc-800 px-1.5 py-0.5 rounded-none text-[8px]">
              <Search className="w-2.5 h-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="SEARCH CRATE..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-white font-mono text-[8px] focus:outline-none w-20 sm:w-28 tracking-wider placeholder-zinc-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Expand Fullscreen Browser Button */}
            <button
              onClick={() => {
                playClick(900, 'sine', 0.03);
                setIsExpanded(true);
              }}
              title="Expand Full Master Crate"
              className="py-0.5 px-2 bg-zinc-900 hover:bg-primary hover:text-black border border-zinc-800 text-zinc-300 font-bold uppercase text-[7.5px] tracking-wider rounded-none transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>EXPAND</span>
            </button>

            {/* Collapse Panel Button */}
            {onToggleCollapse && (
              <button
                onClick={() => {
                  playClick(900, 'sine', 0.02);
                  onToggleCollapse();
                }}
                title="Collapse Crate Bar"
                className="py-0.5 px-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[7.5px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-0.5 shrink-0"
              >
                <ChevronDown className="w-3 h-3" />
                <span className="hidden sm:inline">HIDE</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex min-h-0 divide-x divide-zinc-900 bg-black">
          {/* Left Column: Playlist Folders Tree (Togglable) */}
          {showFoldersSidebar && (
            <div className="w-[26%] min-w-[120px] max-w-[200px] flex flex-col p-1.5 gap-1 overflow-y-auto custom-scrollbar shrink-0 bg-zinc-950">
              <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider px-1 mb-0.5">CRATES & FOLDERS</span>
              
              <button
                onClick={() => {
                  playClick(900, 'sine', 0.02);
                  onFolderSelect('all');
                }}
                title="ALL TRACKS"
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-none text-[8.5px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 min-w-0 overflow-hidden border",
                  browserFolder === 'all'
                    ? "bg-zinc-900 text-white border-l-2 border-primary"
                    : "bg-black text-zinc-400 hover:text-zinc-200 border-zinc-900"
                )}
              >
                <span className="shrink-0 text-[10px]">📂</span>
                <span className="truncate tracking-tight font-black">ALL TRACKS</span>
              </button>

              <div className="flex flex-col gap-0.5 mt-1 border-t border-zinc-900 pt-1">
                {(mixGroups || []).map((group) => (
                  <button
                    key={group.title}
                    onClick={() => {
                      playClick(900, 'sine', 0.02);
                      onFolderSelect(group.title);
                    }}
                    title={group.title}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-none text-[8.5px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 min-w-0 overflow-hidden border",
                      browserFolder.toLowerCase() === group.title.toLowerCase()
                        ? "bg-zinc-900 text-white border-l-2 border-primary"
                        : "bg-black text-zinc-500 hover:text-zinc-300 border-zinc-900"
                    )}
                  >
                    <span className="shrink-0 text-[10px]">📁</span>
                    <span className="truncate tracking-tight font-bold">{group.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Master Track File Browser Table */}
          <div className="flex-1 flex flex-col h-full bg-black min-w-0">
            {/* Pro DJ Filter Control Matrix */}
            <div className="flex items-center justify-between gap-2 px-2 py-1 bg-zinc-950 border-b border-zinc-900 text-[8px] text-zinc-400 overflow-x-auto custom-scrollbar no-scrollbar shrink-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider">KEY:</span>
                <select
                  value={selectedKeyFilter}
                  onChange={(e) => {
                    playClick(900, 'sine', 0.02);
                    setSelectedKeyFilter(e.target.value);
                  }}
                  className="bg-black border border-zinc-800 text-amber-400 font-mono font-bold text-[7.5px] px-1 py-0.5 rounded-none focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="ALL">ALL KEYS (24)</option>
                  <optgroup label="MINOR KEYS (A)">
                    {Object.keys(CAMELOT_MAP).filter(k => k.endsWith('A')).map(k => (
                      <option key={`opt-${k}`} value={k}>{k} ({CAMELOT_MAP[k].name})</option>
                    ))}
                  </optgroup>
                  <optgroup label="MAJOR KEYS (B)">
                    {Object.keys(CAMELOT_MAP).filter(k => k.endsWith('B')).map(k => (
                      <option key={`opt-${k}`} value={k}>{k} ({CAMELOT_MAP[k].name})</option>
                    ))}
                  </optgroup>
                </select>

                {masterKey && (
                  <button
                    onClick={() => {
                      playClick(900, 'sine', 0.02);
                      setSelectedKeyFilter(masterKey);
                    }}
                    title={`Filter by Deck ${activeDeckId} Key (${masterKey})`}
                    className={cn(
                      "px-1.5 py-0.5 border text-[7.5px] font-bold uppercase transition-colors shrink-0 cursor-pointer font-mono",
                      selectedKeyFilter === masterKey ? "bg-red-950 border-red-500 text-red-400" : "bg-black border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    🔑 MATCH DECK {activeDeckId} [{masterKey}]
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider">BPM:</span>
                {['ALL', '±4%', '±8%', '115-124', '125-130', '130+'].map(bpmRange => (
                  <button
                    key={`bpm-btn-${bpmRange}`}
                    onClick={() => {
                      playClick(900, 'sine', 0.02);
                      setSelectedBpmFilter(bpmRange);
                    }}
                    className={cn(
                      "px-1.5 py-0.5 border text-[7.5px] font-bold uppercase transition-colors shrink-0 cursor-pointer font-mono",
                      selectedBpmFilter === bpmRange
                        ? "bg-primary text-black border-primary font-black"
                        : "bg-black border-zinc-900 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {bpmRange}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header with Clickable Sorting */}
            <div className="grid grid-cols-[6%_48%_16%_14%_16%] items-center px-2 py-1 bg-zinc-950 border-b border-zinc-900 text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 select-none">
              <span>#</span>
              <button
                onClick={() => {
                  playClick(900, 'sine', 0.02);
                  if (sortColumn === 'title') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('title');
                    setSortDirection('asc');
                  }
                }}
                className="text-left flex items-center gap-1 hover:text-zinc-300 font-bold uppercase cursor-pointer"
              >
                <span>Track Title</span>
                {sortColumn === 'title' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </button>

              <button
                onClick={() => {
                  playClick(900, 'sine', 0.02);
                  if (sortColumn === 'key') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('key');
                    setSortDirection('asc');
                  }
                }}
                className="text-left flex items-center gap-1 hover:text-zinc-300 font-bold uppercase cursor-pointer"
              >
                <span>KEY</span>
                {sortColumn === 'key' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </button>

              <button
                onClick={() => {
                  playClick(900, 'sine', 0.02);
                  if (sortColumn === 'bpm') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('bpm');
                    setSortDirection('asc');
                  }
                }}
                className="text-left flex items-center gap-1 hover:text-zinc-300 font-bold uppercase cursor-pointer"
              >
                <span>BPM</span>
                {sortColumn === 'bpm' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </button>

              <span className="text-right">LOAD DECK</span>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5 min-h-0 bg-black">
              {filteredTracks.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-zinc-600 text-[8.5px] italic py-6">
                  No tracks match active filter settings
                </div>
              ) : (
                filteredTracks.map((mix, index) => {
                  const idxStr = (index + 1).toString().padStart(3, '0');
                  const trackBpm = detectedBpms[mix.id] || mix.bpm || 120;
                  const keyObj = detectCamelotKey(mix.title, trackBpm);
                  const harmInfo = masterKey ? getHarmonicCompatibilityInfo(masterKey, keyObj.code) : null;
                  const isPlayed = playedTrackIds.includes(mix.id);
                  const isSelected = index === selectedTrackIndex;

                  return (
                    <div 
                      key={mix.id}
                      draggable={true}
                      onClick={() => setSelectedTrackIndex(index)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (playLockEnabled && decks[selectedTargetDeck]?.isPlaying) {
                          playLockoutBlip();
                          return;
                        }
                        onTrackSelect(mix, selectedTargetDeck);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(mix));
                        e.dataTransfer.setData('text/plain', mix.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      title="Double-click to load, or drag onto deck"
                      className={cn(
                        "grid grid-cols-[6%_48%_16%_14%_16%] items-center px-2 py-1 rounded-none select-none border transition-colors cursor-grab active:cursor-grabbing group",
                        isSelected
                          ? "bg-zinc-900 border-primary/60 text-white"
                          : isPlayed
                            ? "bg-black border-transparent text-zinc-400 opacity-75 hover:opacity-100 hover:bg-zinc-950 hover:border-zinc-800"
                            : "bg-black border-transparent hover:bg-zinc-950 hover:border-zinc-800"
                      )}
                    >
                      <span className={cn("text-[8px] font-mono font-bold", isPlayed ? "text-emerald-500/70" : "text-zinc-500")}>
                        {isPlayed ? "✓" : idxStr}
                      </span>

                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <span className={cn("truncate uppercase tracking-wide text-[9px] font-bold", isPlayed ? "text-zinc-400" : "text-zinc-200")}>
                          🎵 {mix.title}
                        </span>
                        {isPlayed && (
                          <span className="text-[6px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 px-1 py-0.2 rounded-none font-bold shrink-0 uppercase font-mono">
                            PLAYED
                          </span>
                        )}
                        {harmInfo && harmInfo.isCompatible && (
                          <span 
                            className="text-[6px] border px-1 py-0.2 rounded-none font-bold shrink-0 uppercase font-mono"
                            style={{ borderColor: harmInfo.badgeColor, color: harmInfo.badgeColor, backgroundColor: `${harmInfo.badgeColor}15` }}
                          >
                            {harmInfo.badgeLabel}
                          </span>
                        )}
                      </div>

                      <span className="text-[8px] font-bold text-amber-400 font-mono">
                        {keyObj.code} ({keyObj.name})
                      </span>

                      <span className="text-[9px] font-bold text-zinc-300 font-mono">
                        {trackBpm} BPM
                      </span>

                      {/* Standardized Square Deck Badges for Direct Loading */}
                      <div className="flex items-center justify-end gap-1">
                        {deckTargetIds.map(dId => {
                          const isLoadedOnThisDeck = decks[dId]?.id === mix.id;
                          return (
                            <DeckBadge
                              key={`load-btn-${mix.id}-${dId}`}
                              deckId={dId}
                              variant="button"
                              isLoaded={isLoadedOnThisDeck}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (playLockEnabled && decks[dId]?.isPlaying) {
                                  playLockoutBlip();
                                  return;
                                }
                                onTrackSelect(mix, dId);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* CAMELOT HARMONIC RADAR MIX ASSISTANT */}
        <HarmonicRadarDrawer
          mixGroups={mixGroups}
          onLoadTrack={(track, targetDeck) => onTrackSelect(track, targetDeck as DeckId)}
          targetDeckId={selectedTargetDeck}
        />

        {/* BOTTOM USB / LOCAL FILE LOADER BAR */}
        {onLoadLocalFile && (
          <div className="bg-zinc-950 border-t border-zinc-900 px-3 py-1 flex items-center justify-between gap-3 shrink-0 text-[8px]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7.5px]">LOAD DECK:</span>
              <div className="flex items-center gap-1">
                {deckTargetIds.map(dId => (
                  <button
                    key={`target-pick-${dId}`}
                    onClick={() => setSelectedTargetDeck(dId)}
                    className={cn(
                      "w-4 h-4 rounded-none text-[7.5px] font-black font-mono transition-all border flex items-center justify-center cursor-pointer",
                      selectedTargetDeck === dId
                        ? dId === 1 ? "bg-red-600 text-white border-red-400 shadow-neon-glow" :
                          dId === 2 ? "bg-cyan-500 text-black border-cyan-300 shadow-neon-glow" :
                          dId === 3 ? "bg-emerald-600 text-white border-emerald-400 shadow-neon-glow" :
                          "bg-amber-500 text-black border-amber-300 shadow-neon-glow"
                        : "bg-black text-zinc-500 border-zinc-800 hover:text-white"
                    )}
                  >
                    D{dId}
                  </button>
                ))}
              </div>
            </div>

            <label className="py-1 px-3 bg-zinc-900 hover:bg-primary hover:text-black border border-zinc-800 text-amber-400 font-black tracking-widest uppercase text-[8px] transition-all cursor-pointer flex items-center gap-1.5 shadow-md">
              <Upload className="w-3 h-3" />
              <span>📁 LOAD USB / FILE INTO DECK {selectedTargetDeck}</span>
              <input
                type="file"
                accept={SUPPORTED_AUDIO_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onLoadLocalFile) {
                    const check = isSupportedAudioFile(file);
                    if (check.supported) {
                      onLoadLocalFile(file, selectedTargetDeck);
                    } else if (check.reason) {
                      alert(check.reason);
                    }
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* FULLSCREEN EXPANDED MASTER CRATE OVERLAY */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center select-none font-mono">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-6xl h-[92vh] bg-black border border-zinc-800 rounded-none shadow-[0_0_60px_rgba(216,22,63,0.3)] flex flex-col overflow-hidden relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-zinc-950 border-b border-zinc-900 p-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black border border-zinc-800 text-primary">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white text-sm md:text-base font-black tracking-widest uppercase flex items-center gap-2">
                      <span>MASTER MUSIC CRATE BROWSER</span>
                      <span className="text-[9px] px-2 py-0.5 bg-primary text-black font-black">FULL_SCREEN_CRATE</span>
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Select folder, search library, or load USB files directly to load decks (D1–D4)
                    </p>
                  </div>
                </div>

                {/* Search Bar & Close Button */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-black border border-zinc-800 px-3 py-1.5 rounded-none text-xs w-64 md:w-80">
                    <Search className="w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search title, key, bpm..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-transparent text-white font-mono text-xs focus:outline-none w-full tracking-wider placeholder-zinc-600"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      onCloseExpanded?.();
                    }}
                    className="p-2 bg-zinc-900 hover:bg-primary text-zinc-400 hover:text-black border border-zinc-800 transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Split Body */}
              <div className="flex-1 flex min-h-0 divide-x divide-zinc-900 bg-black">
                {/* Left Folder Tree (22% width) */}
                <div className="w-1/4 min-w-[200px] flex flex-col p-3 gap-2 overflow-y-auto custom-scrollbar bg-zinc-950">
                  <span className="text-xs font-black text-zinc-400 tracking-widest uppercase border-b border-zinc-900 pb-2">
                    PLAYLIST FOLDERS
                  </span>

                  <button
                    onClick={() => {
                      playClick(900, 'sine', 0.02);
                      onFolderSelect('all');
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-between border",
                      browserFolder === 'all'
                        ? "bg-zinc-900 text-white border-l-4 border-primary font-black"
                        : "bg-black text-zinc-400 hover:text-white border-zinc-900"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>📂</span>
                      <span>ALL TRACKS</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      ({(mixGroups || []).flatMap(g => g.mixes || []).length})
                    </span>
                  </button>

                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-zinc-900">
                    {(mixGroups || []).map((group) => (
                      <button
                        key={group.title}
                        onClick={() => {
                          playClick(900, 'sine', 0.02);
                          onFolderSelect(group.title);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-between border",
                          browserFolder.toLowerCase() === group.title.toLowerCase()
                            ? "bg-zinc-900 text-white border-l-4 border-primary font-black"
                            : "bg-black text-zinc-400 hover:text-white border-zinc-900"
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>📁</span>
                          <span className="truncate">{group.title}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          ({(group.mixes || []).length})
                        </span>
                      </button>
                    ))}
                  </div>

                  {onLoadLocalFile && (
                    <div className="mt-auto pt-4 border-t border-zinc-900 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span>LOAD DECK:</span>
                        <div className="flex items-center gap-1">
                          {deckTargetIds.map(dId => (
                            <button
                              key={`expanded-target-${dId}`}
                              onClick={() => setSelectedTargetDeck(dId)}
                              className={cn(
                                "w-5 h-5 text-[9px] font-black font-mono transition-all border flex items-center justify-center cursor-pointer",
                                selectedTargetDeck === dId
                                  ? dId === 1 ? "bg-red-600 text-white border-red-400" :
                                    dId === 2 ? "bg-cyan-500 text-black border-cyan-300" :
                                    dId === 3 ? "bg-emerald-600 text-white border-emerald-400" :
                                    "bg-amber-500 text-black border-amber-300"
                                  : "bg-black text-zinc-500 border-zinc-800"
                              )}
                            >
                              D{dId}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="w-full text-center py-3 bg-zinc-900 hover:bg-primary hover:text-black rounded-none border border-zinc-800 text-xs text-amber-400 font-black tracking-widest transition-all uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg">
                        <Upload className="w-4 h-4" />
                        <span>📁 LOAD USB / FILE TO D{selectedTargetDeck}</span>
                        <input
                          type="file"
                          accept={SUPPORTED_AUDIO_ACCEPT}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onLoadLocalFile) {
                              const check = isSupportedAudioFile(file);
                              if (check.supported) {
                                onLoadLocalFile(file, selectedTargetDeck);
                                setIsExpanded(false);
                                onCloseExpanded?.();
                              } else if (check.reason) {
                                alert(check.reason);
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Right Track List (78% width) */}
                <div className="w-3/4 flex flex-col h-full bg-black">
                  {/* Table Header */}
                  <div className="grid grid-cols-[6%_48%_18%_14%_14%] items-center px-4 py-2.5 bg-zinc-950 border-b border-zinc-900 text-xs text-zinc-400 font-black uppercase tracking-wider shrink-0 select-none">
                    <span>#</span>
                    <span>TRACK TITLE</span>
                    <span>CAMELOT KEY</span>
                    <span>BPM</span>
                    <span className="text-right">LOAD DECK</span>
                  </div>

                  {/* Table Rows */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 min-h-0 bg-black">
                    {filteredTracks.length === 0 ? (
                      <div className="flex-grow flex items-center justify-center text-zinc-600 text-xs italic py-12">
                        No tracks matching search
                      </div>
                    ) : (
                      filteredTracks.map((mix, index) => {
                        const idxStr = (index + 1).toString().padStart(3, '0');
                        const trackBpm = detectedBpms[mix.id] || mix.bpm || 120;
                        const keyObj = detectCamelotKey(mix.title, trackBpm);
                        const isHarmonicMatch = masterKey ? isHarmonicallyCompatible(masterKey, keyObj.code) : false;
                        const isPlayed = playedTrackIds.includes(mix.id);
                        const isSelected = index === selectedTrackIndex;

                        return (
                          <div
                            key={mix.id}
                            draggable={true}
                            onClick={() => setSelectedTrackIndex(index)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (playLockEnabled && decks[selectedTargetDeck]?.isPlaying) {
                                playLockoutBlip();
                                return;
                              }
                              onTrackSelect(mix, selectedTargetDeck);
                              setIsExpanded(false);
                              onCloseExpanded?.();
                            }}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify(mix));
                              e.dataTransfer.setData('text/plain', mix.id);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            title="Double-click to load into active deck"
                            className={cn(
                              "grid grid-cols-[6%_48%_18%_14%_14%] items-center px-4 py-3 rounded-none select-none border transition-colors cursor-grab active:cursor-grabbing group",
                              isSelected
                                ? "bg-zinc-900 border-primary/60 text-white"
                                : isPlayed
                                  ? "bg-black border-zinc-900 text-zinc-400 opacity-75 hover:opacity-100 hover:bg-zinc-950"
                                  : "bg-black border-zinc-900 hover:bg-zinc-950"
                            )}
                          >
                            <span className={cn("text-xs font-mono font-bold", isPlayed ? "text-emerald-500/70" : "text-zinc-500")}>
                              {isPlayed ? "✓" : idxStr}
                            </span>

                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className={cn("truncate uppercase text-xs font-bold tracking-wide", isPlayed ? "text-zinc-400" : "text-zinc-200")}>
                                🎵 {mix.title}
                              </span>
                              {isPlayed && (
                                <span className="text-[8px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 px-1.5 py-0.5 rounded-none font-black shrink-0">
                                  PLAYED
                                </span>
                              )}
                              {isHarmonicMatch && (
                                <span className="text-[8px] bg-emerald-950 border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded-none font-black shrink-0">
                                  HARMONIC MATCH
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-bold text-amber-400 font-mono">
                              {keyObj.code} ({keyObj.name})
                            </span>

                            <span className="text-xs font-bold text-zinc-300 font-mono">
                              {trackBpm} BPM
                            </span>

                            {/* Deck Badges Load Target Buttons */}
                            <div className="flex items-center justify-end gap-1.5">
                              {deckTargetIds.map(dId => {
                                const isLoadedOnThisDeck = decks[dId]?.id === mix.id;
                                return (
                                  <DeckBadge
                                    key={`expanded-load-btn-${mix.id}-${dId}`}
                                    deckId={dId}
                                    variant="button"
                                    size="lg"
                                    isLoaded={isLoadedOnThisDeck}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onTrackSelect(mix, dId);
                                      setIsExpanded(false);
                                      onCloseExpanded?.();
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default DeckBrowserPanel;
