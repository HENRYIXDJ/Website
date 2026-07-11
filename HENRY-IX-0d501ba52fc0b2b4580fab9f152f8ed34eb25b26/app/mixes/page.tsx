'use client';

import MixPortfolio from '@/components/MixPortfolio';

export default function MixesPage() {
  return (
    <div className="h-screen flex flex-col bg-black text-white pt-16">
      <MixPortfolio isDepth={true} />
    </div>
  );
}
