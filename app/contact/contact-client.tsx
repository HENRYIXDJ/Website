'use client';

import PageShell from '@/components/PageShell';
import { ContactForm } from '@/components/ContentSections';

export default function ContactClient() {
  return (
    <PageShell>
      <ContactForm isDepth={true} />
    </PageShell>
  );
}
