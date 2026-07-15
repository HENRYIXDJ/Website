'use client';

import { Schedule } from '@/components/ContentSections';

export default function EventsClient() {
  return (
    <div className="fixed inset-0 text-white overflow-hidden flex flex-col justify-center">
      <main className="w-full flex flex-col justify-center">
        <Schedule isDepth={true} />
      </main>
    </div>
  );
}
