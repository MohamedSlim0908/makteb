import { CalendarDays, Clock3, MessageCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { getMemberLocation, getMemberPresence } from './mockData';

function buildHandle(member) {
  const base = (member.user?.name || 'member').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `@${base}-${String(member.user?.id || member.id).slice(0, 4)}`;
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
    <div className="bg-white rounded-xl border border-gray-200">
      {members.map((member, index) => {
        const presence = getMemberPresence(member.user?.id || member.id);
        const location = getMemberLocation(member.user?.id || member.id);
        return (
          <div
            key={member.id}
            className={`px-4 py-4 ${index !== members.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar src={member.user?.avatar} name={member.user?.name} size="lg" />
                <div className="min-w-0">
                  <p className="text-2xl font-semibold text-gray-900 truncate">{member.user?.name}</p>
                  <p className="text-sm text-gray-500">{buildHandle(member)}</p>
                  <p className="text-lg text-gray-700 mt-2">
                    {presence.isOnline ? 'Online now' : `Active ${presence.lastSeenMinutes}m ago`}
                  </p>
                  <div className="mt-2 text-base text-gray-600 space-y-1">
                    <p className="inline-flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-gray-400" />
                      {presence.isOnline ? 'Active now' : `Active ${presence.lastSeenMinutes}m ago`}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      Joined {formatJoinedDate(member.joinedAt)}
                    </p>
                    <p className="text-sm text-gray-500">{location.city}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                CHAT <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {!members.length && (
        <div className="px-4 py-10 text-center text-gray-500">
          No members found for this course community yet.
        </div>
      )}
    </div>
  );
}
