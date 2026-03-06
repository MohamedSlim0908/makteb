const DEFAULT_TABS = [
  'Community',
  'Classroom',
  'Calendar',
  'Members',
  'Leaderboards',
  'About',
];

export function CommunityTabs({ activeTab, onTabChange, tabs = DEFAULT_TABS }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
