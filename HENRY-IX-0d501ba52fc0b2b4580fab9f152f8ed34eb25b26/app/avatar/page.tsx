import AvatarClient from './avatar-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Avatar Configurations | HENRY IX',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AvatarClient />;
}
