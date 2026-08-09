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

function parseICSDate(dateStr: string): Date {
  const cleanStr = dateStr.replace(/[^0-9TZ]/g, '');
  const year = parseInt(cleanStr.substring(0, 4), 10);
  const month = parseInt(cleanStr.substring(4, 6), 10) - 1;
  const day = parseInt(cleanStr.substring(6, 8), 10);

  if (cleanStr.includes('T')) {
    const hour = parseInt(cleanStr.substring(9, 11), 10);
    const min = parseInt(cleanStr.substring(11, 13), 10);
    const sec = parseInt(cleanStr.substring(13, 15), 10);
    
    if (cleanStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    }
    return new Date(year, month, day, hour, min, sec);
  }
  
  return new Date(year, month, day);
}

async function fetchCalendarEvents() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    console.warn('GOOGLE_CALENDAR_ID is not configured');
    return null;
  }

  try {
    const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Calendar fetch status: ${res.status}`);
    }

    const icsText = await res.text();
    const parsedEvents: any[] = [];
    const lines = icsText.split(/\r?\n/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle folded lines
      while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
        line += lines[i+1].substring(1);
        i++;
      }

      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        parsedEvents.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const match = line.match(/^([^;:]+)(?:;[^:]+)?:(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          if (key === 'SUMMARY') {
            currentEvent.summary = value;
          } else if (key === 'LOCATION') {
            currentEvent.location = value;
          } else if (key === 'DESCRIPTION') {
            currentEvent.description = value;
          } else if (key === 'DTSTART') {
            currentEvent.start = value;
          } else if (key === 'UID') {
            currentEvent.uid = value;
          }
        }
      }
    }

    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const formattedEvents = parsedEvents
      .map((event: any) => {
        const startDate = event.start ? parseICSDate(event.start) : new Date();
        const location = event.location || 'TBA';
        const cleanLocation = location.replace(/\\,/g, ',').replace(/\\;/g, ';');
        const parts = cleanLocation.split(',');
        const venue = parts[0]?.trim() || 'TBA';
        const city = parts.slice(1).join(',')?.trim() || 'London, UK';

        const rawDesc = event.description || '';
        const desc = rawDesc.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
        
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
          id: event.uid || Math.random().toString(),
          date: startDate.getDate().toString().padStart(2, '0'),
          month: MONTHS[startDate.getMonth()],
          year: startDate.getFullYear().toString(),
          city,
          venue,
          status,
          link,
          rawDate: startDate,
        };
      })
      .filter((e: any) => e.rawDate >= now)
      .sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime())
      .slice(0, 10);

    return formattedEvents;
  } catch (error) {
    console.error('Error fetching/parsing calendar events:', error);
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
