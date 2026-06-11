import { createCollectionPage } from '@/lib/page-logic';

const { metadata, Page } = createCollectionPage({
  title: 'Projects',
  description: 'A collection of tools, libraries, and experiments.',
  url: '/projects/',
  type: 'project',
});

export { metadata };
export default Page;
