import EventsClient from './events-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Performance Schedule & Events | HENRY IX',
  description: 'See upcoming live performance dates, locations, ticket purchase links, and residencies for DJ Henry IX.',
  alternates: {
    canonical: 'https://henryix.com/events',
  },
  openGraph: {
    title: 'Live Performance Schedule & Events | HENRY IX',
    description: 'See upcoming live performance dates, locations, ticket purchase links, and residencies for DJ Henry IX.',
    url: 'https://henryix.com/events',
    siteName: 'HENRY IX DJ',
    images: [
      {
        url: 'https://henryix.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HENRY IX Performance Tour Dates & Events',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Performance Schedule & Events | HENRY IX',
    description: 'See upcoming live performance dates, locations, ticket purchase links, and residencies for DJ Henry IX.',
    images: ['https://henryix.com/og-image.jpg'],
  },
};

export default function Page() {
  return <EventsClient />;
}
