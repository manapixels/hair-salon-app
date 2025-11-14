export type SettingsSection = 'salon-business' | 'salon-schedule' | 'salon-closures';

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
  ];

  const salonSections = sectionConfig.filter(s => s.group === 'salon');
  const personalSections = sectionConfig.filter(s => s.group === 'personal');

  return (
    <div className="w-64 bg-[var(--gray-2)] border-r border-[var(--gray-6)] p-[var(--space-4)] space-y-[var(--space-6)] sticky top-0 h-[calc(100vh-200px)] overflow-y-auto">
      {/* Salon Settings Group */}
      <div>
        <h3 className="text-[length:var(--font-size-2)] font-bold text-[var(--gray-11)] uppercase tracking-wider mb-[var(--space-3)] px-[var(--space-2)]">
          Salon
        </h3>
        <nav className="space-y-[var(--space-1)]">
          {salonSections.map(section => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center space-x-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-2)] text-left transition-all ${
                activeSection === section.id
                  ? 'bg-[var(--accent-3)] text-[var(--accent-11)] font-medium border-l-4 border-[var(--accent-9)]'
                  : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]'
              }`}
            >
              <span
                className={
                  activeSection === section.id ? 'text-[var(--accent-11)]' : 'text-[var(--gray-10)]'
                }
              >
                {section.icon}
              </span>
              <span className="text-[length:var(--font-size-2)]">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Settings Group (Future) */}
      {personalSections.length > 0 && (
        <div>
          <h3 className="text-[length:var(--font-size-2)] font-bold text-[var(--gray-11)] uppercase tracking-wider mb-[var(--space-3)] px-[var(--space-2)]">
            Personal
          </h3>
          <nav className="space-y-[var(--space-1)]">
            {personalSections.map(section => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center space-x-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-2)] text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-[var(--accent-3)] text-[var(--accent-11)] font-medium border-l-4 border-[var(--accent-9)]'
                    : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]'
                }`}
              >
                <span
                  className={
                    activeSection === section.id
                      ? 'text-[var(--accent-11)]'
                      : 'text-[var(--gray-10)]'
                  }
                >
                  {section.icon}
                </span>
                <span className="text-[length:var(--font-size-2)]">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Help Section */}
      <div className="pt-[var(--space-4)] border-t border-[var(--gray-6)]">
        <div className="p-[var(--space-3)] bg-[var(--blue-3)] border border-[var(--blue-6)] rounded-[var(--radius-2)]">
          <div className="flex items-start space-x-[var(--space-2)]">
            <svg
              className="w-4 h-4 text-[var(--blue-11)] flex-shrink-0 mt-0.5"
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
              <p className="text-[length:var(--font-size-1)] text-[var(--gray-12)] font-medium mb-1">
                Need Help?
              </p>
              <p className="text-[length:var(--font-size-1)] text-[var(--gray-11)]">
                Changes are saved automatically when you click the save button.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
