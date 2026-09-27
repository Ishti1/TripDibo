/*
  Utility to convert ISO 3166‑1 alpha‑2 country codes to their flag emoji.
  The flag is constructed by offsetting each letter to the Regional Indicator Symbols:
  'A' -> 0x1F1E6, 'B' -> 0x1F1E7, ...
  This works for all standard country codes and provides a compact way to display
  flags without hard‑coding each emoji.
*/
export const countryCodeToFlag = (code: string): string => {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const offset = 0x1f1e6 - 65; // 'A' charCode is 65
  const chars = [...upper]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
  return chars;
};
