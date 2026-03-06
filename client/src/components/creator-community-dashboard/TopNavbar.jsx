import { Bell, ChevronDown, MessageCircle, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export function TopNavbar({ community }) {
  const communityName = community.name;
  const initials = community.avatarInitials
    || communityName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50"
        >
          {community.iconImage ? (
            <img
              src={community.iconImage}
              alt={communityName}
              className="h-8 w-8 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: community.avatarColor || '#767676' }}
            >
              {initials}
            </span>
          )}
          <span className="truncate text-lg font-semibold text-gray-900">{communityName}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        </button>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-[520px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              readOnly
              value="Search"
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-500 outline-none"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Messages"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <Avatar name="Creator" size="sm" />
        </div>
      </div>
    </header>
  );
}
