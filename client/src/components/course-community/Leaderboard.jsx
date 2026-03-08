import { Trophy } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { PaginationNavigation } from '../ui/PaginationNavigation';

const RANK_COLORS = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-amber-600 text-white',
};

export function Leaderboard({ entries, compact = false, onViewAll, page, totalPages, onPageChange }) {
  if (compact) {
    return (
      <div className="space-y-1">
        {entries?.slice(0, 5).map((entry, idx) => (
          <div key={entry.user?.id || idx} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 text-xs font-bold text-gray-400 text-center">{idx + 1}</span>
              <Avatar src={entry.user?.avatar} name={entry.user?.name} size="sm" />
              <span className="text-sm text-gray-900 font-medium truncate">{entry.user?.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-600">{entry.totalPoints || entry.points}</span>
          </div>
        ))}
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="w-full mt-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View all
          </button>
        )}
      </div>
    );
  }

  const maxPoints = entries?.[0]?.points || entries?.[0]?.totalPoints || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h2 className="font-bold text-gray-900">Leaderboard</h2>
        <span className="text-sm text-gray-400 ml-1">30-day</span>
      </div>
      <div>
        {(!entries || entries.length === 0) && (
          <EmptyState
            icon={Trophy}
            title="No activity yet"
            description="Points earned by members will be shown here."
            className="py-10"
          />
        )}
        {entries?.map((entry) => {
          const rank = entry.rank;
          const rankClass = RANK_COLORS[rank] || 'bg-gray-100 text-gray-600';
          const isTop3 = rank <= 3;
          const points = entry.totalPoints || entry.points || 0;
          const barWidth = Math.max(4, (points / maxPoints) * 100);

          return (
            <div
              key={entry.user?.id || rank}
              className={`flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors ${
                isTop3 ? 'bg-gradient-to-r from-yellow-50/60 to-transparent py-4' : 'hover:bg-gray-50/50'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankClass}`}>
                {rank}
              </span>
              <Avatar src={entry.user?.avatar} name={entry.user?.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{entry.user?.name}</p>
                <p className="text-xs text-gray-500">{entry.level || 'Newcomer'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:block w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-16 text-right">{points} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="px-5 py-3 border-t border-gray-100">
          <PaginationNavigation
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
