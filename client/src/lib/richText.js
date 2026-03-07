export function isRichTextEmpty(value) {
  if (!value || typeof value !== 'string') return true;
  if (/<img\b/i.test(value)) return false;

  const stripped = value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.length === 0;
}

export function normalizeRichText(value) {
  if (typeof value !== 'string') return '';
  return isRichTextEmpty(value) ? '' : value;
}
