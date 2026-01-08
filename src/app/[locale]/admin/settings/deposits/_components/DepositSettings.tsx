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
  depositPercentage: number;
  depositTrustThreshold: number;
  depositRefundWindowHours: number;
}

export default function DepositSettings() {
  const t = useTranslations('Admin.Settings.Deposits');
  const tSettings = useTranslations('Admin.Settings');
  const tCommon = useTranslations('Admin.Common');

  const [settings, setSettings] = useState<DepositSettings>({
    depositEnabled: true,
    depositPercentage: 15,
    depositTrustThreshold: 1,
    depositRefundWindowHours: 24,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = (await response.json()) as {
          depositEnabled?: boolean;
          depositPercentage?: number;
          depositTrustThreshold?: number;
          depositRefundWindowHours?: number;
        };
        setSettings({
          depositEnabled: data.depositEnabled ?? true,
          depositPercentage: data.depositPercentage ?? 15,
          depositTrustThreshold: data.depositTrustThreshold ?? 1,
          depositRefundWindowHours: data.depositRefundWindowHours ?? 24,
        });
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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="percentage">{t('percentageLabel')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="percentage"
                    type="number"
                    min={1}
                    max={100}
                    value={settings.depositPercentage}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        depositPercentage: parseInt(e.target.value) || 15,
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('percentageDesc')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">{t('thresholdLabel')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={10}
                    value={settings.depositTrustThreshold}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        depositTrustThreshold: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-muted-foreground">{t('visits')}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('thresholdDesc')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refundWindow">{t('refundWindowLabel')}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="refundWindow"
                  type="number"
                  min={1}
                  max={72}
                  value={settings.depositRefundWindowHours}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      depositRefundWindowHours: parseInt(e.target.value) || 24,
                    })
                  }
                  className="w-24"
                />
                <span className="text-muted-foreground">{t('hoursBefore')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('refundWindowDesc')}</p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">{t('exampleTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t.rich('exampleText', {
                  depositAmount: ((100 * settings.depositPercentage) / 100).toFixed(2),
                  threshold: settings.depositTrustThreshold,
                  plural: settings.depositTrustThreshold > 1 ? 's' : '',
                  strong: chunks => <strong>{chunks}</strong>,
                })}
              </p>
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
