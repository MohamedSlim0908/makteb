export function CourseTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="h-12 border-b border-gray-200 bg-white">
      <div className="h-full flex items-center gap-6 overflow-x-auto no-scrollbar px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`h-full whitespace-nowrap border-b-2 text-base transition-colors ${
              activeTab === tab.id
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
