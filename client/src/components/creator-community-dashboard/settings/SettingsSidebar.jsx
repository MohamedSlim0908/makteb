const SETTINGS_SECTIONS = [
  'Dashboard',
  'Payouts',
  'Invite',
  'General',
  'Subscriptions',
  'Categories',
  'Plugins',
  'Metrics',
  'Gamification',
  'Links',
  'Billing & referrals',
];

export function SettingsSidebar({ activeSection, onSectionChange }) {
  return (
    <nav className="space-y-1 p-3">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section}
          type="button"
          onClick={() => onSectionChange(section)}
          className={`block w-full rounded-lg px-3 py-2.5 text-left text-lg font-medium transition-colors ${
            activeSection === section
              ? 'bg-[#edd38a] text-gray-900'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {section}
        </button>
      ))}
    </nav>
  );
}

export const SETTINGS_SECTION_OPTIONS = SETTINGS_SECTIONS;
