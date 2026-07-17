import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { BotIdClient } from 'botid/client';
import { AudioProvider } from '@/components/AudioProvider';
import ClientLayoutWrappers from '@/components/ClientLayoutWrappers';


const avathe = localFont({
  src: './fonts/avathe.otf',
  variable: '--font-avathe',
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://henryix.com'),
  title: {
    default: 'HENRY IX | DJ',
    template: '%s | HENRY IX',
  },
  description: 'Explore the world of HENRY IX. Listen to iconic DJ sets in a wide range of genres including house, techno, edm, pop, R&B, Hip-Hop and Rap, Queer Disco and House.',
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
    <html lang="en" className={`${avathe.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preload" href="https://w.soundcloud.com/player/api.js" as="script" />
        <BotIdClient protect={[{ path: '/', method: 'POST' }, { path: '/contact', method: 'POST' }]} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-black">
        <AudioProvider>
          <ClientLayoutWrappers />
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
