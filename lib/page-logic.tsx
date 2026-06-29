import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VaultNode } from '@/types/vault';
import { loadVaultData, getRelatedNodes, getNodesByType } from '@/lib/vault';
import {
  generatePageMetadata,
  generateSchemaMarkup,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from '@/lib/metadata';
import { extractSlugFromId, findNodeBySlugOrId } from '@/lib/routing';
import CollectionView from '@/components/CollectionPage';
import DetailWrapper from '@/components/DetailWrapper';

export async function getStaticParamsForType(type: VaultNode['type']) {
  const nodes = getNodesByType(type, false);

  const params: { id: string }[] = [];

  for (const node of nodes) {
    params.push({ id: extractSlugFromId(node.id) });

    if (node.aliases) {
      for (const alias of node.aliases) {
        params.push({ id: alias });
      }
    }
  }

  return params;
}

export async function getMetadataForPage(id: string, type: VaultNode['type']) {
  const vaultData = loadVaultData();
  const activeNode = findNodeBySlugOrId(vaultData, id, type);
  return generatePageMetadata(activeNode);
}

export async function getPageData(id: string, type: VaultNode['type']) {
  const vaultData = loadVaultData();
  const activeNode = findNodeBySlugOrId(vaultData, id, type);

  if (!activeNode) {
    return null;
  }

  const relatedNodes = getRelatedNodes(activeNode);
  const schemaMarkup = generateSchemaMarkup(activeNode);

  return { activeNode, relatedNodes, schemaMarkup };
}

interface CollectionConfig {
  title: string;
  description: string;
  url: string; // e.g. '/posts/'
  type: 'blog' | 'project' | 'research';
}

/**
 * Builds the metadata + page component for a content collection (posts,
 * projects, research). Each route just spreads the result.
 */
export function createCollectionPage(cfg: CollectionConfig) {
  const metadata: Metadata = generatePageMetadata(undefined, {
    title: cfg.title,
    description: cfg.description,
    url: cfg.url,
  });

  function CollectionPage() {
    const items = getNodesByType(cfg.type);
    const schemaMarkup = generateCollectionSchema(cfg.title, cfg.description, cfg.url, items);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaMarkup }} />
        <CollectionView
          title={cfg.title}
          description={cfg.description}
          items={items}
          type={cfg.type}
        />
      </>
    );
  }

  return { metadata, Page: CollectionPage };
}

interface DetailConfig {
  type: VaultNode['type'];
  label: string; // breadcrumb label, e.g. 'Posts'
  basePath: string; // e.g. '/posts/'
}

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Builds generateStaticParams / generateMetadata / page component for a content
 * detail route. Each route just spreads the result.
 */
export function createDetailPage(cfg: DetailConfig) {
  async function generateStaticParams() {
    return getStaticParamsForType(cfg.type);
  }

  async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
    const { id } = await params;
    return getMetadataForPage(id, cfg.type);
  }

  async function DetailPage({ params }: DetailPageProps) {
    const { id } = await params;
    const data = await getPageData(id, cfg.type);

    if (!data) {
      notFound();
    }

    const { activeNode, relatedNodes, schemaMarkup } = data;

    const breadcrumbMarkup = generateBreadcrumbSchema([
      { name: 'Home', item: '/' },
      { name: cfg.label, item: cfg.basePath },
      { name: activeNode.title, item: `${cfg.basePath}${id}/` },
    ]);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaMarkup }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbMarkup }} />
        <DetailWrapper activeNode={activeNode} connectedNodes={relatedNodes} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, Page: DetailPage };
}
