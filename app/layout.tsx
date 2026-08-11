import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { AudioProvider } from '@/components/AudioProvider';
import ClientLayoutWrappers from '@/components/ClientLayoutWrappers';

const avathe = localFont({
  src: './fonts/avathe.otf',
  variable: '--font-avathe',
  adjustFontFallback: false,
});

const ocra = localFont({
  src: './fonts/ocra.woff',
  variable: '--font-ocra',
  adjustFontFallback: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
});

export const viewport: Viewport = {
  themeColor: '#D8163F',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://henryix.com'),
  title: {
    default: 'HENRY IX | DJ',
    template: '%s | HENRY IX',
  },
  description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in a wide range of genres including house, techno, edm, pop, R&B, Hip-Hop and Rap, Queer Disco and House.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HENRY IX DJ',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://henryix.com',
    siteName: 'HENRY IX DJ',
    title: 'HENRY IX | DJ',
    description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in house, techno, edm, pop, R&B, Hip-Hop, and Queer House.',
    images: [
      {
        url: 'https://pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev/Mixes/Knight%20Club/Mix%20Artwork/Knight%20Club%20Track%20Artwork%20Session%201.jpg',
        width: 1200,
        height: 630,
        alt: 'HENRY IX DJ Transmission Console',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HENRY IX | DJ',
    description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in house, techno, edm, pop, R&B, Hip-Hop, and Queer House.',
    site: '@HenryIXDJ',
    creator: '@HenryIXDJ',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Person', 'MusicGroup'],
  '@id': 'https://henryix.com/#person',
  'name': 'HENRY IX',
  'alternateName': 'Henry IX DJ',
  'url': 'https://henryix.com',
  'image': 'https://henryix.com/og-image.jpg',
  'description': 'Explore the world of HENRY IX. Listen to iconic DJ sets in a wide range of genres including house, techno, edm, pop, R&B, Hip-Hop and Rap, Queer Disco and House.',
  'address': {
    '@type': 'PostalAddress',
    'addressLocality': 'London',
    'addressCountry': 'GB',
  },
  'sameAs': [
    'https://soundcloud.com/henryixdj',
    'https://www.mixcloud.com/HenryIXDJ/',
    'https://www.instagram.com/henryixdj/',
    'https://www.tiktok.com/@henryixdj',
    'https://www.youtube.com/@HenryIXDJ',
    'https://www.twitch.tv/henryixdj',
    'https://www.facebook.com/HenryIXDJ/',
    'https://x.com/HenryIXDJ',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${avathe.variable} ${ocra.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <link rel="preload" href="https://w.soundcloud.com/player/api.js" as="script" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-black">
        <AudioProvider>
          <ClientLayoutWrappers>
            {children}
          </ClientLayoutWrappers>
        </AudioProvider>
      </body>
    </html>
  );
}
