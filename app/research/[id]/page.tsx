import { createDetailPage } from '@/lib/page-logic';

const { generateStaticParams, generateMetadata, Page } = createDetailPage({
  type: 'research',
  label: 'Research',
  basePath: '/research/',
});

export { generateStaticParams, generateMetadata };
export default Page;
