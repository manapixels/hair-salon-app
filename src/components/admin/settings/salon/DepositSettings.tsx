'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface DepositSettings {
  depositEnabled: boolean;
  depositPercentage: number;
  depositTrustThreshold: number;
  depositRefundWindowHours: number;
}

export default function DepositSettings() {
  const [settings, setSettings] = useState<DepositSettings>({
    depositEnabled: true,
    depositPercentage: 15,
    depositTrustThreshold: 1,
    depositRefundWindowHours: 24,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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
      toast.error('Failed to load deposit settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success('Deposit settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">No-Show Protection</h2>
        <p className="text-muted-foreground">
          Require deposits from first-time customers to reduce no-shows
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deposit Requirements</span>
            <Switch
              checked={settings.depositEnabled}
              onCheckedChange={checked => setSettings({ ...settings, depositEnabled: checked })}
            />
          </CardTitle>
          <CardDescription>
            {settings.depositEnabled
              ? 'First-time customers must pay a deposit when booking'
              : 'Deposits are disabled - all customers can book without payment'}
          </CardDescription>
        </CardHeader>

        {settings.depositEnabled && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="percentage">Deposit Percentage</Label>
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
                <p className="text-xs text-muted-foreground">
                  Percentage of service price required as deposit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Trust Threshold</Label>
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
                  <span className="text-muted-foreground">visits</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed visits before customer can skip deposit
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refundWindow">Refund Window</Label>
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
                <span className="text-muted-foreground">hours before appointment</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cancellations within this window will forfeit the deposit
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Example</h4>
              <p className="text-sm text-muted-foreground">
                A first-time customer booking a $100 service will pay a{' '}
                <strong>${((100 * settings.depositPercentage) / 100).toFixed(2)}</strong> deposit.
                After {settings.depositTrustThreshold} completed visit
                {settings.depositTrustThreshold > 1 ? 's' : ''}, they can book without a deposit.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
