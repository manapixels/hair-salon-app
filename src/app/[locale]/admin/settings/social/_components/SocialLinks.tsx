'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Instagram, Facebook } from 'lucide-react';
import { WhatsAppIcon, TelegramIcon } from '@/lib/icons';
import { queryKeys } from '@/hooks/queryKeys';
import type { SocialLinks } from '@/types';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';

const defaultSocialLinks: SocialLinks = {
  instagram: { url: '', isActive: false },
  facebook: { url: '', isActive: false },
  whatsapp: { url: '', isActive: false },
  telegram: { url: '', isActive: false },
};

export default function SocialLinks() {
  const queryClient = useQueryClient();
  const t = useTranslations('Admin.Settings.Social');
  const tSettings = useTranslations('Admin.Settings');
  const tCommon = useTranslations('Admin.Common');

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = (await response.json()) as { socialLinks?: SocialLinks };
        if (data.socialLinks) {
          setSocialLinks(data.socialLinks);
        }
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
        body: JSON.stringify({ socialLinks }),
      });

      if (!response.ok) throw new Error('Failed to save');

      // Invalidate the admin settings cache so all components refetch
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });

      toast.success(t('saved'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (
    platform: keyof SocialLinks,
    field: 'url' | 'isActive',
    value: string | boolean,
  ) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" message={tCommon('loading')} />
      </div>
    );
  }

  const platforms = [
    {
      key: 'instagram' as const,
      label: 'Instagram',
      icon: Instagram,
      placeholder: 'https://instagram.com/yourusername',
    },
    {
      key: 'facebook' as const,
      label: 'Facebook',
      icon: Facebook,
      placeholder: 'https://facebook.com/yourpage',
    },
    {
      key: 'whatsapp' as const,
      label: 'WhatsApp',
      icon: WhatsAppIcon,
      placeholder: 'https://wa.me/1234567890',
    },
    {
      key: 'telegram' as const,
      label: 'Telegram',
      icon: TelegramIcon,
      placeholder: 'https://t.me/yourbotname',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-4">
        {platforms.map(({ key, label, icon: Icon, placeholder }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {label}
                </span>
                <Switch
                  checked={socialLinks[key].isActive}
                  onCheckedChange={checked => updateLink(key, 'isActive', checked)}
                />
              </CardTitle>
              <CardDescription>
                {socialLinks[key].isActive ? t('visible') : t('hidden')}
              </CardDescription>
            </CardHeader>

            {socialLinks[key].isActive && (
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`${key}-url`}>{t('urlLabel')}</Label>
                  <Input
                    id={`${key}-url`}
                    type="url"
                    placeholder={placeholder}
                    value={socialLinks[key].url}
                    onChange={e => updateLink(key, 'url', e.target.value)}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? tSettings('saving') : tSettings('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
