/**
 * Lightweight HTML helpers for titles / excerpts.
 * Full post HTML is rendered with react-native-render-html on the detail screen.
 */

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
  '&#8217;': "'",
  '&#8216;': "'",
  '&#8220;': '"',
  '&#8221;': '"',
  '&#8211;': '–',
  '&#8212;': '—',
  '&nbsp;': ' ',
  '&hellip;': '…',
  '&#8230;': '…',
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&rdquo;': '"',
  '&ldquo;': '"',
  '&mdash;': '—',
  '&ndash;': '–',
};

/** Decode common HTML entities */
export function decodeHtml(input: string): string {
  if (!input) return '';
  let out = input;
  // Numeric entities
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
    String.fromCharCode(parseInt(n, 16))
  );
  // Named entities
  Object.keys(ENTITY_MAP).forEach((k) => {
    out = out.split(k).join(ENTITY_MAP[k]);
  });
  return out;
}

/** Strip tags and decode entities — for card excerpts */
export function stripHtml(html: string): string {
  if (!html) return '';
  const noTags = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return decodeHtml(noTags);
}

/** Truncate cleanly at word boundary */
export function truncate(text: string, max = 120): string {
  if (!text || text.length <= max) return text || '';
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim() + '…';
}
