'use client';

import { useEffect, useState } from 'react';

// Single source of truth for the site's PGP public key: the served file at
// /public-key.asc. Both the Contact modal (display) and the Signature modal
// (verification) read it from here, so the key lives in exactly one place.
let cache: string | null = null;

export function usePublicKey(): string | null {
  const [key, setKey] = useState<string | null>(cache);

  useEffect(() => {
    if (cache) {
      setKey(cache);
      return;
    }
    let active = true;
    fetch('/public-key.asc')
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        const trimmed = text?.trim();
        if (active && trimmed && trimmed.includes('BEGIN PGP PUBLIC KEY')) {
          cache = trimmed;
          setKey(trimmed);
        }
      })
      .catch(() => {
        /* key simply stays unavailable; callers handle the null case */
      });
    return () => {
      active = false;
    };
  }, []);

  return key;
}
