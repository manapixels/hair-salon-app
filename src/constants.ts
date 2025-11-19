import type { Service } from './types';

export interface ServiceItem {
  name: string;
  price: string;
  description?: string;
  addons?: { name: string; price: string }[];
}

export interface ServiceCategory {
  id: string;
  title: string;
  items: ServiceItem[];
}

export const SALON_SERVICES: Service[] = [
  {
    id: 1,
    name: "Men's Haircut",
    description: 'Classic cut and style for men.',
    price: 30,
    duration: 30,
  },
  {
    id: 2,
    name: "Women's Haircut",
    description: 'Shampoo, cut, and blow-dry.',
    price: 60,
    duration: 60,
  },
  {
    id: 3,
    name: 'Single Process Color',
    description: 'Root touch-up or all-over color.',
    price: 80,
    duration: 90,
  },
  {
    id: 4,
    name: 'Partial Highlights',
    description: 'Highlights on the top half of the head.',
    price: 120,
    duration: 120,
  },
  {
    id: 5,
    name: 'Full Highlights',
    description: 'Highlights throughout the entire head.',
    price: 180,
    duration: 180,
  },
  {
    id: 6,
    name: 'Balayage',
    description: 'Hand-painted highlights for a natural look.',
    price: 250,
    duration: 210,
  },
  {
    id: 7,
    name: 'Keratin Treatment',
    description: 'Smooth and straighten frizzy hair.',
    price: 300,
    duration: 180,
  },
];

export const SALON_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cut',
    title: 'Cut',
    items: [
      {
        name: 'Women',
        price: '$40',
        description: '$45 if wash and blow is included',
      },
      {
        name: 'Men',
        price: '$30',
        description: '$35 if wash and blow is included',
      },
      {
        name: 'Kid (below 12 y/o, boy)',
        price: '$20',
        description: '$23 if wash and blow is included',
      },
      {
        name: 'Kid (below 12 y/o, girl)',
        price: '$25',
        description: '$28 if wash and blow is included',
      },
      {
        name: 'Ironing Add-on',
        price: '+$10',
      },
      {
        name: 'Fringe Cut',
        price: '$10',
      },
      {
        name: 'Styling',
        price: '$50+',
      },
    ],
  },
  {
    id: 'color',
    title: 'Color',
    items: [
      {
        name: 'Roots Retouch (Less Ammonia - Japan)',
        price: '$70-105',
        addons: [
          {
            name: 'Inoa Ammonia Free (Hydration & Nourishment)',
            price: '+$15',
          },
        ],
      },
      {
        name: 'Full Head (Less Ammonia - Japan) - Men',
        price: '$80',
      },
      {
        name: 'Full Head (Less Ammonia - Japan) - Women',
        price: '$95-150',
      },
      {
        name: 'Highlight',
        price: '$115-190+',
      },
      {
        name: 'Caucasian Highlight',
        price: '$135-200+',
      },
      {
        name: 'Bleaching',
        price: '$85-180+',
      },
    ],
  },
  {
    id: 'perm',
    title: 'Perm',
    items: [
      {
        name: 'Regular Perm (Korean Lotion)',
        price: '$150-180+',
      },
      {
        name: 'Digital Perm',
        price: '$200-300+',
      },
      {
        name: 'Rebonding',
        price: '$200-300+',
        addons: [
          {
            name: 'Shiseido or Mucota Upgrade',
            price: '+$50',
          },
        ],
      },
      {
        name: 'Roots Rebond',
        price: '$150-230+',
      },
      {
        name: 'Iron Roots Perm',
        price: '$150-180+',
      },
      {
        name: 'Fringe Perm / Rebond / Down Perm',
        price: '$70+',
      },
    ],
  },
  {
    id: 'treatment',
    title: 'Hair Scale Treatment',
    items: [
      {
        name: 'Scale Treatment (Normal)',
        price: '$55',
      },
      {
        name: 'Peeling / Hair Loss / Oily or Dandruff (Paris)',
        price: '$95',
        addons: [
          {
            name: 'With Ampoule',
            price: '$120',
          },
        ],
      },
      {
        name: 'Hair Treatment (Normal)',
        price: '$35-55',
      },
      {
        name: 'Shiseido Treatment (Japan)',
        price: '$105-180+',
      },
      {
        name: 'Mucota Treatment (Japan)',
        price: '$150-230+',
      },
      {
        name: 'K-Gloss Keratin (USA)',
        price: '$220-300+',
      },
      {
        name: 'Tiboli Keratin (USA)',
        price: '$280-350+',
      },
    ],
  },
];
