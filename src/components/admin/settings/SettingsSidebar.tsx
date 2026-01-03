export type SettingsSection =
  | 'salon-business'
  | 'salon-schedule'
  | 'salon-closures'
  | 'salon-services'
  | 'salon-deposits';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export default function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const sectionConfig: Array<{
    id: SettingsSection;
    label: string;
    icon: JSX.Element;
    group: 'salon' | 'personal';
  }> = [
    {
      id: 'salon-business',
      label: 'Business Info',
      group: 'salon',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: 'salon-schedule',
      label: 'Default Hours',
      group: 'salon',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'salon-closures',
      label: 'Closures',
      group: 'salon',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    {
      id: 'salon-services',
      label: 'Services & Pricing',
      group: 'salon',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      id: 'salon-deposits',
      label: 'Deposits',
      group: 'salon',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  const salonSections = sectionConfig.filter(s => s.group === 'salon');
  const personalSections = sectionConfig.filter(s => s.group === 'personal');

  return (
    <div className="w-64 bg-muted border-r border-border p-4 space-y-6 sticky top-0 h-[calc(100vh-200px)] overflow-y-auto">
      {/* Salon Settings Group */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-[3] px-[2]">
          Salon
        </h3>
        <nav className="space-y-[0.5]">
          {salonSections.map(section => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center space-x-[3] px-3 py-2 rounded-md text-left transition-all ${
                activeSection === section.id
                  ? 'bg-primary/10 text-primary font-medium border-l-4 border-[hsl(var(--primary))]'
                  : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
              }`}
            >
              <span className={activeSection === section.id ? 'text-primary' : 'text-gray-500'}>
                {section.icon}
              </span>
              <span className="text-sm">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Settings Group (Future) */}
      {personalSections.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-[3] px-[2]">
            Personal
          </h3>
          <nav className="space-y-[0.5]">
            {personalSections.map(section => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center space-x-[3] px-3 py-2 rounded-md text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-primary/10 text-primary font-medium border-l-4 border-[hsl(var(--primary))]'
                    : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                }`}
              >
                <span className={activeSection === section.id ? 'text-primary' : 'text-gray-500'}>
                  {section.icon}
                </span>
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Help Section */}
      <div className="pt-[4] border-t border-border">
        <div className="p-3 bg-blue-50 border border-blue-500 rounded-md">
          <div className="flex items-start space-x-[2]">
            <svg
              className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5"
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
          </div>
        </div>
      </div>
    </div>
  );
}
