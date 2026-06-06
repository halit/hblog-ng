import BugBounty from '@/components/pages/BugBounty';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bug Bounty',
  description: 'Bug bounty program and responsible disclosure policy.',
};

export default function BugBountyPage() {
  return <BugBounty />;
}
