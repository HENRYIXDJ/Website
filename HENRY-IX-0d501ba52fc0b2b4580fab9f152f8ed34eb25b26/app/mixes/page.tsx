import MixesClient from './mixes-client';
import { Metadata } from 'next';
import { getStorageUrl } from '@/lib/storage';
import { proxyUrl } from '@/lib/mixes';

export const metadata: Metadata = {
  title: 'Interactive CDJS & Mix Archive | HENRY IX',
  description: 'Listen to high-quality live-recorded mixes in the virtual CDJ Vault. Stream sessions from Knight Club, Royal Court, and Corner New Cross.',
  alternates: {
    canonical: 'https://henryix.com/mixes',
  },
  openGraph: {
    title: 'Interactive CDJS & Mix Archive | HENRY IX',
    description: 'Listen to high-quality live-recorded mixes in the virtual CDJ Vault. Stream sessions from Knight Club, Royal Court, and Corner New Cross.',
    url: 'https://henryix.com/mixes',
    siteName: 'HENRY IX DJ',
    images: [
      {
        url: 'https://henryix.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HENRY IX Virtual CDJ Mix Vault',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive CDJS & Mix Archive | HENRY IX',
    description: 'Listen to high-quality live-recorded mixes in the virtual CDJ Vault.',
    images: ['https://henryix.com/og-image.jpg'],
  },
};

export default function Page() {
  return (
    <>
      <link rel="preload" as="image" href={getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%201.jpg')} />
      <link rel="preload" as="image" href={getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%202.jpg')} />
      <link rel="preload" as="image" href={getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%203.jpg')} />
      <link rel="preload" as="image" href={getStorageUrl('/Mixes/Knight%20Club/Mix%20Artwork/Session%204.jpg')} />
      <MixesClient />
    </>
  );
}
