import { parse, type Name } from '@retorquere/bibtex-parser';
import { BibtexEntry } from './bibtex-utils';

/** Render a parsed name object back into "Last, First" form. */
function nameToString(name: Name): string {
  // Corporate/institutional authors ({{...}}) parse to a single `name` literal.
  if (name.name) return name.name;
  const last = [name.lastName, name.suffix].filter(Boolean).join(', ');
  const first = [name.firstName, name.prefix].filter(Boolean).join(' ');
  return first ? `${last}, ${first}` : last;
}

/** Flatten a parsed field value into the plain string our display layer expects. */
function fieldToString(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : nameToString(item as Name)))
      .join(' and ');
  }
  return String(value);
}

/**
 * Parse BibTeX content into a list of entries.
 * Used at build time by scripts/parse-bibtex.ts. Delegates the actual parsing to
 * @retorquere/bibtex-parser (the Better BibTeX engine) rather than hand-rolling a
 * brace-balancing tokenizer. `sentenceCase: false` keeps the authored title casing.
 */
export function parseBibtex(content: string): BibtexEntry[] {
  const { entries } = parse(content, { sentenceCase: false });

  return entries.map((entry) => {
    const fields: Record<string, string> = {};
    for (const [name, value] of Object.entries(entry.fields)) {
      fields[name.toLowerCase()] = fieldToString(value);
    }

    return {
      key: entry.key,
      type: entry.type.toLowerCase(),
      fields,
    };
  });
}
