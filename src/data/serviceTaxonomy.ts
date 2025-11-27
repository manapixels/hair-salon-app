/**
 * Service Tag Taxonomy
 * Defines all available tags for service categorization and filtering
 */

export interface TagDefinition {
  slug: string;
  label: string;
  category: 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE';
  description?: string;
  iconName?: string;
  sortOrder: number;
}

/**
 * Hair Concerns - Problems customers want to solve
 */
export const HAIR_CONCERNS: TagDefinition[] = [
  {
    slug: 'frizzy-hair',
    label: 'Frizzy Hair',
    category: 'CONCERN',
    description: 'Tames frizz and flyaways for smoother hair',
    iconName: 'Waves',
    sortOrder: 1,
  },
  {
    slug: 'flat-hair',
    label: 'Flat/Limp Hair',
    category: 'CONCERN',
    description: 'Adds volume and lift to flat hair',
    iconName: 'ChevronDown',
    sortOrder: 2,
  },
  {
    slug: 'damaged-hair',
    label: 'Damaged Hair',
    category: 'CONCERN',
    description: 'Repairs and restores damaged, brittle hair',
    iconName: 'AlertCircle',
    sortOrder: 3,
  },
  {
    slug: 'dry-hair',
    label: 'Dry Hair',
    category: 'CONCERN',
    description: 'Hydrates and moisturizes dry hair',
    iconName: 'Droplets',
    sortOrder: 4,
  },
  {
    slug: 'oily-scalp',
    label: 'Oily Scalp',
    category: 'CONCERN',
    description: 'Balances scalp oil production',
    iconName: 'Droplet',
    sortOrder: 5,
  },
  {
    slug: 'dandruff',
    label: 'Dandruff',
    category: 'CONCERN',
    description: 'Treats and prevents dandruff',
    iconName: 'Snowflake',
    sortOrder: 6,
  },
  {
    slug: 'hair-loss',
    label: 'Hair Loss/Thinning',
    category: 'CONCERN',
    description: 'Promotes hair growth and thickness',
    iconName: 'TrendingDown',
    sortOrder: 7,
  },
  {
    slug: 'split-ends',
    label: 'Split Ends',
    category: 'CONCERN',
    description: 'Repairs split ends and prevents breakage',
    iconName: 'Scissors',
    sortOrder: 8,
  },
  {
    slug: 'unruly-hair',
    label: 'Unruly/Hard to Style',
    category: 'CONCERN',
    description: 'Makes hair more manageable and easier to style',
    iconName: 'Wind',
    sortOrder: 9,
  },
  {
    slug: 'dull-hair',
    label: 'Dull/Lifeless Hair',
    category: 'CONCERN',
    description: 'Restores shine and vitality',
    iconName: 'Moon',
    sortOrder: 10,
  },
  {
    slug: 'naturally-curly',
    label: 'Naturally Curly (want straight)',
    category: 'CONCERN',
    description: 'For those with natural curls wanting straight hair',
    iconName: 'Waves',
    sortOrder: 11,
  },
  {
    slug: 'gray-hair',
    label: 'Gray Hair',
    category: 'CONCERN',
    description: 'Covers gray hair for a youthful look',
    iconName: 'Palette',
    sortOrder: 12,
  },
];

/**
 * Desired Outcomes - What customers want to achieve
 */
