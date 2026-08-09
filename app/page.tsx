import HomeClient from './home-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HENRY IX | DJ',
  description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in a wide range of genres including house, techno, edm, pop, R&B, Hip-Hop and Rap, Queer Disco and House and more. Mix your own songs using the online interactive CDJs, watch current live streams or catch up on old ones. See and book upcoming events and contact him.',
  alternates: {
    canonical: 'https://henryix.com',
  },
  openGraph: {
    title: 'HENRY IX | DJ',
    description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in a wide range of genres including house, techno, edm, pop, R&B, Hip-Hop and Rap, Queer Disco and House and more. Mix your own songs using the online interactive CDJs, watch current live streams or catch up on old ones. See and book upcoming events and contact him.',
    url: 'https://henryix.com',
    siteName: 'HENRY IX DJ',
    images: [
      {
        url: 'https://henryix.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HENRY IX DJ Portfolio & Live Mix Archive',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HENRY IX | DJ',
    description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in a wide range of genres.',
    images: ['https://henryix.com/og-image.jpg'],
  },
};

export default function Page() {
  return <HomeClient />;
}
