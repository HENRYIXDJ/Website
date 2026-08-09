import ContactClient from './contact-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book DJ Henry IX | Contact & Inquiries',
  description: 'Book DJ Henry IX for live club events, festivals, private sessions, and corporate bookings. Send inquiries directly through our secure contact portal.',
  alternates: {
    canonical: 'https://henryix.com/contact',
  },
  openGraph: {
    title: 'Book DJ Henry IX | Contact & Inquiries',
    description: 'Book DJ Henry IX for live club events, festivals, private sessions, and corporate bookings. Send inquiries directly through our secure contact portal.',
    url: 'https://henryix.com/contact',
    siteName: 'HENRY IX DJ',
    images: [
      {
        url: 'https://henryix.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HENRY IX Contact & Inquiries Portal',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book DJ Henry IX | Contact & Inquiries',
    description: 'Book DJ Henry IX for live club events, festivals, private sessions, and corporate bookings.',
    images: ['https://henryix.com/og-image.jpg'],
  },
};

export default function Page() {
  return <ContactClient />;
}
