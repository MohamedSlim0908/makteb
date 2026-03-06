import { X } from 'lucide-react';

export function SettingsHeader({ community, onClose }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {community.iconImage ? (
          <img
            src={community.iconImage}
            alt={community.name}
            className="h-11 w-11 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: community.avatarColor || '#767676' }}
          >
            {community.avatarInitials || 'SB'}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-gray-900">{community.name}</p>
          <p className="text-sm text-gray-500">Group settings</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Close settings"
      >
        <X className="h-5 w-5" />
      </button>
    </header>
  );
}
