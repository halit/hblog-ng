import fs from 'fs';
import path from 'path';
import { parseBibtex } from '@/lib/bibtex';
import { BibtexEntry } from '@/lib/bibtex-utils';

import { getVaultPath } from './pipeline/vault-path';

async function main() {
  const vaultPath = getVaultPath();
  const bibtexPath = path.join(vaultPath, 'references.bib');
  const outputPath = path.join(process.cwd(), 'data', 'references.json');

  // data/references.json is statically imported by the app, so it must always
  // exist — even when the vault has no bibliography. Write an empty map in that case.
  const referencesMap: Record<string, BibtexEntry> = {};

  if (fs.existsSync(bibtexPath)) {
    try {
      const content = fs.readFileSync(bibtexPath, 'utf-8');
      const entries = parseBibtex(content);
      entries.forEach((entry) => {
        referencesMap[entry.key] = {
          key: entry.key,
          type: entry.type,
          fields: entry.fields,
        };
      });
      console.log(`✓ Parsed ${entries.length} BibTeX entries`);
    } catch (error) {
      console.error('Error parsing BibTeX:', error);
    }
  } else {
    console.warn(`BibTeX file not found at ${bibtexPath}, writing empty references.`);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(referencesMap, null, 2));
  console.log(`✓ Wrote ${outputPath}`);
}

main().catch(console.error);
