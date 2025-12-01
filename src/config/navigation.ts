export interface ServiceLink {
  slug: string;
  title: string;
  short_title: string;
  href: string;
  description?: string;
  image?: string;
  illustration?: string;
}

export const SERVICE_LINKS: ServiceLink[] = [
  {
    slug: 'hair-colouring',
    title: 'Hair Colouring',
    short_title: 'Colouring',
    href: '/services/hair-colouring',
    image: '/background-images/hair-colouring.jpg',
    illustration: '/images/illustrations/hair-colouring.png',
  },
  {
    slug: 'hair-rebonding',
    title: 'Hair Rebonding',
    short_title: 'Rebonding',
    href: '/services/hair-rebonding',
    image: '/background-images/hair-rebonding.jpg',
    illustration: '/images/illustrations/hair-rebonding.png',
  },
  {
    slug: 'scalp-treatment',
    title: 'Scalp Treatment',
    short_title: 'Scalp Treatment',
    href: '/services/scalp-treatment',
    image: '/background-images/scalp-treatment.png',
    illustration: '/images/illustrations/scalp-treatment.png',
  },
  {
    slug: 'keratin-treatment',
    title: 'Keratin Treatment',
    short_title: 'Keratin Treatment',
    href: '/services/keratin-treatment',
    image: '/background-images/keratin-treatment.png',
    illustration: '/images/illustrations/keratin-treatment.png',
  },
  {
    slug: 'hair-perm',
    title: 'Hair Perm',
    short_title: 'Perm',
    href: '/services/hair-perm',
    image: '/background-images/hair-perm.jpg',
    illustration: '/images/illustrations/hair-perm.png',
  },
];
