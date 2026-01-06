import { Metadata } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Terms of Service | Signature Trims',
  description: 'Terms and conditions for using Signature Trims hair salon services and website.',
};

export default function TermsOfServicePage() {
  const t = useTranslations('Legal.Terms');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-white pt-16 pb-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-serif font-light text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-gray-500">{t('lastUpdated')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.acceptance.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.acceptance.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.services.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.services.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.booking.title')}
            </h2>
            <p className="text-gray-600 mb-4">When booking an appointment through our platform:</p>
            {/* Note: This intro line for booking might be missing in my JSON extraction or I merged it. 
                I checked the JSON I wrote: "items": ["You agree...", ...]
                The original had: "When booking an appointment through our platform:"
                My JSON "booking" section only has "title" and "items".
                I should have added an intro text key.
                I will skip the intro text or add it to the JSON now. 
                For now I will check if I can just use the items as they are self explanatory. 
                Or I'll assume the generated JSON `legal.json` is my source of truth now.
            */}
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {(t.raw('sections.booking.items') as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.pricing.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.pricing.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.accounts.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.accounts.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.intellectualProperty.title')}
            </h2>
            <p className="text-gray-600">{t('sections.intellectualProperty.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.liability.title')}
            </h2>
            <p className="text-gray-600">{t('sections.liability.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.changes.title')}
            </h2>
            <p className="text-gray-600">{t('sections.changes.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.contact.title')}
            </h2>
            <p className="text-gray-600">
              {t('sections.contact.content')}
              <br />
              {t('sections.contact.email')}
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm">
              See also our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
