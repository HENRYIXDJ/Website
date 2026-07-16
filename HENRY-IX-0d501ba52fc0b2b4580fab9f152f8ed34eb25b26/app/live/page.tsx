import LiveClient from './live-client';
import { Metadata } from 'next';

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

export default function Page() {
  return <LiveClient />;
}
