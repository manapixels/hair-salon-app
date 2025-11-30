export interface ServiceLink {
  title: string;
  href: string;
  description?: string;
  image?: string;
}

export const SERVICE_LINKS: ServiceLink[] = [
  {
    title: 'Hair Colouring',
    href: '/services/hair-colouring',
    image: '/background-images/hair-colouring.jpg',
  },
  {
    title: 'Hair Rebonding',
    href: '/services/hair-rebonding',
    image: '/background-images/hair-rebonding.jpg',
  },
  {
    title: 'Scalp Treatment',
    href: '/services/scalp-treatment',
    image: '/background-images/scalp-treatment.png',
  },
  {
    title: 'Keratin Treatment',
    href: '/services/keratin-treatment',
    image: '/background-images/keratin-treatment.png',
  },
  {
    title: 'Hair Perm',
    href: '/services/hair-perm',
    image: '/background-images/hair-perm.jpg',
  },
];
