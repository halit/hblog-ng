export interface VaultNode {
  id: string;
  title: string;
  type: 'system' | 'blog' | 'profile' | 'project' | 'intel' | 'research';
  created?: string;
  updated: string;
  description?: string; // Preferred field name
  // short_desc removed as it's duplicate of description
  aliases?: string[]; // Aliases for routing
  stack?: string[]; // Legacy field name
  keywords?: string[]; // Preferred field name
  signature?: string;
  content: string;
  icon?: string;
  github?: string;
  published_in?: string; // For research posts (renamed from publication)
  publication?: string; // Deprecated - use published_in (kept for backward compatibility)
  references?: string[]; // Array of reference IDs from global references.bib (replaces bibtex)
  bibtex?: string; // Deprecated - use references array (kept for backward compatibility)
  year?: string;
  url?: string; // URL for research papers
  cover_image?: string;
  link?: string;
  disable_toc?: boolean;
  exclude_from_graph?: boolean;
  related_ids?: string[]; // Injected during build, not stored in vault markdown
  // Project specific
  status?: 'active' | 'archived' | 'concept' | string;
  stars?: number;
  forks?: number;
  // Profile specific
  avatar?: string;
  skills?: { name: string; level: number; type: 'offense' | 'defense' }[];
  languages?: { name: string; level: number }[];
  // Timeline for responsible disclosure
  timeline?: Array<{
    date: string;
    title: string;
    description?: string;
    icon?: string;
  }>;
  // Manual spectrum override
  offensive?: number;
  defensive?: number;
  misc?: number;
}
