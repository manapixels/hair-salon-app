import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Signature Trims',
  description: 'Terms and conditions for using Signature Trims hair salon services and website.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-white py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-serif font-light text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500">Last updated: December 30, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using the Signature Trims website and services (located at
              signaturetrims.com), you agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Services Description</h2>
            <p className="text-gray-600 mb-4">
              Signature Trims is a hair salon that provides professional hair services including but
              not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Hair cutting and styling</li>
              <li>Hair colouring and highlights</li>
              <li>Perms and hair rebonding</li>
              <li>Keratin treatments</li>
              <li>Scalp treatments</li>
            </ul>
            <p className="text-gray-600">
              We also offer online appointment booking through our website and messaging platforms
              (WhatsApp, Telegram) powered by our AI booking assistant.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Appointment Booking</h2>
            <p className="text-gray-600 mb-4">When booking an appointment through our platform:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>You agree to provide accurate contact information</li>
              <li>Appointment confirmations will be sent via your preferred messaging platform</li>
              <li>
                We require reasonable notice for cancellations (preferably 24 hours in advance)
              </li>
              <li>No-shows or late cancellations may affect future booking privileges</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Pricing and Payment</h2>
            <p className="text-gray-600 mb-4">
              Prices listed on our website are in Singapore Dollars (SGD) and are subject to change.
              Final pricing may vary based on hair length, condition, and additional services
              requested. Payment is due upon completion of services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              When you create an account or connect via WhatsApp/Telegram:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You agree to notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600">
              All content on this website, including text, graphics, logos, and images, is the
              property of Signature Trims and is protected by applicable intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-600">
              Signature Trims shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of our services or website. Our liability
              is limited to the amount paid for the specific service in question.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting to the website. Your continued use of our services
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms of Service, please contact us via our
              website or visit us at our salon location.
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
