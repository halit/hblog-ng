import { createCollectionPage } from '@/lib/page-logic';

const { metadata, Page } = createCollectionPage({
  title: 'Posts',
  description: 'Thoughts, tutorials, and security writeups.',
  url: '/posts/',
  type: 'blog',
});

export { metadata };
export default Page;
