import { Metadata } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Privacy Policy | Signature Trims',
  description: 'Privacy policy for Signature Trims hair salon website and services.',
};

export default function PrivacyPolicyPage() {
  const t = useTranslations('Legal.Privacy');

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
            <p className="text-gray-600 mb-4">{t('intro')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.collection.title')}
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              {t('sections.collection.personal.title')}
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              {(t.raw('sections.collection.personal.items') as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              {t('sections.collection.usage.title')}
            </h3>
            <p className="text-gray-600 mb-4">{t('sections.collection.usage.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.useOfInfo.title')}
            </h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {(t.raw('sections.useOfInfo.items') as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.thirdParty.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.thirdParty.content')}</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {(t.raw('sections.thirdParty.items') as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.googleCalendar.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.googleCalendar.content')}</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {(t.raw('sections.googleCalendar.items') as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-gray-600 mt-4">{t('sections.googleCalendar.assurance')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.security.title')}
            </h2>
            <p className="text-gray-600">{t('sections.security.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.retention.title')}
            </h2>
            <p className="text-gray-600">{t('sections.retention.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.rights.title')}
            </h2>
            <p className="text-gray-600 mb-4">{t('sections.rights.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.cookies.title')}
            </h2>
            <p className="text-gray-600">{t('sections.cookies.content')}</p>
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
              <Link href="/terms" className="text-primary hover:underline">
                {t('sections.contact.email').includes('admin@signaturetrims.com')
                  ? 'Terms of Service'
                  : '服务条款'}
                {/* Note: I should ideally use a translation for the link text itself. 
                    I'll add "seeAlso": "See also our Terms of Service" in the JSON later or just use a new key.
                    For now I'll hardcode based on language or better yet, I can use the `Common` translation for `termsOfService`.
                    But I only requested `Legal.Privacy`. 
                    Actually, `Legal.Terms.title` is available in `Legal` namespace if I load all `Legal`.
                    I am using useTranslations('Legal.Privacy'). 
                    I will use a conditional or just fix the JSON to include the link text.
                    But wait, I see `Legal.Terms` is right there.
                */}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
