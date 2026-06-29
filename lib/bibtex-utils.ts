export interface BibtexEntry {
  key: string;
  type: string;
  fields: Record<string, string>;
}

/**
 * Format BibTeX entry for display
 */
export function formatBibtexEntry(entry: BibtexEntry): string {
  const { type, fields } = entry;

  // Format based on entry type
  let formatted = '';

  if (type === 'article') {
    formatted = formatArticle(fields);
  } else if (type === 'inproceedings' || type === 'conference') {
    formatted = formatInProceedings(fields);
  } else if (type === 'techreport') {
    formatted = formatTechReport(fields);
  } else if (type === 'misc') {
    formatted = formatMisc(fields);
  } else {
    // Generic format
    formatted = formatGeneric(fields);
  }

  return formatted;
}

/**
 * Resolve a clickable URL for a reference. Falls back across the common BibTeX
 * places a link can hide: an explicit `url`, the `howpublished` field (often a
 * `\url{...}` that parse-bibtex has already turned into an `<a href="...">`),
 * or a `doi` (rendered through doi.org).
 */
export function getReferenceUrl(entry: BibtexEntry): string {
  const { fields } = entry;

  if (fields.url) return fields.url;

  if (fields.howpublished) {
    const href = /href=["']([^"']+)["']/.exec(fields.howpublished);
    if (href) return href[1];
    const bare = /https?:\/\/\S+/.exec(fields.howpublished);
    if (bare) return bare[0];
  }

  if (fields.doi) {
    const doi = fields.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    return `https://doi.org/${doi}`;
  }

  return '';
}

/**
 * Generate raw BibTeX string from entry
 */
export function generateBibtexString(entry: BibtexEntry): string {
  const { type, key, fields } = entry;
  let bibtex = `@${type}{${key},\n`;

  const maxKeyLength = Math.max(...Object.keys(fields).map((k) => k.length));

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (fieldValue) {
      bibtex += `  ${fieldName.padEnd(maxKeyLength)} = {${fieldValue}},\n`;
    }
  }

  bibtex += '}';

  return bibtex;
}

function formatArticle(fields: Record<string, string>): string {
  const parts: string[] = [];

  if (fields.title) parts.push(`"${fields.title}"`);
  if (fields.author) parts.push(fields.author);

  let publication = '';
  if (fields.journal) publication += `In ${fields.journal}`;
  if (fields.volume) publication += `, vol. ${fields.volume}`;
  if (fields.pages) publication += `, pp. ${fields.pages}`;
  if (fields.year) publication += `, ${fields.year}`;

  if (publication) parts.push(publication);

  return joinSegments(parts);
}

function formatInProceedings(fields: Record<string, string>): string {
  const parts: string[] = [];

  if (fields.title) parts.push(`"${fields.title}"`);
  if (fields.author) parts.push(fields.author);

  let publication = '';
  if (fields.booktitle) publication += `In ${fields.booktitle}`;
  if (fields.year) publication += `, ${fields.year}`;

  if (publication) parts.push(publication);

  return joinSegments(parts);
}

function formatTechReport(fields: Record<string, string>): string {
  const parts: string[] = [];

  if (fields.title) parts.push(`"${fields.title}"`);
  if (fields.author) parts.push(fields.author);

  let info = fields.institution || '';
  if (fields.number) info += info ? `, Tech. Rep. ${fields.number}` : `Tech. Rep. ${fields.number}`;
  if (fields.year) info += info ? `, ${fields.year}` : fields.year;

  if (info) parts.push(info);

  return joinSegments(parts);
}

function formatMisc(fields: Record<string, string>): string {
  const parts: string[] = [];

  if (fields.title) parts.push(`"${fields.title}"`);
  if (fields.author) parts.push(fields.author);

  let info = fields.organization || '';
  if (fields.year) info += info ? `, ${fields.year}` : fields.year;

  if (info) parts.push(info);
  if (fields.note) parts.push(fields.note);

  return joinSegments(parts);
}

function formatGeneric(fields: Record<string, string>): string {
  const parts: string[] = [];

  if (fields.title) parts.push(`"${fields.title}"`);
  if (fields.author) parts.push(fields.author);
  if (fields.year) parts.push(fields.year);

  return joinSegments(parts);
}

/**
 * Helper to join citation segments with proper punctuation
 */
function joinSegments(segments: string[]): string {
  const filtered = segments.filter((s) => s && s.trim());
  if (filtered.length === 0) return '';

  let result = filtered[0];
  for (let i = 1; i < filtered.length; i++) {
    const next = filtered[i];
    const trimmedResult = result.trim();
    // If previous segment already ends with dot, just add space
    if (trimmedResult.endsWith('.')) {
      result = trimmedResult + ' ' + next;
    } else {
      result = trimmedResult + '. ' + next;
    }
  }

  // Ensure citation ends with a period
  if (!result.trim().endsWith('.')) result += '.';
  return result;
}
