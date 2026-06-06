import type { Command } from '@/hooks/useCommandHandler';

export interface CommandHandlers {
  openSearch: () => void;
  openNeuralLink: () => void;
  openContact: () => void;
  openCommandPalette: () => void;
  goBack: () => void;
  goForward: () => void;
}

/**
 * Builds the full command list by combining static metadata with runtime
 * handlers. Keeping metadata here means the shortcut table, names, and
 * categories are visible without loading AppLayout.
 */
export function buildCommands(handlers: CommandHandlers): Command[] {
  return [
    {
      id: 'search',
      name: 'Search',
      description: 'Search through vault content',
      shortcut: 'Ctrl+F',
      category: 'Navigation',
      handler: handlers.openSearch,
    },
    {
      id: 'neural_link',
      name: 'Neural Link',
      description: 'Open knowledge graph visualization',
      shortcut: 'Ctrl+G',
      category: 'Navigation',
      handler: handlers.openNeuralLink,
    },
    {
      id: 'contact',
      name: 'Contact',
      description: 'Open contact form',
      shortcut: 'Ctrl+M',
      category: 'Navigation',
      handler: handlers.openContact,
    },
    {
      id: 'back',
      name: 'Go Back',
      description: 'Navigate to previous page',
      shortcut: 'Alt+Left',
      category: 'Navigation',
      handler: handlers.goBack,
    },
    {
      id: 'forward',
      name: 'Go Forward',
      description: 'Navigate to next page',
      shortcut: 'Alt+Right',
      category: 'Navigation',
      handler: handlers.goForward,
    },
    {
      id: 'commands',
      name: 'Show Commands',
      description: 'Show all available commands',
      shortcut: 'Ctrl+K',
      category: 'General',
      handler: handlers.openCommandPalette,
    },
  ];
}
