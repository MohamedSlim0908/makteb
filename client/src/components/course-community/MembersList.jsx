import { MessageCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { getMemberLocation, getMemberPresence } from './mockData';

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

export function MembersList({ members = [] }) {
  return (
    <div className="space-y-0">
      {members.map((member) => {
        const presence = getMemberPresence(member.user?.id || member.id);
        const location = getMemberLocation(member.user?.id || member.id);
        return (
          <div
            key={member.id}
            className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar src={member.user?.avatar} name={member.user?.name} size="lg" />
                {presence.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{member.user?.name}</p>
                <p className="text-sm text-gray-500">{buildHandle(member)}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{presence.isOnline ? 'Online' : `${presence.lastSeenMinutes}m ago`}</span>
                  <span>{location.city}</span>
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

      {!members.length && (
        <div className="py-16 text-center text-gray-500">
          No members found.
        </div>
      )}
    </div>
  );
}
