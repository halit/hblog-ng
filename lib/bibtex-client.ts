import { BibtexEntry } from './bibtex-utils';

export type { BibtexEntry } from './bibtex-utils';
export { formatBibtexEntry, generateBibtexString, getReferenceUrl } from './bibtex-utils';

import referencesData from '@/data/references.json';

let cachedReferences: Map<string, BibtexEntry> | null = null;

/**
 * Load bibtex references from JSON file (client-side)
 * Since references.json is in data/, we import it directly so it's available in the bundle.
 */
export async function loadBibtexReferences(): Promise<Map<string, BibtexEntry>> {
  if (cachedReferences) {
    return cachedReferences;
  }

  const entries = new Map<string, BibtexEntry>();
  Object.entries(referencesData).forEach(([key, value]) => {
    entries.set(key, value as BibtexEntry);
  });

  cachedReferences = entries;
  return entries;
}
