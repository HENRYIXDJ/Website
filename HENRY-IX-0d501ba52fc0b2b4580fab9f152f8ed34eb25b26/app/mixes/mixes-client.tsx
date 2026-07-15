'use client';

import MixPortfolio from '@/components/MixPortfolio';

export default function MixesClient() {
  return (
    <div className="h-screen flex flex-col text-white pt-16">
      <MixPortfolio isDepth={true} />
    </div>
  );
}
