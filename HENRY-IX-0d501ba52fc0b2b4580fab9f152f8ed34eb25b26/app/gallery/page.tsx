import GalleryClient from './gallery-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery | HENRY IX',
  description: 'Browse high-resolution photographs, event crowd captures, deck layouts, and official cover art archives from the world of Henry IX.',
  alternates: {
    canonical: 'https://henryix.com/gallery',
  },
  openGraph: {
    title: 'Gallery | HENRY IX',
    description: 'Browse high-resolution photographs, event crowd captures, deck layouts, and official cover art archives from the world of Henry IX.',
    url: 'https://henryix.com/gallery',
    siteName: 'HENRY IX DJ',
    images: [
      {
        url: 'https://henryix.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HENRY IX Photography & Cover Art Gallery',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery | HENRY IX',
    description: 'Browse high-resolution photographs, event crowd captures, deck layouts, and official cover art archives from the world of Henry IX.',
    images: ['https://henryix.com/og-image.jpg'],
  },
};

export default function Page() {
  return <GalleryClient />;
}
