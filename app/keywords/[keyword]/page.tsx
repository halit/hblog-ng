import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllKeywords, getNodesByKeyword } from '@/lib/vault';
import UnifiedCollectionPage from '@/components/UnifiedCollectionPage';

interface KeywordPageProps {
  params: Promise<{ keyword: string }>;
}

export async function generateStaticParams() {
  const allKeywords = getAllKeywords();

  return allKeywords.map((keyword) => {
    // Encode the keyword properly, handling dots and special characters
    const encoded = encodeURIComponent(keyword);
    return { keyword: encoded };
  });
}

export async function generateMetadata({ params }: KeywordPageProps): Promise<Metadata> {
  const { keyword } = await params;
  const decodedKeyword = decodeURIComponent(keyword);

  return {
    title: `#${decodedKeyword}`,
    description: `All content tagged with #${decodedKeyword}`,
  };
}

export default async function KeywordPage({ params }: KeywordPageProps) {
  const { keyword } = await params;
  const decodedKeyword = decodeURIComponent(keyword);
  const matchingContent = getNodesByKeyword(decodedKeyword);

  if (!matchingContent || matchingContent.length === 0) {
    notFound();
  }

  return (
    <UnifiedCollectionPage
      title={decodedKeyword}
      description={`${matchingContent.length} results found across projects, research, and posts.`}
      items={matchingContent}
      type="mixed"
      isKeywordPage={true}
    />
  );
}
