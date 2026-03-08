import { useMemo } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const ROLE_BADGE_CONFIG = {
  OWNER: { label: 'Owner', className: 'bg-purple-100 text-purple-700' },
  ADMIN: { label: 'Admin', className: 'bg-blue-100 text-blue-700' },
  MODERATOR: { label: 'Mod', className: 'bg-green-100 text-green-700' },
};

function buildHandle(member) {
  const base = (member.user?.name || 'member').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `@${base}`;
}

function formatJoinedDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function computeMemberLevel(userId, leaderboard, levels) {
  const entry = leaderboard?.find(e => e.user?.id === userId);
  if (!entry) return { levelName: 'Newcomer', points: 0 };
  const points = entry.points || 0;
  if (!levels?.length) return { levelName: entry.level || 'Newcomer', points };
  const sortedDesc = [...levels].sort((a, b) => b.minPoints - a.minPoints);
  const matched = sortedDesc.find(l => points >= l.minPoints);
  return { levelName: matched?.name || 'Newcomer', points };
}

export function MembersList({ members = [], isLoading = false, searchQuery, leaderboard, levels }) {
  const filteredMembers = useMemo(() => {
    if (!searchQuery?.trim()) return members;
    const q = searchQuery.trim().toLowerCase();
    return members.filter(m => (m.user?.name || '').toLowerCase().includes(q));
  }, [members, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="member" />)}
      </div>
    );
  }

  const isFiltering = searchQuery?.trim();

  return (
    <div className="space-y-0">
      {isFiltering && (
        <p className="text-sm text-gray-500 mb-3">
          Showing {filteredMembers.length} of {members.length} members
        </p>
      )}

      {filteredMembers.map((member) => {
        const badge = ROLE_BADGE_CONFIG[member.role];
        const { levelName, points } = computeMemberLevel(member.user?.id || member.userId, leaderboard, levels);
        return (
          <div
            key={member.id}
            className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={member.user?.avatar} name={member.user?.name} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{member.user?.name}</p>
                  {badge && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{buildHandle(member)}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{levelName} · {points} pts</span>
                  <span>Joined {formatJoinedDate(member.joinedAt)}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </div>
        );
      })}

      {filteredMembers.length === 0 && (
        <EmptyState
          icon={Users}
          title={isFiltering ? 'No members found' : 'No members yet'}
          description={isFiltering ? 'Try a different search term.' : 'Members will appear here once they join.'}
        />
      )}
    </div>
  );
}
