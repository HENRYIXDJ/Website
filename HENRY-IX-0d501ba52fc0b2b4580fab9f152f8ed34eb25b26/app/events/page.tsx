'use client';

import { Schedule } from '@/components/ContentSections';

export default function EventsPage() {
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col justify-center">
      <main className="w-full flex flex-col justify-center">
        <Schedule isDepth={true} />
      </main>
    </div>
  );
}
