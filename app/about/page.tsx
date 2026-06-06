import { loadVaultData } from '@/lib/vault';
import { generatePageMetadata, generateSchemaMarkup } from '@/lib/metadata';
import About from '@/components/pages/About';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const vaultData = loadVaultData();
  const aboutNode = vaultData.find((n) => n.type === 'profile' || n.id === 'about');
  return generatePageMetadata(aboutNode, { title: 'About' });
}

export default function AboutPage() {
  const vaultData = loadVaultData();
  const aboutNode = vaultData.find((n) => n.type === 'profile' || n.id === 'about') || vaultData[0];

  if (!aboutNode) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  const schemaMarkup = generateSchemaMarkup(aboutNode);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaMarkup }}
      />
      <About activeNode={aboutNode} />
    </>
  );
}
