import { createDetailPage } from '@/lib/page-logic';

const { generateStaticParams, generateMetadata, Page } = createDetailPage({
  type: 'blog',
  label: 'Posts',
  basePath: '/posts/',
});

export { generateStaticParams, generateMetadata };
export default Page;
