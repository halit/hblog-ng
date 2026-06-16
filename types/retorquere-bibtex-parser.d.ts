// Ambient declarations for @retorquere/bibtex-parser.
// The published package's `types` entry points at a non-existent path, so it
// resolves to `any` under strict mode. This declares the narrow surface we use
// (the `parse` entry point and the parsed name/entry shapes).
declare module '@retorquere/bibtex-parser' {
  export interface Name {
    firstName?: string;
    lastName?: string;
    prefix?: string;
    suffix?: string;
    /** Corporate/institutional authors ({{...}}) parse to a single literal name. */
    name?: string;
  }

  export interface Entry {
    type: string;
    key: string;
    fields: Record<string, string | string[] | Name[]>;
  }

  export interface Bibliography {
    entries: Entry[];
    errors: unknown[];
  }

  export interface ParseOptions {
    sentenceCase?: boolean;
    [option: string]: unknown;
  }

  export function parse(input: string, options?: ParseOptions): Bibliography;
}
