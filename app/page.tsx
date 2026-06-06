import { loadVaultData } from '@/lib/vault';
import { getNodeSortDate } from '@/utils';
import { generatePageMetadata, generateSchemaMarkup } from '@/lib/metadata';
import Home from '@/components/pages/Home';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata();

export default function HomePage() {
  const schemaMarkup = generateSchemaMarkup();
  // On the server/SSG, we load the data to extract the latest post.
  // This data is available during build time but not passed to the client as a full vault payload
  // unless we explicitly pass it. We only pass the `latestPost` prop to the Home component.
  const vaultData = loadVaultData();

  if (!vaultData || vaultData.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  const latestPost = [...vaultData]
    .filter((n) => n.type === 'blog')
    .sort((a, b) => getNodeSortDate(b) - getNodeSortDate(a))[0] || vaultData[0];

  if (!latestPost || !latestPost.id) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaMarkup }}
      />
      <Home latestPost={latestPost} />
    </>
  );
}
