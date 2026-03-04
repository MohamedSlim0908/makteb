import { Avatar } from '../ui/Avatar';

export function Leaderboard({ entries, compact = false, onViewAll }) {
  if (compact) {
    return (
      <div className="space-y-1">
        {entries?.slice(0, 5).map((entry) => (
          <div key={entry.user?.id || entry.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 text-xs text-gray-500">{entry.rank}</span>
              <Avatar src={entry.user?.avatar} name={entry.user?.name} size="sm" />
              <span className="text-sm text-gray-900 truncate">{entry.user?.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">+{entry.points}</span>
          </div>
        ))}
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="w-full mt-2 text-sm text-primary-600 hover:underline"
          >
            View full leaderboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Leaderboard (30-day)</h2>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Member</th>
            <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Points</th>
            <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries?.map((entry) => (
            <tr key={entry.user?.id || entry.rank}>
              <td className="px-5 py-3 text-sm text-gray-700">{entry.rank}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Avatar src={entry.user?.avatar} name={entry.user?.name} size="sm" />
                  <span className="text-sm font-medium text-gray-900">{entry.user?.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-right text-sm font-medium text-gray-700">{entry.points}</td>
              <td className="px-5 py-3 text-right text-sm text-gray-600">{entry.level || 'Newcomer'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
