/**
 * lib/parsers/rekordboxXmlParser.ts
 *
 * Rekordbox XML (export.xml) Parser for DJ hot cues, memory cues, beatgrids, BPM & Key
 */

export interface HotCuePoint {
  index: number;
  label: string;
  positionSec: number;
  type: 'hotcue' | 'memory' | 'loop';
  color?: string;
}

export interface RekordboxTrackData {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  key?: string;
  hotCues: HotCuePoint[];
  filePath?: string;
}

/**
 * Parse a Rekordbox export.xml file text content
 */
export function parseRekordboxXml(xmlString: string): Map<string, RekordboxTrackData> {
  const trackMap = new Map<string, RekordboxTrackData>();

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const trackNodes = xmlDoc.getElementsByTagName('TRACK');

    for (let i = 0; i < trackNodes.length; i++) {
      const node = trackNodes[i];
      const trackId = node.getAttribute('TrackID') || `track_${i}`;
      const title = node.getAttribute('Name') || 'Unknown Track';
      const artist = node.getAttribute('Artist') || 'Unknown Artist';
      const bpm = parseFloat(node.getAttribute('AverageBpm') || '120');
      const key = node.getAttribute('Tonality') || '';
      const filePath = node.getAttribute('Location') || '';

      const hotCues: HotCuePoint[] = [];
      const positionMarks = node.getElementsByTagName('POSITION_MARK');

      for (let j = 0; j < positionMarks.length; j++) {
        const mark = positionMarks[j];
        const num = parseInt(mark.getAttribute('Num') || `${j}`, 10);
        const startSec = parseFloat(mark.getAttribute('Start') || '0');
        const typeAttr = mark.getAttribute('Type') || '0';
        const type = typeAttr === '0' ? 'hotcue' : typeAttr === '1' ? 'memory' : 'loop';
        const label = mark.getAttribute('Name') || (num >= 0 ? `Cue ${String.fromCharCode(65 + num)}` : 'Cue');

        hotCues.push({
          index: num,
          label,
          positionSec: startSec,
          type,
        });
      }

      // Index by title/filename for easy lookup
      const lookupKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      trackMap.set(lookupKey, {
        id: trackId,
        title,
        artist,
        bpm,
        key,
        hotCues,
        filePath,
      });
    }
  } catch (err) {
    console.error('Failed to parse Rekordbox XML:', err);
  }

  return trackMap;
}
