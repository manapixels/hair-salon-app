/**
 * Converts a service name to a translation key slug.
 * Example: "Women's Haircut" -> "womens-haircut"
 */
export function toServiceKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[']/g, '') // Remove apostrophes
    .replace(/[&]/g, '') // Remove ampersands
    .replace(/[(),]/g, '') // Remove parentheses and commas
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
