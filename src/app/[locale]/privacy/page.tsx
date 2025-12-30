import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Signature Trims',
  description: 'Privacy policy for Signature Trims hair salon website and services.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-white py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-serif font-light text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: December 30, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Signature Trims (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your
              privacy and is committed to protecting your personal data. This privacy policy
              explains how we collect, use, and safeguard your information when you use our website
              (signaturetrims.com) and services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect the following types of information:</p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Name and contact details (phone number, email)</li>
              <li>Appointment history and preferences</li>
              <li>Communication history via WhatsApp or Telegram</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Process and manage your appointment bookings</li>
              <li>Send appointment reminders and confirmations</li>
              <li>Provide customer service and respond to inquiries</li>
              <li>Improve our services and personalize your experience</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p className="text-gray-600 mb-4">
              We use the following third-party services to operate our platform:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Google Calendar:</strong> To sync stylist schedules (for stylists who choose
                to connect their accounts)
              </li>
              <li>
                <strong>WhatsApp/Telegram:</strong> For appointment booking and communication
              </li>
              <li>
                <strong>Google OAuth:</strong> For secure authentication
              </li>
              <li>
                <strong>Analytics services:</strong> To understand website usage patterns
              </li>
            </ul>
            <p className="text-gray-600 mt-4">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Google Calendar Integration
            </h2>
            <p className="text-gray-600 mb-4">
              Our stylists may connect their Google Calendar to sync appointments. When this
              happens:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                We only access calendar permissions necessary to create, update, and delete
                appointment events
              </li>
              <li>We store OAuth tokens securely and encrypted</li>
              <li>
                Stylists can disconnect their Google Calendar at any time from their dashboard
              </li>
              <li>
                Customer data shared in calendar events is limited to appointment-relevant
                information only
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational measures to protect your
              personal data against unauthorized access, alteration, disclosure, or destruction.
              This includes encrypted data transmission, secure database storage, and access
              controls.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-600">
              We retain your personal data only for as long as necessary to fulfill the purposes
              outlined in this policy, unless a longer retention period is required by law.
              Appointment history may be retained for business record-keeping purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent where applicable</li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise these rights, please contact us through our website or messaging channels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
            <p className="text-gray-600">
              We use cookies and similar technologies to enhance your browsing experience, remember
              your preferences, and analyze website traffic. You can control cookie settings through
              your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-600">
              We may update this privacy policy from time to time. Any changes will be posted on
              this page with an updated revision date. We encourage you to review this policy
              periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us through our website or visit us at our salon location.
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm">
              See also our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
