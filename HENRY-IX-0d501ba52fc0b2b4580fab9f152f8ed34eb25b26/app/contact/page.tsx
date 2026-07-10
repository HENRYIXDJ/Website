'use client';

import PageShell from '@/components/PageShell';
import { ContactForm, SocialLinks } from '@/components/ContentSections';

export default function ContactPage() {
  return (
    <PageShell>
      <ContactForm isDepth={true} />
      <SocialLinks isDepth={true} />
    </PageShell>
  );
}
