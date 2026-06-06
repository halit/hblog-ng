import { createCollectionPage } from '@/lib/page-logic';

const { metadata, Page } = createCollectionPage({
  title: 'Projects',
  description: 'A collection of security tools, libraries, and experiments.',
  url: '/projects/',
  type: 'project',
});

export { metadata };
export default Page;
