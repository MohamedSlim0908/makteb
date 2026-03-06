import { SlidersHorizontal } from 'lucide-react';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'GENERAL_DISCUSSION', label: 'General discussion' },
];

export function FeedFilters({ activeFilter, onFilterChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
        aria-label="Feed filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
