'use client';

import MixPortfolio from '@/components/MixPortfolio';
import { useAudioStore } from '@/store/audioStore';
import { cn } from '@/lib/utils';

export default function MixesClient() {
  const isCDJView = useAudioStore(s => s.isCDJView);
  return (
    <div className={cn(
      "h-[100dvh] flex flex-col text-white transition-all duration-300",
      isCDJView ? "pt-0" : "pt-12 md:pt-16"
    )}>
      <MixPortfolio isDepth={true} />
    </div>
  );
}