export const DESIRED_OUTCOMES: TagDefinition[] = [
  {
    slug: 'add-volume',
    label: 'Add Volume',
    category: 'OUTCOME',
    description: 'Creates lift, body, and fullness',
    iconName: 'TrendingUp',
    sortOrder: 1,
  },
  {
    slug: 'straight-hair',
    label: 'Straight Hair',
    category: 'OUTCOME',
    description: 'Achieve sleek, pin-straight hair',
    iconName: 'Minus',
    sortOrder: 2,
  },
  {
    slug: 'smooth-hair',
    label: 'Smooth & Sleek',
    category: 'OUTCOME',
    description: 'Silky smooth, frizz-free texture',
    iconName: 'Sparkles',
    sortOrder: 3,
  },
  {
    slug: 'curly-hair',
    label: 'Curls/Waves',
    category: 'OUTCOME',
    description: 'Beautiful bouncy curls or waves',
    iconName: 'Waves',
    sortOrder: 4,
  },
  {
    slug: 'healthy-hair',
    label: 'Healthier Hair',
    category: 'OUTCOME',
    description: 'Restore and maintain hair health',
    iconName: 'Heart',
    sortOrder: 5,
  },
  {
    slug: 'shiny-hair',
    label: 'Shine & Gloss',
    category: 'OUTCOME',
    description: 'Glossy, healthy-looking shine',
    iconName: 'Sparkles',
    sortOrder: 6,
  },
  {
    slug: 'manageable-hair',
    label: 'Easy to Style',
    category: 'OUTCOME',
    description: 'Makes hair easier to manage and style daily',
    iconName: 'Check',
    sortOrder: 7,
  },
  {
    slug: 'color-change',
    label: 'Change Hair Color',
    category: 'OUTCOME',
    description: 'Transform your hair color',
    iconName: 'Palette',
    sortOrder: 8,
  },
  {
    slug: 'clean-scalp',
    label: 'Clean, Healthy Scalp',
    category: 'OUTCOME',
    description: 'Deep cleanse and balance scalp',
    iconName: 'Sparkles',
    sortOrder: 9,
  },
  {
    slug: 'long-lasting',
    label: 'Long-Lasting Results',
    category: 'OUTCOME',
    description: 'Results that last for months',
    iconName: 'Calendar',
    sortOrder: 10,
  },
  {
    slug: 'low-maintenance',
    label: 'Low Maintenance',
    category: 'OUTCOME',
    description: 'Minimal daily styling required',
    iconName: 'Check',
    sortOrder: 11,
  },
];

/**
 * Hair Types - Physical characteristics for specialized services
 */
export const HAIR_TYPES: TagDefinition[] = [
  {
    slug: 'fine-hair',
    label: 'Fine Hair',
    category: 'HAIR_TYPE',
    description: 'Best for fine, thin hair strands',
    sortOrder: 1,
  },
  {
    slug: 'thick-hair',
    label: 'Thick Hair',
    category: 'HAIR_TYPE',
    description: 'Ideal for dense, thick hair',
    sortOrder: 2,
  },
  {
    slug: 'curly-hair-type',
    label: 'Curly Hair',
    category: 'HAIR_TYPE',
    description: 'For natural curls or coils',
    sortOrder: 3,
  },
  {
    slug: 'straight-hair-type',
    label: 'Straight Hair',
    category: 'HAIR_TYPE',
    description: 'For naturally straight hair',
    sortOrder: 4,
  },
  {
    slug: 'wavy-hair',
    label: 'Wavy Hair',
    category: 'HAIR_TYPE',
    description: 'For natural waves',
    sortOrder: 5,
  },
  {
    slug: 'asian-hair',
    label: 'Asian Hair',
    category: 'HAIR_TYPE',
    description: 'Formulated for Asian hair textures',
    sortOrder: 6,
  },
  {
    slug: 'caucasian-hair',
    label: 'Caucasian/European Hair',
    category: 'HAIR_TYPE',
    description: 'Specialized for Caucasian hair textures',
    sortOrder: 7,
  },
  {
    slug: 'color-treated',
    label: 'Color-Treated Hair',
    category: 'HAIR_TYPE',
    description: 'Safe for color-treated hair',
    sortOrder: 8,
  },
];

/**
 * Combined taxonomy - all tags
 */
export const ALL_SERVICE_TAGS: TagDefinition[] = [
  ...HAIR_CONCERNS,
  ...DESIRED_OUTCOMES,
  ...HAIR_TYPES,
];

/**
 * Get tags by category
 */
export function getTagsByCategory(category: 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE'): TagDefinition[] {
  return ALL_SERVICE_TAGS.filter(tag => tag.category === category);
}

/**
 * Get tag by slug
 */
export function getTagBySlug(slug: string): TagDefinition | undefined {
  return ALL_SERVICE_TAGS.find(tag => tag.slug === slug);
}
