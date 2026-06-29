import prettyBytes from 'pretty-bytes';

export interface SpectrumDistribution {
  offensive: number; // 0-10
  defensive: number; // 0-10
  misc: number; // 0-10
}

export interface SpectrumOverrides {
  offensive?: number;
  defensive?: number;
  misc?: number;
}

export const calculateSpectrum = (
  content: string,
  overrides?: SpectrumOverrides,
): SpectrumDistribution => {
  // If no overrides provided at all, default to misc: 10
  if (
    !overrides ||
    (overrides.offensive === undefined &&
      overrides.defensive === undefined &&
      overrides.misc === undefined)
  ) {
    return { offensive: 0, defensive: 0, misc: 10 };
  }

  const offensive = overrides.offensive ?? 0;
  const defensive = overrides.defensive ?? 0;

  // If misc is explicitly provided, use it.
  // Otherwise calculate remainder from 10.
  let misc = overrides.misc;

  if (misc === undefined) {
    misc = Math.max(0, 10 - offensive - defensive);
  }

  return {
    offensive,
    defensive,
    misc,
  };
};

export const calculateReadingTime = (text: string): string => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} MIN`;
};

/**
 * Formats a byte count into a human-readable string (e.g., 1.2 kB, 4.5 MB).
 */
export const formatBytes = (bytes: number): string => {
  if (!bytes || Number.isNaN(bytes)) return '0 B';
  // Cap the fraction at 2 digits so the readout stays "5.1" / "5.24", never "5.123456".
  return prettyBytes(bytes, { maximumFractionDigits: 2 });
};
