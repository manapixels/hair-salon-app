import { redirect } from 'next/navigation';

/**
 * /services redirects to /#services anchor on homepage
 */
export default function ServicesPage() {
  redirect('/#services');
}
