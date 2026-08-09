'use client';

import { useState } from 'react';
import { parseRekordboxXml, RekordboxTrackData } from '@/lib/parsers/rekordboxXmlParser';

export interface LocalUsbTrack {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  key?: string;
  file: File;
  objectUrl: string;
  hotCues?: any[];
  isLocalFile: true;
}

export function useUsbLibrary() {
  const [usbTracks, setUsbTracks] = useState<LocalUsbTrack[]>([]);
  const [usbFolderName, setUsbFolderName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Connect USB Flash Drive or Local Music Folder via Web File System Access API
   */
  const connectUsbDrive = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('Web File System Access API is supported in Chrome, Edge, and Opera browsers. Please use Chrome/Edge to connect USB drives directly.');
        return;
      }

      setIsLoading(true);
      const dirHandle = await (window as any).showDirectoryPicker();
      setUsbFolderName(dirHandle.name);

      const foundTracks: LocalUsbTrack[] = [];
      let rekordboxData: Map<string, RekordboxTrackData> = new Map();

      // Helper recursive directory scanner
      const scanDirectory = async (handle: any) => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();

            // Check for Rekordbox XML export file
            if (file.name.toLowerCase() === 'export.xml' || file.name.toLowerCase() === 'rekordbox.xml') {
              const xmlText = await file.text();
              rekordboxData = parseRekordboxXml(xmlText);
            } else if (/\.(mp3|wav|m4a|aac|flac|aiff)$/i.test(file.name)) {
              const objectUrl = URL.createObjectURL(file);
              const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
              const lookupKey = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

              const rkMatch = rekordboxData.get(lookupKey);

              foundTracks.push({
                id: `usb_${Math.random().toString(36).substring(2, 9)}`,
                title: rkMatch?.title || cleanTitle,
                artist: rkMatch?.artist || 'Local USB Track',
                bpm: rkMatch?.bpm || 120,
                key: rkMatch?.key || '8A',
                file,
                objectUrl,
                hotCues: rkMatch?.hotCues || [],
                isLocalFile: true,
              });
            }
          } else if (entry.kind === 'directory') {
            await scanDirectory(entry);
          }
        }
      };

      await scanDirectory(dirHandle);
      setUsbTracks(foundTracks);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      if (err.name !== 'AbortError') {
        console.error('Failed to access USB drive:', err);
      }
    }
  };

  return {
    connectUsbDrive,
    usbTracks,
    usbFolderName,
    isLoading,
  };
}
