'use client';

import { useCallback, useState } from 'react';

/**
 * Copy-to-clipboard with a transient "copied" flag that auto-resets.
 *
 * Replaces the `useState(false)` + `navigator.clipboard.writeText` + `setTimeout`
 * reset pattern that was duplicated across every modal, code block, and terminal
 * component. Call once per independent copy target (e.g. email and key buttons
 * each get their own hook instance).
 */
export function useCopyToClipboard(resetMs = 2000): {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
} {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch (err) {
        console.error('Failed to copy:', err);
        return false;
      }
    },
    [resetMs],
  );

  const reset = useCallback(() => setCopied(false), []);

  return { copied, copy, reset };
}
