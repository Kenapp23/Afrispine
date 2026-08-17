/**
 * Shared poster/card gradient utilities.
 * Extracted from creator-watch-page.tsx so both the watch page
 * and AfriSpineCard can reuse the same visual language.
 */

export const CATEGORY_SOLID_GRADIENTS: Record<string, string> = {
  music: 'linear-gradient(135deg, #581c87, #3b0764, #1e1b4b)',
  comedy: 'linear-gradient(135deg, #92400e, #78350f, #451a03)',
  film: 'linear-gradient(135deg, #9f1239, #881337, #4c0519)',
  fashion: 'linear-gradient(135deg, #9d174d, #831843, #500724)',
  sports: 'linear-gradient(135deg, #065f46, #064e3b, #022c22)',
  education: 'linear-gradient(135deg, #075985, #0c4a6e, #082f49)',
  spirituality: 'linear-gradient(135deg, #3730a3, #312e81, #1e1b4b)',
  news_culture: 'linear-gradient(135deg, #1e293b, #0f172a, #020617)',
  food: 'linear-gradient(135deg, #9a3412, #7c2d12, #431407)',
  beauty_lifestyle: 'linear-gradient(135deg, #86198f, #701a75, #4a044e)',
};

/**
 * Get a category-specific gradient background.
 * Normalizes the category key for lookup.
 */
export function getCategoryGradient(category?: string): string {
  if (!category) return CATEGORY_SOLID_GRADIENTS.sports;
  const key = category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
  return CATEGORY_SOLID_GRADIENTS[key] ?? CATEGORY_SOLID_GRADIENTS[category.toLowerCase()] ?? CATEGORY_SOLID_GRADIENTS.sports;
}

/**
 * Format a number as compact count (e.g. 1200 → "1.2K", 1500000 → "1.5M").
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

/**
 * Get initials from a name (max 2 chars).
 */
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
