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
  let streamSettings = null;
  try {
    streamSettings = await client.fetch<any>(`*[_type == "liveStream"][0]{
      title,
      playbackId,
      viewerUserId,
      streamStatus,
      diagnosticsResolution,
      diagnosticsLatency
    }`);
  } catch (err) {
    console.warn('Could not fetch live stream settings from Sanity:', err);
  }

  const initialSettings = {
    title: streamSettings?.title || "Test VOD",
    playbackId: streamSettings?.playbackId || "EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs",
    viewerUserId: streamSettings?.viewerUserId || "user-id-007",
    streamStatus: streamSettings?.streamStatus || "active",
    resolution: streamSettings?.diagnosticsResolution || "1080P60 HD",
    latency: streamSettings?.diagnosticsLatency || "Low Latency"
  };

  return <LiveClient initialSettings={initialSettings} />;
}
