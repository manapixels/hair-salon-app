import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">Business Information</h2>
        <p className="text-muted-foreground">
          Update your salon&apos;s public contact information.
        </p>
      </div>

      <div className="grid w-full max-w-sm items-center gap-3">
        <Label>Business Name</Label>
        <Input
          id="businessName"
          type="text"
          value={businessName}
          onChange={e => onChange('businessName', e.target.value)}
          placeholder="e.g., Signature Trims Hair Salon"
          required
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-3">
        <Label>Business Address</Label>
        <Input
          id="businessAddress"
          type="text"
          value={businessAddress}
          onChange={e => onChange('businessAddress', e.target.value)}
          placeholder="e.g., 123 Main St, Singapore 123456"
          required
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-3">
        <Label>Business Phone</Label>
        <Input
          id="businessPhone"
          type="tel"
          value={businessPhone}
          onChange={e => onChange('businessPhone', e.target.value)}
          placeholder="e.g., (65) 9876-5432"
          required
        />
      </div>

      <div className="p-4 bg-primary/10 border border-primary rounded-lg">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-md text-foreground font-medium mb-1">Where is this displayed?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
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
