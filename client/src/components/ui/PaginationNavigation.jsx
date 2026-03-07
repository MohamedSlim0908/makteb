import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function createRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function buildPaginationItems(currentPage, totalPages, windowSize) {
  if (totalPages <= 0) return [];

  const halfWindow = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - halfWindow);
  let end = start + windowSize - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }

  const pageSet = new Set([1, totalPages, ...createRange(start, end)]);
  const sortedPages = [...pageSet].sort((a, b) => a - b);
  const items = [];

  sortedPages.forEach((pageNumber, index) => {
    const previousPage = sortedPages[index - 1];
    if (index > 0 && pageNumber - previousPage > 1) {
      items.push({ type: 'ellipsis', key: `ellipsis-${previousPage}-${pageNumber}` });
    }

    items.push({ type: 'page', key: `page-${pageNumber}`, value: pageNumber });
  });

  return items;
}

export function PaginationNavigation({ page, totalPages, onPageChange, className = '' }) {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(max-width: 639px)');

    function handleChange(event) {
      setIsCompact(event.matches);
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  if (totalPages <= 1) return null;

  const items = buildPaginationItems(page, totalPages, isCompact ? 3 : 5);

  return (
    <div className={`mt-10 flex justify-center ${className}`}>
      <div className="max-w-full overflow-x-auto no-scrollbar">
        <div className="inline-flex flex-nowrap items-center justify-center gap-3 whitespace-nowrap rounded-full bg-transparent px-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {items.map((item) => {
            if (item.type === 'ellipsis') {
              return (
                <span key={item.key} className="px-1 text-sm font-medium text-gray-500">
                  ...
                </span>
              );
            }

            const isActive = item.value === page;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onPageChange(item.value)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#E5C97A] font-semibold text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.value}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
