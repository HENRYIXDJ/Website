/**
 * icsGenerator.ts - Standard iCalendar (.ics) Event Generator
 */

export interface EventICalData {
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYYMMDDTHHMMSSZ
  endDate: string;   // YYYYMMDDTHHMMSSZ
  url?: string;
}

export function downloadICalFile(event: EventICalData) {
  const sanitize = (str: string) => str.replace(/\n/g, '\\n').replace(/,/g, '\\,');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HENRY IX DJ//Tour Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${sanitize(event.title)}`,
    `DESCRIPTION:${sanitize(event.description)}`,
    `LOCATION:${sanitize(event.location)}`,
    `DTSTART:${event.startDate.replace(/[-:]/g, '')}`,
    `DTEND:${event.endDate.replace(/[-:]/g, '')}`,
    `URL:${event.url || 'https://henryix.com'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
