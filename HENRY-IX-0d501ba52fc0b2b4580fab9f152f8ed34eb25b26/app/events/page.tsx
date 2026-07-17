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

async function fetchCalendarEvents() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

  if (!calendarId || !apiKey) {
    return null;
  }

  try {
    const now = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?key=${apiKey}&timeMin=${now}&singleEvents=true&orderBy=startTime&maxResults=10`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Calendar API status: ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || [];
    
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    return items.map((event: any) => {
      const startDateStr = event.start?.dateTime || event.start?.date || '';
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      const location = event.location || 'TBA';
      const parts = location.split(',');
      const venue = parts[0]?.trim() || 'TBA';
      const city = parts.slice(1).join(',')?.trim() || 'London, UK';

      const desc = event.description || '';
      let link = 'https://ra.co';
      let status = 'TICKETS';

      if (desc.includes('http')) {
        const match = desc.match(/https?:\/\/[^\s]+/);
        if (match) {
          link = match[0];
        }
      }
      if (desc.toLowerCase().includes('sold out')) {
        status = 'SOLD OUT';
      } else if (desc.toLowerCase().includes('free')) {
        status = 'FREE';
      }

      return {
        id: event.id,
        date: startDate.getDate().toString().padStart(2, '0'),
        month: MONTHS[startDate.getMonth()],
        year: startDate.getFullYear().toString(),
        city,
        venue,
        status,
        link,
      };
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return null;
  }
}

export default async function Page() {
  const events = await fetchCalendarEvents();

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
    "event": events ? events.map((e: any) => ({
      "@type": "MusicEvent",
      "name": `HENRY IX Live at ${e.venue}`,
      "startDate": `${e.year}-${e.month}-${e.date}`,
      "location": {
        "@type": "Place",
        "name": e.venue,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": e.city,
          "addressCountry": "GB"
        }
      },
      "performer": {
        "@type": "MusicGroup",
        "name": "HENRY IX",
        "url": "https://henryix.com"
      }
    })) : [
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
      <EventsClient initialEvents={events} />
    </>
  );
}
