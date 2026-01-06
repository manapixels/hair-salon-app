import { AdminSettings } from '@/types';
import { useTranslations, useLocale } from 'next-intl';

interface AppFooterProps {
  adminSettings: AdminSettings;
}

export default function AppFooter({ adminSettings }: AppFooterProps) {
  const t = useTranslations('Layout.footer');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const { businessName, businessAddress, businessPhone, weeklySchedule } = adminSettings;

  // Format business hours from weeklySchedule
  const daysOrder = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;
  const dayDisplayNames: Record<string, string> = {
    monday: tCommon('days.monday'),
    tuesday: tCommon('days.tuesday'),
    wednesday: tCommon('days.wednesday'),
    thursday: tCommon('days.thursday'),
    friday: tCommon('days.friday'),
    saturday: tCommon('days.saturday'),
    sunday: tCommon('days.sunday'),
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
  };

  const hoursData = daysOrder.map(day => {
    const schedule = weeklySchedule?.[day];
    if (!schedule || !schedule.openingTime || !schedule.closingTime) {
      return {
        day: dayDisplayNames[day],
        isOpen: false,
        hours: tCommon('closed'),
      };
    }
    return {
      day: dayDisplayNames[day],
      isOpen: schedule.isOpen,
      hours: schedule.isOpen
        ? `${formatTime(schedule.openingTime)} - ${formatTime(schedule.closingTime)}`
        : tCommon('closed'),
    };
  });

  return (
    <footer className="bg-primary-800 text-white/70 py-10 sm:py-20 hidden sm:block">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p>
              &copy; {new Date().getFullYear()} {businessName}. {t('allRightsReserved')}
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <a href={`/${locale}/terms`} className="hover:text-white transition-colors">
                {t('termsOfService')}
              </a>
              <span className="text-white/30">|</span>
              <a href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                {t('privacyPolicy')}
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-serif mb-6 text-brand-primary">{t('visitUs')}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-location-dot mt-1 text-brand-primary"></i>
                <span>{businessAddress}</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-phone mt-1 text-brand-primary"></i>
                <span>{businessPhone}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-serif mb-6 text-brand-primary">{t('hours')}</h4>
            <ul className="space-y-2 text-sm">
              {hoursData.map((item, index) => (
                <li
                  key={item.day}
                  className={`flex justify-between ${index < hoursData.length - 1 ? 'border-b border-white/10 pb-2' : 'pt-2'}`}
                >
                  <span className={!item.isOpen ? 'text-white/50' : ''}>{item.day}</span>
                  <span className={!item.isOpen ? 'text-brand-primary' : ''}>{item.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
