import { createCollectionPage } from '@/lib/page-logic';

const { metadata, Page } = createCollectionPage({
  title: 'Research',
  description: 'Publications, whitepapers, and technical research.',
  url: '/research/',
  type: 'research',
});

export { metadata };
export default Page;
