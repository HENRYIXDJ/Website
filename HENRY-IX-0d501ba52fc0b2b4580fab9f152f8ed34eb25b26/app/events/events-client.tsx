'use client';

import { GigSchedule } from '@/components/GigSchedule';
import PageShell from '@/components/PageShell';

export default function EventsClient() {
  return (
    <PageShell>
      <main className="w-full min-h-screen pt-20 pb-16 flex flex-col justify-start overflow-y-auto custom-scrollbar">
        <GigSchedule isDepth={true} />
      </main>
    </PageShell>
  );
}
