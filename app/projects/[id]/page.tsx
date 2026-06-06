import { createDetailPage } from '@/lib/page-logic';

const { generateStaticParams, generateMetadata, Page } = createDetailPage({
  type: 'project',
  label: 'Projects',
  basePath: '/projects/',
});

export { generateStaticParams, generateMetadata };
export default Page;
