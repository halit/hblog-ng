import { BibtexEntry } from './bibtex-utils';

/**
 * Parse BibTeX content string into a list of entries.
 * Used at build time by scripts/parse-bibtex.ts.
 */
export function parseBibtex(content: string): BibtexEntry[] {
  const entries: BibtexEntry[] = [];

  // Remove comments
  content = content.replace(/%.*$/gm, '');

  // Match BibTeX entries: @type{key, body}
  const entryStartRegex = /@(\w+)\s*\{([^,]+),/g;
  let match;

  while ((match = entryStartRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const startIdx = match.index + match[0].length;

    // Find the closing brace of the entry
    let braceCount = 1;
    let endIdx = startIdx;
    while (braceCount > 0 && endIdx < content.length) {
      if (content[endIdx] === '{') braceCount++;
      else if (content[endIdx] === '}') braceCount--;
      endIdx++;
    }

    const body = content.substring(startIdx, endIdx - 1);

    // Parse fields in the body
    const fields: Record<string, string> = {};

    let pos = 0;
    while (pos < body.length) {
      // Find field name
      const eqIdx = body.indexOf('=', pos);
      if (eqIdx === -1) break;

      const rawFieldName = body.substring(pos, eqIdx).trim();
      // Remove leading comma and whitespace from field name
      const fieldName = rawFieldName.replace(/^[,\s]+/, '').toLowerCase();
      pos = eqIdx + 1;

      // Skip whitespace
      while (pos < body.length && /\s/.test(body[pos])) pos++;

      let fieldValue = '';
      if (pos < body.length) {
        if (body[pos] === '{') {
          // Balanced braces
          let fieldBraceCount = 1;
          const fieldStart = pos + 1;
          pos++;
          while (fieldBraceCount > 0 && pos < body.length) {
            if (body[pos] === '{') fieldBraceCount++;
            else if (body[pos] === '}') fieldBraceCount--;
            if (fieldBraceCount > 0) pos++;
          }
          fieldValue = body.substring(fieldStart, pos);
          pos++; // skip closing brace
        } else if (body[pos] === '"') {
          // Quoted string
          const fieldStart = pos + 1;
          pos++;
          while (pos < body.length && body[pos] !== '"') {
            if (body[pos] === '\\') pos++; // skip escaped char
            pos++;
          }
          fieldValue = body.substring(fieldStart, pos);
          pos++; // skip closing quote
        } else {
          // Unquoted (numeric or simple string)
          const fieldStart = pos;
          while (pos < body.length && body[pos] !== ',' && !/\s/.test(body[pos])) pos++;
          fieldValue = body.substring(fieldStart, pos);
        }
      }

      if (fieldName) {
        fields[fieldName] = fieldValue.trim();
      }

      // Skip until next comma or end of body
      const nextComma = body.indexOf(',', pos);
      if (nextComma !== -1) {
        pos = nextComma + 1;
      } else {
        pos = body.length;
      }
    }

    entries.push({
      key,
      type,
      fields,
    });
  }

  return entries;
}
