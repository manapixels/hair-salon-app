import { getServiceCategories } from '@/lib/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookCategoryButton } from '@/components/prices/BookCategoryButton';

export default async function PricesPage() {
  const categories = await getServiceCategories();

  // Sort categories by sortOrder
  const sortedCategories = categories
    .filter(cat => cat.items && cat.items.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-accent/5 to-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-4">
            Our Services & Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transparent pricing for all our hair services. View our complete menu of professional
            treatments, from cuts and styling to colour and specialty services.
          </p>
        </div>
      </div>

      {/* Category Tables */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {sortedCategories.map((category, index) => (
          <section key={category.id} className={`${index !== 0 ? 'mt-20' : ''}`}>
            {/* Category Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-serif font-light text-gray-900 mb-2">
                  {category.title}
                </h2>
                {category.description && (
                  <p className="text-gray-600 text-base">{category.description}</p>
                )}
                {category.priceRangeMin && category.priceRangeMax && (
                  <p className="text-sm text-gray-500 mt-1">
                    Price range: ${category.priceRangeMin} - ${category.priceRangeMax}
                  </p>
                )}
              </div>
              <BookCategoryButton
                categorySlug={category.slug}
                className="shrink-0"
                label={`Book ${category.shortTitle || category.title}`}
              />
            </div>

            {/* Services Table */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 w-[30%]">Service</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-[40%]">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right w-[15%]">
                      Price
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.items
                    .filter(service => service.isActive)
                    .map(service => (
                      <>
                        {/* Main Service Row */}
                        <TableRow key={service.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {service.subtitle || service.description || '—'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {service.price}
                          </TableCell>
                        </TableRow>

                        {/* Add-on Rows */}
                        {service.addons &&
                          service.addons.length > 0 &&
                          service.addons.map(addon => (
                            <TableRow
                              key={addon.id}
                              className="bg-muted/30 hover:bg-muted/40 border-l-2 border-l-accent/30"
                            >
                              <TableCell className="pl-8 text-sm text-gray-700">
                                <span className="text-accent mr-1">+</span>
                                {addon.name}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {addon.description || '—'}
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-700">
                                {addon.price}
                              </TableCell>
                            </TableRow>
                          ))}
                      </>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Category Note if available */}
            {category.priceNote && (
              <p className="text-sm text-gray-500 italic mt-2 ml-2">*{category.priceNote}</p>
            )}
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="bg-accent/5 py-12 px-4 mt-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-serif font-light text-gray-900 mb-3">
            Ready to Book Your Appointment?
          </h3>
          <p className="text-gray-600 mb-6">
            Choose your desired service and book online in just a few clicks.
          </p>
          <BookCategoryButton className="px-8" label="Book Appointment" />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Service Pricing | Signature Trims Hair Salon',
    description:
      'View our complete price list for all hair services including colouring, perms, treatments, rebonding, keratin, scalp treatments, and more. Transparent pricing, no hidden fees.',
  };
}
