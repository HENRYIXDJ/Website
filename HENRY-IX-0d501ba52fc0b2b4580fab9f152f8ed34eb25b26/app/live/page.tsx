import LiveClient from './live-client';
import { Metadata } from 'next';
import { client } from '@/sanity/lib/client';

export const metadata: Metadata = {
  title: 'Live Transmission Broadcasts | HENRY IX',
  description: 'Tune in to live streaming performance sets, studio rehearsals, and archives for DJ Henry IX.',
  alternates: {
    canonical: 'https://henryix.com/live',
  },
  openGraph: {
    title: 'Live Transmission Broadcasts | HENRY IX',
    description: 'Tune in to live streaming performance sets, studio rehearsals, and archives for DJ Henry IX.',
    url: 'https://henryix.com/live',
    siteName: 'HENRY IX DJ',
    locale: 'en_GB',
    type: 'website',
  },
};

export default async function Page() {
  let streams = [];
  try {
    streams = await client.fetch<any[]>(`*[_type == "liveStream"] | order(_createdAt desc){
      _id,
      title,
      playbackId,
      viewerUserId,
      status,
      scheduledTime,
      endedAt,
      diagnosticsResolution,
      diagnosticsLatency,
      _createdAt
    }`);
  } catch (err) {
    console.warn('Could not fetch live streams from Sanity:', err);
  }

  const activeStream = 
    streams.find((s: any) => s.status === 'live') || 
    streams.find((s: any) => s.status === 'upcoming') || 
    streams.find((s: any) => s.status === 'ended') || 
    streams[0];
  
  const initialSettings = {
    title: activeStream?.title || "Transmission Standby",
    playbackId: activeStream?.playbackId || "",
    viewerUserId: activeStream?.viewerUserId || "user-id-007",
    status: activeStream?.status || "standby",
    scheduledTime: activeStream?.scheduledTime || null,
    endedAt: activeStream?.endedAt || null,
    resolution: activeStream?.diagnosticsResolution || "1080P60 HD",
    latency: activeStream?.diagnosticsLatency || "Low Latency"
  };

  // Build history list
  const activeId = activeStream?._id;
  const dbHistory = streams
    .filter((s: any) => s._id !== activeId && s.status === 'archived')
    .map((s: any) => ({
      id: s._id,
      title: s.title,
      playbackId: s.playbackId,
      date: s._createdAt ? new Date(s._createdAt).toISOString().split('T')[0] : "2026-07-16",
      resolution: s.diagnosticsResolution || "1080P60 HD"
    }));

  const mockHistory = [
    { id: 'mock-4', title: "Knight Club: Session 4 - UK Garage Headliner", playbackId: "https://cph-p2p-hls.akamaized.net/hls/live/2000341/test/master.m3u8", date: "2026-07-02", resolution: "1080P60 HD" },
    { id: 'mock-3', title: "Knight Club: Session 3 - Deep Tech Rehearsal", playbackId: "https://cph-p2p-hls.akamaized.net/hls/live/2000341/test/master.m3u8", date: "2026-06-18", resolution: "1080P60 HD" },
    { id: 'mock-2', title: "Knight Club: Session 2 - Liquid DnB Blend", playbackId: "https://cph-p2p-hls.akamaized.net/hls/live/2000341/test/master.m3u8", date: "2026-06-04", resolution: "1080P60 HD" }
  ];

  const history = dbHistory.length > 0 ? dbHistory : mockHistory;

  return <LiveClient initialSettings={initialSettings} history={history} />;
}
