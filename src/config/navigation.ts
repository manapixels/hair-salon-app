export interface ServiceLink {
  title: string;
  href: string;
  description?: string;
}

export const SERVICE_LINKS: ServiceLink[] = [
  {
    title: 'Colouring',
    href: '/services/hair-colouring',
  },
  {
    title: 'Rebonding',
    href: '/services/hair-rebonding',
  },
  {
    title: 'Scalp Treatment',
    href: '/services/scalp-treatment',
  },
  {
    title: 'Keratin Treatment',
    href: '/services/keratin-treatment',
  },
  {
    title: 'Perm',
    href: '/services/hair-perm',
  },
];
