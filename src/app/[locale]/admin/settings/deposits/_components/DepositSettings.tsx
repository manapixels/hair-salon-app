'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';

interface DepositSettings {
  depositEnabled: boolean;
  depositAmount: number;
  depositTrustThreshold: number;
  depositRefundWindowHours: number;
}

export default function DepositSettings() {
  const t = useTranslations('Admin.Settings.Deposits');
  const tSettings = useTranslations('Admin.Settings');
  const tCommon = useTranslations('Admin.Common');

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const [settings, setSettings] = useState<DepositSettings>({
    depositEnabled: true,
    depositAmount: 500, // Default 500 cents ($5.00)
    depositTrustThreshold: 1,
    depositRefundWindowHours: 24,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Local string state for inputs to allow flexible typing
  const [amountInput, setAmountInput] = useState('5.00');
  const [refundWindowInput, setRefundWindowInput] = useState('24');
  const [thresholdInput, setThresholdInput] = useState('1');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = (await response.json()) as {
          depositEnabled?: boolean;
          depositAmount?: number;
          depositTrustThreshold?: number;
          depositRefundWindowHours?: number;
        };
        setSettings({
          depositEnabled: data.depositEnabled ?? true,
          depositAmount: data.depositAmount ?? 500,
          depositTrustThreshold: data.depositTrustThreshold ?? 1,
          depositRefundWindowHours: data.depositRefundWindowHours ?? 24,
        });
        // Sync local input state
        setAmountInput(((data.depositAmount ?? 500) / 100).toFixed(2));
        setRefundWindowInput((data.depositRefundWindowHours ?? 24).toString());
        setThresholdInput((data.depositTrustThreshold ?? 1).toString());
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error(t('loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success(t('saved'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" message={tCommon('loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('requirementsTitle')}</span>
            <Switch
              checked={settings.depositEnabled}
              onCheckedChange={checked => setSettings({ ...settings, depositEnabled: checked })}
            />
          </CardTitle>
          <CardDescription>
            {settings.depositEnabled ? t('enabledDesc') : t('disabledDesc')}
          </CardDescription>
        </CardHeader>

        {settings.depositEnabled && (
          <CardContent className="space-y-6">
            {/* Deposit Amount Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('amountLabel')}</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={amountInput}
                    onChange={e => {
                      setAmountInput(e.target.value);
                      // Optional: Live update the settings state if valid, or just wait for blur.
                      // Doing live update lets the example text change immediately.
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setSettings({
                          ...settings,
                          depositAmount: Math.round(val * 100),
                        });
                      }
                    }}
                    onBlur={() => {
                      // On blur, format properly and ensure min value
                      const val = parseFloat(amountInput);
                      const finalAmount = isNaN(val) ? 500 : Math.round(val * 100);
                      // Ensure minimum 50 cents
                      const safeAmount = Math.max(finalAmount, 50);

                      setSettings({ ...settings, depositAmount: safeAmount });
                      setAmountInput((safeAmount / 100).toFixed(2));
                    }}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">SGD</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {t.rich('amountExample', {
                  amount: (settings.depositAmount / 100).toFixed(2),
                  ordinal: getOrdinal(settings.depositTrustThreshold),
                  strong: chunks => <strong className="text-foreground">{chunks}</strong>,
                })}
              </div>
            </div>

            {/* Refund Window Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="refundWindow">{t('refundWindowLabel')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="refundWindow"
                    type="number"
                    min={1}
                    max={72}
                    value={refundWindowInput}
                    onChange={e => {
                      setRefundWindowInput(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setSettings({
                          ...settings,
                          depositRefundWindowHours: val,
                        });
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(refundWindowInput);
                      const finalVal = isNaN(val) ? 24 : Math.max(1, Math.min(72, val));
                      setSettings({ ...settings, depositRefundWindowHours: finalVal });
                      setRefundWindowInput(finalVal.toString());
                    }}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">{t('hoursBefore')}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {t.rich('refundWindowExample', {
                  hours: settings.depositRefundWindowHours,
                  strong: chunks => <strong className="text-foreground">{chunks}</strong>,
                })}
              </div>
            </div>

            {/* Trust Threshold Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="threshold">{t('thresholdLabel')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={10}
                    value={thresholdInput}
                    onChange={e => {
                      setThresholdInput(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setSettings({
                          ...settings,
                          depositTrustThreshold: val,
                        });
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(thresholdInput);
                      const finalVal = isNaN(val) ? 1 : Math.max(1, Math.min(10, val));
                      setSettings({ ...settings, depositTrustThreshold: finalVal });
                      setThresholdInput(finalVal.toString());
                    }}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">{t('visits')}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {t.rich('thresholdExample', {
                  threshold: settings.depositTrustThreshold,
                  ordinal: getOrdinal(settings.depositTrustThreshold),
                  strong: chunks => <strong className="text-foreground">{chunks}</strong>,
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? tSettings('saving') : tSettings('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
