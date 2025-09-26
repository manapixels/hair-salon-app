import type { Service } from './types';

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
