'use client';

import { useState } from 'react';
import { parseRekordboxXml, RekordboxTrackData } from '@/lib/parsers/rekordboxXmlParser';
import { isSupportedAudioFile } from '@/lib/audioUtils';

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
   * Process a list or folder of local audio files directly in memory (zero server upload)
   */
  const loadFilesFromInput = async (files: FileList | File[]) => {
    try {
      setIsLoading(true);
      const filesArray = Array.from(files);
      if (filesArray.length === 0) {
        setIsLoading(false);
        return;
      }

      let rekordboxData: Map<string, RekordboxTrackData> = new Map();
      
      // Check for Rekordbox XML export file first
      for (const file of filesArray) {
        if (file.name.toLowerCase() === 'export.xml' || file.name.toLowerCase() === 'rekordbox.xml') {
          try {
            const xmlText = await file.text();
            rekordboxData = parseRekordboxXml(xmlText);
          } catch (e) {}
        }
      }

      const foundTracks: LocalUsbTrack[] = [];
      for (const file of filesArray) {
        if (isSupportedAudioFile(file).supported) {
          const objectUrl = URL.createObjectURL(file);
          const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
          const lookupKey = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
          const rkMatch = rekordboxData.get(lookupKey);

          foundTracks.push({
            id: `usb_${Math.random().toString(36).substring(2, 9)}`,
            title: rkMatch?.title || cleanTitle,
            artist: rkMatch?.artist || 'Local Track',
            bpm: rkMatch?.bpm || 120,
            key: rkMatch?.key || '8A',
            file,
            objectUrl,
            hotCues: rkMatch?.hotCues || [],
            isLocalFile: true,
          });
        }
      }

      const detectedName = filesArray[0]?.webkitRelativePath
        ? filesArray[0].webkitRelativePath.split('/')[0]
        : 'LOCAL MUSIC';

      setUsbFolderName(detectedName);
      setUsbTracks(prev => {
        prev.forEach(t => { if (t.objectUrl) URL.revokeObjectURL(t.objectUrl); });
        return foundTracks;
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Error scanning local files:', err);
      setIsLoading(false);
    }
  };

  /**
   * Connect USB Flash Drive or Local Music Folder via Web File System Access API
   */
  const connectUsbDrive = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        // Fallback for browsers without showDirectoryPicker
        const input = document.createElement('input');
        input.type = 'file';
        (input as any).webkitdirectory = true;
        (input as any).directory = true;
        input.multiple = true;
        input.onchange = (e: any) => {
          if (e.target.files) {
            loadFilesFromInput(e.target.files);
          }
        };
        input.click();
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
            } else if (isSupportedAudioFile(file).supported) {
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
      setUsbTracks(prev => {
        prev.forEach(t => { if (t.objectUrl) URL.revokeObjectURL(t.objectUrl); });
        return foundTracks;
      });
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
    loadFilesFromInput,
    usbTracks,
    usbFolderName,
    isLoading,
  };
}
