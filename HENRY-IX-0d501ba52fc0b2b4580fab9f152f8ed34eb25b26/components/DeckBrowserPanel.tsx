'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/audioUtils';

interface DeckBrowserPanelProps {
  deckId: 1 | 2 | 3 | 4;
  deck: any;
  mixGroups: any[];
  browserFolder: string;
  onFolderSelect: (folderName: string) => void;
  detectedBpms: Record<string, number>;
  onTrackSelect: (track: any, deckId: 1 | 2 | 3 | 4) => void;
  onLoadLocalFile?: (file: File) => void;
  themeColor: string;
}

export function DeckBrowserPanel({
  deckId,
  deck,
  mixGroups,
  browserFolder,
  onFolderSelect,
  detectedBpms,
  onTrackSelect,
  onLoadLocalFile,
  themeColor,
}: DeckBrowserPanelProps) {
  const isLocked = deck?.id === 'locked';

  let tracks: any[] = [];
  if (!isLocked) {
    if (browserFolder === 'all') {
      tracks = (mixGroups || []).flatMap(g => g.mixes || []);
    } else {
      const matchedGroup = (mixGroups || []).find(g => g.title.toLowerCase() === browserFolder.toLowerCase());
      tracks = matchedGroup ? (matchedGroup.mixes || []) : [];
    }
  }

  return (
    <div 
      className="rounded-xl border border-zinc-900 bg-zinc-950/90 flex flex-col text-zinc-300 font-mono text-[9px] select-none h-full w-full overflow-hidden shadow-2xl relative transition-all duration-300 min-h-0"
      style={{ borderTop: `2px solid ${themeColor}` }}
    >
      {/* Tracklist & Playlist Browser Header */}
      <div className="flex justify-between items-center bg-black/60 border-b border-zinc-900 px-3 py-1.5 shrink-0 text-[8px] text-zinc-500 tracking-wider uppercase font-bold">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
          <span>BROWSER // DECK {deckId}</span>
        </div>
        <span>USB1 // PLAYLISTS</span>
      </div>

      {/* Directory & Tracks Split Grid */}
      {isLocked ? (
        <div className="flex-grow flex flex-col justify-center items-center p-4 text-center min-h-[120px]">
          <span className="text-yellow-500 font-bold tracking-widest uppercase text-[11px]">
            DECK LOCKED // COMING SOON
          </span>
          <span className="text-zinc-600 text-[8px] mt-2 tracking-wider">
            ACCESS_DENIED // REQUIRE_RELEASE
          </span>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 w-full bg-black">
          {/* Left Column: Playlist Folders Tree */}
          <div className="w-[35%] border-r border-zinc-900 bg-black flex flex-col p-1.5 min-w-0 h-full overflow-hidden select-none">
            <span className="text-[6.5px] text-zinc-600 uppercase font-black tracking-widest px-1 mb-1 shrink-0">Source</span>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 min-h-0 pr-0.5">
              <button
                onClick={() => {
                  onFolderSelect('all');
                  playClick(800, 'sine', 0.02);
                }}
                className={cn(
                  "w-full text-left py-1 px-1.5 rounded-none transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer text-[8px] uppercase font-bold shrink-0",
                  browserFolder === 'all' ? "bg-black text-white border-l-2" : "text-zinc-500 hover:text-zinc-300"
                )}
                style={{ borderLeftColor: browserFolder === 'all' ? themeColor : 'transparent' }}
              >
                📂 ALL MIXES
              </button>
              {(mixGroups || []).map(group => (
                <button
                  key={group.title}
                  onClick={() => {
                    onFolderSelect(group.title);
                    playClick(800, 'sine', 0.02);
                  }}
                  className={cn(
                    "w-full text-left py-1 px-1.5 rounded-none transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer text-[8px] uppercase font-bold shrink-0",
                    browserFolder === group.title ? "bg-black text-white border-l-2" : "text-zinc-500 hover:text-zinc-300"
                  )}
                  style={{ borderLeftColor: browserFolder === group.title ? themeColor : 'transparent' }}
                >
                  📁 {group.title}
                </button>
              ))}
            </div>

            {/* Custom File Loader in Sidebar */}
            {onLoadLocalFile && (
              <div className="mt-auto border-t border-zinc-900 pt-1 shrink-0">
                <label className="w-full text-center py-1 bg-black hover:bg-zinc-900 rounded-none border border-zinc-900 text-[7px] text-zinc-400 hover:text-white tracking-widest font-black transition-colors uppercase cursor-pointer flex items-center justify-center gap-1">
                  <span>📁 LOAD FILE</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onLoadLocalFile) onLoadLocalFile(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Right Column: Track File Browser Table */}
          <div className="w-[65%] flex flex-col h-full bg-black min-w-0">
            {/* Table Header */}
            <div className="grid grid-cols-[12%_63%_25%] items-center px-2 py-1 bg-black/80 border-b border-zinc-900 text-[7px] text-zinc-600 font-bold uppercase tracking-wider shrink-0 select-none">
              <span>#</span>
              <span>Track Title</span>
              <span className="text-right">BPM</span>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5 min-h-0 bg-black">
              {tracks.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-zinc-600 text-[8px] italic py-4">
                  No tracks available
                </div>
              ) : (
                tracks.map((mix, index) => {
                  const isLoaded = deck?.id === mix.id;
                  const idxStr = (index + 1).toString().padStart(3, '0');
                  
                  return (
                    <div 
                      key={mix.id}
                      onClick={() => onTrackSelect(mix, deckId)}
                      className={cn(
                        "grid grid-cols-[12%_63%_25%] items-center px-1.5 py-1.5 rounded-none cursor-pointer transition-colors duration-200 select-none group border border-transparent",
                        isLoaded 
                          ? "bg-black text-white font-black border-zinc-800" 
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-black"
                      )}
                      style={{ 
                        borderColor: isLoaded ? `${themeColor}60` : 'transparent',
                        color: isLoaded ? themeColor : undefined 
                      }}
                    >
                      <span className={cn("text-[7.5px]", isLoaded ? "text-white" : "text-zinc-600 font-bold")}>
                        {idxStr}
                      </span>
                      <span className="truncate pr-1 uppercase tracking-wide text-[8.5px]">
                        🎵 {mix.title}
                      </span>
                      <span className="text-right text-[8.5px] font-bold text-zinc-500 font-mono">
                        {detectedBpms[mix.id] || mix.bpm || 120}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckBrowserPanel;
