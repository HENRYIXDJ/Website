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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": "https://henryix.com/#dj",
    "name": "HENRY IX",
    "genre": ["Electronic", "House", "Techno", "Dance"],
    "image": "https://henryix.com/og-image.jpg",
    "url": "https://henryix.com",
    "sameAs": [
      "https://soundcloud.com/henryix"
    ],
    "event": [
      {
        "@type": "MusicEvent",
        "name": "Knight Club: Session 5 - Live Headliner",
        "startDate": "2026-08-28T22:00:00+01:00",
        "endDate": "2026-08-29T04:00:00+01:00",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": "The Roundhouse",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Chalk Farm Rd",
            "addressLocality": "London",
            "postalCode": "NW1 8EH",
            "addressCountry": "GB"
          }
        },
        "image": "https://henryix.com/og-image.jpg",
        "description": "DJ Henry IX headlines the main deck arena with standard-defining transitions, live mixing visualizers, and heavy basslines.",
        "offers": {
          "@type": "Offer",
          "url": "https://henryix.com/events",
          "price": "15.00",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "validFrom": "2026-07-16T17:00:00+01:00"
        },
        "performer": {
          "@type": "MusicGroup",
          "name": "HENRY IX",
          "url": "https://henryix.com"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventsClient />
    </>
  );
}
