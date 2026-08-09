'use client';

import dynamic from 'next/dynamic';

const StudioComponent = dynamic(
  async () => {
    const { NextStudio } = await import('next-sanity/studio');
    const config = (await import('@/sanity.config')).default;
    return function StudioComponent() {
      return <NextStudio config={config} />;
    };
  },
  { ssr: false }
);

export default function StudioPage() {
  return <StudioComponent />;
}
