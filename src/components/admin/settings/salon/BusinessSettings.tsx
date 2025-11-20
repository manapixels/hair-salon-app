import { TextField } from '@/components/ui/TextField';

interface BusinessSettingsProps {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  onChange: (field: 'businessName' | 'businessAddress' | 'businessPhone', value: string) => void;
}

export default function BusinessSettings({
  businessName,
  businessAddress,
  businessPhone,
  onChange,
}: BusinessSettingsProps) {
  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h3 className="text-[length:var(--font-size-5)] font-bold text-[var(--gray-12)] mb-[var(--space-2)]">
          Business Information
        </h3>
        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
          Update your salon&apos;s public contact information. This appears in booking confirmations
          and notifications.
        </p>
      </div>

      <div className="space-y-[var(--space-4)]">
        <TextField
          label="Business Name"
          id="businessName"
          type="text"
          value={businessName}
          onChange={e => onChange('businessName', e.target.value)}
          placeholder="e.g., Signature Trims Hair Salon"
          required
        />

        <TextField
          label="Business Address"
          id="businessAddress"
          type="text"
          value={businessAddress}
          onChange={e => onChange('businessAddress', e.target.value)}
          placeholder="e.g., 123 Main St, Singapore 123456"
          required
        />

        <TextField
          label="Business Phone"
          id="businessPhone"
          type="tel"
          value={businessPhone}
          onChange={e => onChange('businessPhone', e.target.value)}
          placeholder="e.g., (65) 9876-5432"
          required
        />
      </div>

      <div className="p-[var(--space-4)] bg-[var(--accent-3)] border border-[var(--accent-6)] rounded-[var(--radius-3)]">
        <div className="flex items-start space-x-[var(--space-3)]">
          <svg
            className="w-5 h-5 text-[var(--accent-11)] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-[length:var(--font-size-2)] text-[var(--gray-12)] font-medium mb-1">
              Where is this displayed?
            </p>
            <ul className="text-[length:var(--font-size-1)] text-[var(--gray-11)] space-y-1 list-disc list-inside">
              <li>WhatsApp and Telegram booking confirmations</li>
              <li>Appointment reminder messages</li>
              <li>Business hours command (/hours)</li>
              <li>Customer dashboard contact information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
