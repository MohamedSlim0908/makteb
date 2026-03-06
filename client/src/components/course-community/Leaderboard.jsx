import { Trophy } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';

const RANK_COLORS = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-amber-600 text-white',
};

export function Leaderboard({ entries, compact = false, onViewAll }) {
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
        {entries?.map((entry, idx) => {
          const rank = entry.rank || idx + 1;
          const rankClass = RANK_COLORS[rank] || 'bg-gray-100 text-gray-600';
          return (
            <div
              key={entry.user?.id || rank}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankClass}`}>
                {rank}
              </span>
              <Avatar src={entry.user?.avatar} name={entry.user?.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{entry.user?.name}</p>
                <p className="text-xs text-gray-500">{entry.level || 'Newcomer'}</p>
              </div>
              <span className="text-sm font-bold text-gray-900">{entry.totalPoints || entry.points} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
