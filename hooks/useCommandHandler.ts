import { useEffect, useRef } from 'react';

export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut: string;
  handler: () => void;
  category?: string;
}

interface UseCommandHandlerOptions {
  commands: Command[];
  enabled?: boolean;
}

export function useCommandHandler({ commands, enabled = true }: UseCommandHandlerOptions) {
  // Keep the latest commands/enabled in refs so the listener can read them
  // without being re-created. `commands` is a fresh array on every render of
  // the caller (e.g. AppLayout re-renders ~8x/sec from the network-stats
  // ticker), so binding the listener to those values would detach and
  // re-attach it constantly. Attaching once and reading through refs keeps a
  // single, stable listener alive.
  const commandsRef = useRef(commands);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    commandsRef.current = commands;
    enabledRef.current = enabled;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;

      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Find matching command
      const matchingCommand = commandsRef.current.find((cmd) => {
        const parts = cmd.shortcut
          .toLowerCase()
          .split('+')
          .map((s) => s.trim());
        const ctrl = parts.includes('ctrl') || parts.includes('cmd');
        const alt = parts.includes('alt');
        const shift = parts.includes('shift');
        const key = parts[parts.length - 1];

        const ctrlMatch = (e.ctrlKey || e.metaKey) === ctrl;
        const altMatch = e.altKey === alt;
        const shiftMatch = e.shiftKey === shift;

        // Handle special keys
        let keyMatch = false;
        if (key === 'left' || key === 'right' || key === 'up' || key === 'down') {
          keyMatch = e.key.toLowerCase() === `arrow${key}`;
        } else {
          keyMatch = e.key.toLowerCase() === key;
        }

        return ctrlMatch && altMatch && shiftMatch && keyMatch;
      });

      if (matchingCommand) {
        e.preventDefault();
        matchingCommand.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
