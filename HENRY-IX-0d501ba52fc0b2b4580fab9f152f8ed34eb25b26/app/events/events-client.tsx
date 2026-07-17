'use client';

import { GigSchedule } from '@/components/GigSchedule';
import PageShell from '@/components/PageShell';

interface EventsClientProps {
  initialEvents: any[] | null;
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
  return (
    <PageShell>
      <main className="w-full min-h-[100dvh] pt-20 pb-16 flex flex-col justify-start overflow-y-auto custom-scrollbar">
        <GigSchedule isDepth={true} initialEvents={initialEvents} />
      </main>
    </PageShell>
  );
}
